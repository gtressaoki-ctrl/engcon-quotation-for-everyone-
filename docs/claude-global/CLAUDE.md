# グローバル CLAUDE.md（C:\Users\saoki\.claude\CLAUDE.md 用）

> このファイルはリポジトリ `engcon-quotation-for-everyone-` の docs/claude-global/ で
> 管理し、Windows 機の `C:\Users\saoki\.claude\CLAUDE.md` にコピーして使う。
> 導入手順は同ディレクトリの INSTALL.md を参照。

## ユーザー環境
- OS：Windows / シェル：PowerShell / ホーム：`C:\Users\saoki`
- コマンド例は PowerShell 構文で提示する（`&&` 連結や bash 構文をそのまま出さない。
  PowerShell 7 未満では `;` で連結、パス区切りは `\`）
- クラウド（Claude Code on the web）セッションは Linux コンテナなので bash でよい

## 標準スタック（新規プロジェクトの既定）
- Next.js 14（App Router）/ TypeScript strict / Tailwind CSS
- DB・認証：Supabase（RLS 必須）
- ホスティング：Vercel（プレビュー→本番）
- モバイル対応が要るものは PWA（manifest + service worker）

## コミット規約
- メッセージは日本語・変更内容が 1 行目で分かる形（例：「S40 DM の品番を 1084265 に修正」）
- 1 commit = 1 論点。データ（品番・価格）変更は**出典を本文に明記**
- テスト・typecheck・lint が通らない状態で commit しない
- 作業完了後は必ず push まで行い、デプロイ（Vercel）の成功を確認する

## 報告スタイル
- 日本語、**結論先行**（1 行目に結果、詳細は後）
- 選択肢を出すときは必ず「各案の理由とトレードオフ」を付け、推奨案を明示する
- できなかったこと・スキップしたことは正直に書く（できたことのように書かない）

## 後継モデルへの指示（必読）
1. **仕様外の判断は実装前に必ずユーザー確認**。仕様は docs/specs/、決定事項は docs/adr/ にある。
   そこに無いことを推測で実装しない
2. **docs/adr/ の決定に反する変更は禁止**。変更したい場合は ADR 改訂案を提示して承認を得る
3. **テスト未通過の commit 禁止**（`npm run typecheck && npm run lint && npm run test`）
4. **複雑タスクは `.claude/skills/deep-reasoning/SKILL.md` に従って計画してから実装**
   （複数ファイル・新機能・スキーマ変更・価格/品番ロジックが対象）
5. commit 前に `.claude/skills/code-review/SKILL.md` でセルフレビュー
6. 各リポジトリの CLAUDE.md・HANDOVER.md を作業開始時に必ず読む
