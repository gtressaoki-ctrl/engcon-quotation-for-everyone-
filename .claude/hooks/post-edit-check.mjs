#!/usr/bin/env node
// PostToolUse hook（Edit/Write）: .ts/.tsx 編集後に typecheck と対象ファイルの lint を実行し、
// 失敗したら exit 2 で Claude に差し戻す（品質基準の機械化）。
// Windows / Linux 両対応のため bash ではなく Node で書いている。cwd はプロジェクトルート。
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

let raw = '';
process.stdin.setEncoding('utf8');
for await (const chunk of process.stdin) raw += chunk;

let filePath = '';
try {
  const payload = JSON.parse(raw);
  filePath = payload?.tool_input?.file_path ?? '';
} catch {
  process.exit(0);
}

if (!/\.(ts|tsx)$/.test(filePath)) process.exit(0);
if (!existsSync('node_modules')) process.exit(0); // 依存未インストール環境では黙ってスキップ

const problems = [];

try {
  execSync('npx tsc --noEmit', { stdio: 'pipe', timeout: 90_000 });
} catch (err) {
  const out = `${err.stdout ?? ''}${err.stderr ?? ''}`.toString().trim().slice(0, 4000);
  problems.push(`typecheck 失敗（tsc --noEmit）:\n${out}`);
}

try {
  const rel = path.relative(process.cwd(), filePath) || filePath;
  if (existsSync(rel)) {
    execSync(`npx next lint --file ${JSON.stringify(rel)}`, { stdio: 'pipe', timeout: 90_000 });
  }
} catch (err) {
  const out = `${err.stdout ?? ''}${err.stderr ?? ''}`.toString().trim().slice(0, 4000);
  problems.push(`lint 失敗（next lint --file）:\n${out}`);
}

if (problems.length > 0) {
  console.error(problems.join('\n\n'));
  process.exit(2); // exit 2 = stderr が Claude にフィードバックされる
}
process.exit(0);
