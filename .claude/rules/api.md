---
paths:
  - "app/api/**"
---

# API route ルール（app/api/**）

## 認証（現状の設計と制約）
- admin 系（setup / seed-prices / inventory）は `X-Admin-Key` ヘッダ ==
  `SUPABASE_SERVICE_ROLE_KEY` で認証する（`?.trim()` 比較まで既存実装に合わせる）
- **既知の穴（直すときは docs/specs/api-auth-hardening.md に従う）**：
  `GET /api/quotes`・`GET /api/quotes/[id]`・`/api/admin/dealers` 全メソッドは無認証。
  新しいエンドポイントをこのパターンで増やさない — 見積データ・マスタ書き込みを扱う
  route には最低でも X-Admin-Key チェックを付けること
- 管理画面ページの認証ガードはクライアント側のみ（getSession → redirect）。
  「画面が守られている＝API が守られている」ではない

## 実装パターン（既存に合わせる）
- try/catch で包み、エラーは `NextResponse.json({ error: <message> }, { status })`。
  400（入力不正）/ 401（未認証）/ 404 / 500 を使い分ける
- Supabase 呼び出しは戻り値の `{ error }` を**必ず**チェックして 500 を返す
  （save-quote の insert が未チェックなのは既知の罠であり、真似しない）
- DB を読む GET には `export const dynamic = 'force-dynamic'` を付ける
  （Next.js 14 は GET route handler を静的キャッシュする）
- 書き込みは createServiceClient() 経由。リクエストボディの必須フィールドを検証してから使う
- 金額・合計をクライアントから受け取る場合の再計算はしていない（save-quote が実例）。
  改修する場合は docs/specs/ に仕様を書き、サーバー側再計算をテスト付きで導入する

## メール（lib/email.ts 経由）
- 通知先 G.TRES アドレス・送信元 onboarding@resend.dev はドメイン未検証 Resend の制約による
  暫定実装（docs/adr/0003 補足参照）。外部アドレスを To/CC に足すと送信ごと失敗しうる
- メール送信失敗は見積保存を失敗させない（catch して console.error）を維持する
