# CLAUDE.md

engcon チルトローテータ／アタッチメントの見積作成 Web アプリ（株式会社 G.TRES 向け、日本語 UI）。
**README.md は初期仕様書（v1.0）でありコードと乖離している。現状の正はこの CLAUDE.md と docs/ 配下。**

## 必須ルール（毎回必ず守ること）
- 作業完了後は必ず commit → push まで完了させる。指示がなくても必ずやること
- push 後は Vercel デプロイが成功しているか確認。エラー時は原因を特定して即修正してから push し直す
- テスト・typecheck・lint 未通過のまま commit しない：`npm run typecheck && npm run lint && npm run test`
- docs/adr/ の決定に反する変更は禁止（変更したいときは ADR 改訂をユーザーに提案）
- 仕様に無い判断は実装前にユーザー確認。複雑タスクは `.claude/skills/deep-reasoning/` に従って計画してから実装
- commit 前に `.claude/skills/code-review/` でセルフレビュー
- **未完了タスク・既知バグは HANDOVER.md を必ず参照**

## 技術スタック
Next.js 14.1（App Router）/ TypeScript strict / Tailwind / zustand / Supabase / Resend / Vercel / 手書き PWA

## コマンド
- `npm run dev` … 開発サーバー
- `npm run typecheck` / `npm run lint` / `npm run test` … 検証（commit 前必須）
- `npm run build` … 本番ビルド（Vercel と同等の検証になる）
- `npm run setup:supabase` … DB シード（.env.local 必要）

## ディレクトリ構成と意図
```
app/
  page.tsx            ランディング（/wizard・/lookup・/admin への入口）
  wizard/page.tsx     見積ウィザード本体。STEP見出しはここで自動採番（Step側に書かない）
  lookup/page.tsx     品番→価格検索（販売価・仕切価は非表示）
  admin/              Supabase Auth ログイン + dashboard（見積一覧/CSV/改訂）+ dealers 管理
  api/                route handlers。DB 書き込みは必ずここ（service client）経由
components/wizard/    Step1〜Step10 + StepAttachStandard。1ステップ=1ファイル
lib/                  ビジネスロジック（下記「クリティカルパス」参照）
types/quote.ts        全ドメイン型の起点
supabase/migrations/  001〜005。main への push で GitHub Actions が db push する
docs/                 adr（決定）/ specs（未実装仕様）/ architecture.md（現状の正）
ルート直下の .xlsx/.csv/.pdf  品番・価格の出典データ（ビルドには使われない参照資料）
```

## データフロー（見積作成）
1. `/wizard`：zustand（lib/wizardStore.ts）に全状態。**リロードで消える（既知の制約）**
2. STEP5 でカタログ（lib/machineCatalog.ts + lib/standardConfig.ts）から標準構成品目を自動生成し、
   price_master テーブルで定価を引き、lib/pricing.ts の掛け率で販売価を計算
3. STEP10 で合計（小計+運賃+取付費+…+消費税10% floor）を計算し `POST /api/save-quote`
4. save-quote が見積番号（`YYMMDD-NN`、改訂は `-Rn`）を採番し quotes / quote_items に insert、
   ディーラー作成時は Resend で G.TRES へ通知メール
5. 閲覧は `/admin/dashboard`（一覧・CSV・改訂読み込み）。**PDF 出力は仕様として無し（ADR-0002）**

## クリティカルパス（変更時は要注意 + テスト必須）
| ファイル | 内容 | 注意 |
|---|---|---|
| lib/pricing.ts | 掛け率・丸め・税・運賃 | **数値はビジネス決定。変更はユーザー承認+ADR改訂必須** |
| lib/standardConfig.ts | 標準構成の品目展開（品番マップ・CAT/住友特殊分岐） | 品番変更は出典を commit message に明記 |
| lib/machineCatalog.ts | 機種→S規格/EC/品番マップ | 同上。git履歴の大半がここの修正 |
| lib/quoteNumber.ts | 採番（レース条件あり→HANDOVER P2） | |
| app/api/save-quote/route.ts | 保存+通知 | insert エラーが握りつぶされる既知の罠あり |
詳細ルールは `.claude/rules/`（pricing.md / catalog.md / supabase.md / api.md）を参照。

## 環境変数（.env.local.example 参照）
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` … クライアント用
- `SUPABASE_SERVICE_ROLE_KEY` … API route 専用。**クライアントに出さない**（admin API の X-Admin-Key としても使われる）
- `RESEND_API_KEY` … 通知メール（未設定なら送信スキップ）
- CI secret：`SUPABASE_DB_URL`（migration 自動適用）

## 触ってはいけない箇所
- lib/pricing.ts の掛け率（0.75 / ×1.1 / ×1.2 / 0.8125 / 0.875 / reseller 既定85%）、
  運賃 35,000円/パレット、消費税 10%・floor
- 品番マップの値を「出典なしに」変えること（正誤の判断材料は ルート直下の価格表 Excel / Part list CSV / ユーザー）
- supabase/migrations/ の**既存ファイルの書き換え**（変更は新しい連番 migration を追加する）
- public/sw.js のキャッシュ方針（/api/ をキャッシュしない）。アセット変更時は CACHE_NAME をバンプ

## デプロイ
- Vercel（GitHub 連携、main が本番）。migration は main push 時に GitHub Actions で `supabase db push`
- Vercel MCP ツール（get_deployment_build_logs 等）でデプロイ結果を確認できる
