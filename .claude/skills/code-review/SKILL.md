---
name: code-review
description: このリポジトリの diff をレビューするときのチェックリスト。自分の変更のセルフレビュー、他者/過去の変更のレビュー、PR レビューのいずれにも使う。commit 前に必ず一巡すること。
---

# code-review：レビュー観点チェックリスト

まず機械検証（`npm run typecheck` / `npm run lint` / `npm run test`）を実行し、
通ってから以下を diff に対して確認する。所見は重要度順に報告する。

## 1. 型安全
- [ ] `any` / `as any` / `@ts-ignore` を追加していない（既存の `any` は lib/supabase.ts:13 と save-quote の 2 箇所のみ。増やさない）
- [ ] API route の `req.json()` 結果を検証なしで信用していない（最低限、必須フィールドの存在チェック）
- [ ] Supabase クエリの結果は `data` が `null` の可能性を処理している（`.single()` は 0 件でエラー）
- [ ] `parseInt` / `Number()` の NaN を処理している

## 2. エッジケース（このアプリで実際に起きるもの）
- [ ] price_master に品番が無い場合（`list_price == null` → UI は「要確認」黄色表示、金額は `—`）を壊していない
- [ ] S30 / S80 は多くのマップに存在しない（GRD_ITEM_MAP は S40〜S70 のみ、SW_HITCH_BY_CLASS はメーカーごとに歯抜け）。`undefined` 分岐を確認
- [ ] fuzzyLookupCatalog は先頭数字一致のみ（"ZX135US-8" → 135）。誤マッチの可能性を考慮したか
- [ ] 数量 0・空 items・reseller_rate 未入力（→ 85% デフォルト）の挙動
- [ ] 改訂見積（-Rn）と attachment モードの両方で動くか（quote_mode は loadQuote で復元されない既知バグあり → HANDOVER.md 参照）

## 3. エラーハンドリング
- [ ] API route は try/catch + `NextResponse.json({ error }, { status })` の既存パターンに従う
- [ ] Supabase の `{ error }` を握りつぶしていない（save-quote の insert が実例：error 未チェックのまま 200 を返す既知の罠）
- [ ] クライアントの fetch 失敗を `.catch(() => {})` で無視しない（在庫取得だけは例外的に空 `{}` フォールバック可）
- [ ] ユーザー通知は現状 `alert()` が既定パターン（admin ログインのみ setError）。新パターンを導入するなら ADR に記録

## 4. Supabase / RLS
- [ ] `SUPABASE_SERVICE_ROLE_KEY` を使うコードは `app/api/**/route.ts`（サーバー）のみ。クライアントコンポーネントに漏らさない
- [ ] 新テーブルは migration で作成し、`ENABLE ROW LEVEL SECURITY` + 明示 POLICY を必ず付ける
- [ ] anon キー経由の書き込みを追加する場合、その INSERT/UPDATE POLICY の妥当性を説明できるか
- [ ] migration は `supabase/migrations/` に連番で追加（main への push で CI が `db push` を実行する）

## 5. Next.js App Router の罠
- [ ] DB を読む GET route handler には `export const dynamic = 'force-dynamic'` を付ける（Next 14 は GET を静的キャッシュする）
- [ ] `'use client'` の要否：zustand・useState・イベントハンドラを使うなら必須
- [ ] `fs` 読み込み（seed-prices が実例）は Node ランタイムのみ。edge に変えない
- [ ] 動的 route の `params` は `{ params: { id: string } }` 型で受ける

## 6. PWA
- [ ] 静的アセットの内容を変えたら `public/sw.js` の CACHE_NAME（`engcon-quote-v1`）をバンプ
- [ ] `/api/` とクロスオリジンは SW でキャッシュしない（現状の実装を維持）

## 7. 秘匿情報
- [ ] キー・トークン・実メールアドレスの新規ハードコード禁止（lib/email.ts の通知先と lib/dealerContacts.ts は歴史的経緯の例外。増やさない）
- [ ] `.env*` は commit しない。新しい環境変数は `.env.local.example` と CLAUDE.md に追記
- [ ] ログに service key・個人情報を出さない

## 8. このリポジトリ固有（最重要）
- [ ] **品番（item_no）の追加・変更に出典があるか**：engcon 価格表 Excel／Part list CSV／ユーザー指示のいずれかを commit message に明記。出典なしの品番変更は差し戻す
- [ ] **価格掛け率（lib/pricing.ts の 0.75 / 1.1 / 1.2 / 0.8125 / 0.875 / 85%）と運賃単価 35,000・消費税 10% はビジネス決定**。コード都合で変更禁止。変更依頼はユーザー確認＋ADR 改訂が必須
- [ ] 品番マップ（lib/standardConfig.ts・lib/machineCatalog.ts）を変えたら対応するユニットテストも更新したか
- [ ] 金額計算は `roundPrice`（1万以上→千円丸め、未満→百円丸め）を通しているか。素の乗算を UI に出していないか
- [ ] RSM 見積（price_type === 'rsm'）の「御客様販売価」列は PC テーブルとモバイルカードの**両方**に出るか
- [ ] STEP 見出しは wizard/page.tsx が自動採番する。Step コンポーネント内に「STEP n」を書かない
- [ ] 備考自動追記は `appendNote`（重複防止付き）を使う

## 報告形式
- 日本語・結論先行。「問題なし」なら実行した検証コマンドの結果とともにそう書く
- 所見は「重大（マージ不可）／要修正／提案」に分類し、各所見に file:line を付ける
