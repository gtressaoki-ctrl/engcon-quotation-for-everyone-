# ADR-0002: PDF 生成は行わない

- Status: Accepted
- 日付: 2026-07-05（ユーザー決定）

## Context
初期仕様（README v1.0）には Puppeteer による HTML→PDF 生成、Supabase Storage への保存、
`/api/generate-pdf` route が計画されていた。その痕跡として以下がリポジトリに残っていた：
- `vercel.json` の `app/api/generate-pdf/route.ts` への functions 設定（route 自体は存在しない）
- `components/pdf/QuoteTemplate.ts`（289 行の A4 見積テンプレ HTML。どこからも import されない孤児）
- `quotes.pdf_path` カラム（常に null）と `quotes` ストレージバケット（未使用）

しかし実運用では、見積の確認・共有は管理ダッシュボード（一覧・詳細・CSV）と
保存時のメール通知で足りており、PDF の必要性が確認されないまま未実装が続いていた。

## Decision
**PDF 生成機能は実装しない**（2026-07-05 ユーザー決定）。
見積のアウトプットは以下で完結させる：
1. Supabase への保存（quotes / quote_items）
2. ディーラー作成時の G.TRES へのメール通知
3. `/admin/dashboard` での閲覧・CSV エクスポート・改訂

付随して、誤解を招くデッドコードを削除する：
- `vercel.json` の generate-pdf functions 設定 → 削除
- `components/pdf/QuoteTemplate.ts` → 削除（必要になれば git 履歴から復元可能）
- `quotes.pdf_path` カラム・`quotes` バケットは DB 変更を伴うため**残置**し、HANDOVER.md に記録

## Rejected alternatives
- **Puppeteer / serverless Chromium（README 原案）**：Vercel serverless での Chromium 運用は
  バンドルサイズ・コールドスタート・保守の負担が大きい。必要性が確認されていない機能に
  対して過大な投資
- **ブラウザ印刷方式（/print ページ + window.print）**：依存追加ゼロで実装可能だが、
  ユーザーの判断は「PDF 出力自体が不要」。画面と CSV で業務が回っているため見送り

## Consequences
- 後継モデルは PDF 関連の実装依頼を受けた場合、まず本 ADR を提示してユーザーに
  「決定を覆すか」を確認すること（覆す場合は本 ADR を Superseded にして新 ADR を書く）
- QuoteTemplate.ts の見積書レイアウト（判子欄・銀行口座・インボイス登録番号）が将来
  必要になったら、削除 commit から復元する
