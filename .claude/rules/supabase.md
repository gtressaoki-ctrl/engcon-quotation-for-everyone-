---
paths:
  - "supabase/**"
  - "lib/supabase.ts"
  - "lib/quoteNumber.ts"
  - "scripts/setup-supabase.mjs"
---

# Supabase ルール

## migration
- 既存の migration ファイル（001〜005）は**書き換え禁止**。変更は新しい連番ファイルを追加する
- `supabase/migrations/**` を main に push すると GitHub Actions（migrate.yml）が本番 DB に
  `supabase db push` する。**main へのマージ = 本番 DB 変更**であることを常に意識する
- 新テーブルには必ず `ENABLE ROW LEVEL SECURITY` + 明示 POLICY を付ける。
  現行ポリシー：price_master/parts_catalog/inventory = 公開 SELECT、dealers = is_active のみ SELECT、
  quotes/quote_items = 公開 INSERT のみ（SELECT ポリシーなし → 読み取りは service role 経由のみ）
- カラム追加時は types/quote.ts（QuoteRecord 等）も同時に更新する

## クライアントの使い分け
- `getSupabaseClient()` / `supabase`（anon キー）… クライアントコンポーネント用。RLS が効く
- `createServiceClient()`（service role）… **app/api/**/route.ts と lib のサーバー専用コードのみ**。
  RLS をバイパスするので、クライアントから import される場所に置かない
- `SUPABASE_SERVICE_ROLE_KEY` は admin API の X-Admin-Key 共有秘密としても使われている
  （既知のリスク、ADR-0003）。この方式を新しいエンドポイントに拡げない

## データ
- price_master のシードは supabase/price_master.csv → POST /api/admin/seed-prices（upsert）
- inventory は Excel アップロード（POST /api/admin/inventory）でスナップショット全置換
- 見積番号は quotes テーブルの SELECT max ベース採番でレース条件あり（HANDOVER P2 参照）。
  同時保存の不具合報告が来たらまずここを疑う
