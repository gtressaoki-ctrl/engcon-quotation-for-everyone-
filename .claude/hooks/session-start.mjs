#!/usr/bin/env node
// SessionStart hook: node_modules が無い環境（クラウドセッション等）で依存を自動インストールし、
// セッション開始直後から typecheck / lint / test が使える状態にする。
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

if (existsSync('node_modules')) process.exit(0);

try {
  console.log('node_modules が無いため npm ci を実行します（初回のみ・数十秒）...');
  execSync('npm ci --no-audit --no-fund', { stdio: 'inherit', timeout: 600_000 });
  console.log('依存インストール完了。npm run typecheck / lint / test が利用可能です。');
} catch {
  console.error('npm ci に失敗しました。手動で npm ci を実行してから作業を始めてください。');
}
process.exit(0);
