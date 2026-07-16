# アーキテクチャ（現状の正典）

最終更新: 2026-07-05。**README.md は初期仕様（v1.0）であり、本ファイルと食い違う場合は本ファイルが正。**
運用ルールの要約は CLAUDE.md、確定判断は docs/adr/、未実装仕様は docs/specs/ を参照。

## 全体像
```
[ディーラー/G.TRES]                       [G.TRES 管理者]
   │ スマホ/PC（PWA）                        │
   ▼                                         ▼
 /wizard ──STEP1..10──▶ POST /api/save-quote  /admin ──Supabase Auth──▶ /admin/dashboard
   │  ▲                        │                                   │（一覧/CSV/改訂読込）
   │  └─ GET /api/inventory     ├─▶ Supabase quotes/quote_items     └─ /admin/dealers
   │     GET price_master(anon) └─▶ Resend メール通知（ディーラー作成時）
 /lookup（品番→定価検索）
```
- ホスティング：Vercel（main ブランチ = 本番）。DB/認証：Supabase。メール：Resend
- migration は `supabase/migrations/**` が main に push されると GitHub Actions が `db push`

## 画面（App Router）
| ルート | 役割 | 認証 |
|---|---|---|
| `/` | ランディング（3ボタン） | なし |
| `/wizard` | 見積ウィザード。quote_mode で 2 フロー（チルトローテータ一式 11 step／アタッチメントのみ 8 step）。STEP 見出しは wizard/page.tsx が自動採番 | なし |
| `/lookup` | 品番→定価検索。販売価・仕切価は非表示 | なし |
| `/admin` | メール+パスワードログイン（Supabase Auth） | - |
| `/admin/dashboard` | 見積一覧（期間/会社/担当/種別フィルタ、CSV、詳細、改訂読込）+ 管理操作（setup/価格シード/在庫アップロード） | クライアント側ガードのみ |
| `/admin/dealers` | ディーラーマスタ CRUD | クライアント側ガードのみ |

## 状態管理（/wizard）
- zustand（`lib/wizardStore.ts`）に WizardState 全体 + currentStep を保持
- **永続化なし：リロードで入力が消える**（既知の制約。改善案は HANDOVER）
- 改訂フロー：dashboard で既存見積を `loadQuote` → wizard に流し込み → 保存時に `-Rn` 採番
  - **既知バグ：quote_mode は QuoteRecord に保存されないため、attachment モードの見積を
    改訂読込すると tiltrotator モードで開く**（HANDOVER 参照）

## 見積作成データフロー
1. STEP1-2: 作成者（gtres は要ログイン）/見積先 → `getPriceType` で price_type 決定
   （client_name に "RSM" を含む dealer は rsm）
2. STEP3-4: 機種選択（`MACHINE_LIST` から autocomplete、S規格/EC/DC 自動判定）→ マウント方式
3. STEP5: `lib/standardConfig.ts` の `buildStandardConfigPlan` が品番プランを生成 →
   price_master から定価 lookup → `calculateSalesPrice`（掛け率+丸め）で販売価。
   定価が引けない品目は「要確認」（null のまま）
4. STEP6/6b: アタッチメントをカテゴリ→バリアント（price_master を description ILIKE 検索）で追加
5. STEP7-9: ICT 情報／費用（パレット→運賃 35,000 円/枚、取付費等）／納期・条件
6. STEP10: 小計+税（10% floor）を計算して表示 → `POST /api/save-quote`
7. save-quote: 採番（`YYMMDD-NN`、改訂は `ベース-Rn`）→ quotes/quote_items へ insert →
   creator_type=dealer なら G.TRES へ通知メール。
   **注意：insert の error を検査しておらず、失敗しても 200 が返りうる（HANDOVER P1 の隣接課題）。
   また合計金額はクライアント計算値を信用して保存する（運賃のみサーバー再計算）**

## API 一覧（app/api/）
| エンドポイント | 認証 | 内容 |
|---|---|---|
| POST /api/save-quote | なし | 見積保存+通知。公開 INSERT が業務要件（ADR-0003） |
| GET /api/quotes | **なし（穴）** | 全見積一覧（フィルタ+ページング 50 件） |
| GET /api/quotes/[id] | **なし（穴）** | 見積詳細+品目 |
| GET /api/quote-number | なし | 次の採番プレビュー |
| GET /api/inventory | なし | 在庫マップ {item_no: balance}。force-dynamic |
| GET/POST/PATCH/DELETE /api/admin/dealers | **なし（穴）** | ディーラー CRUD |
| POST /api/admin/setup | X-Admin-Key | quotes バケット作成+price_master 件数確認 |
| POST /api/admin/seed-prices | X-Admin-Key | supabase/price_master.csv を upsert |
| POST /api/admin/inventory | X-Admin-Key | 在庫 Excel（FLOOR 行）でスナップショット全置換 |

「穴」の是正仕様は docs/specs/api-auth-hardening.md（HANDOVER P1）。

## データモデル（supabase/migrations/ 001〜005）
- `price_master`（item_no PK, description, price_jpy）… 定価マスタ。公開 SELECT
- `quotes` / `quote_items` … 見積本体+品目。公開 INSERT のみ（SELECT ポリシーなし →
  読み取りは service role 経由のみ）。005 で revision_of / revision_of_quote_number 追加
- `dealers`（is_active）… is_active のみ公開 SELECT
- `inventory`（item_no PK, part_name, balance）… 公開 SELECT。Excel アップロードで全置換
- `parts_catalog` … **未使用（デッドスキーマ）**。quotes ストレージバケット・pdf_path も未使用（ADR-0002）

## ビジネスロジック層（lib/）
- `pricing.ts` … 掛け率・丸め・税・運賃（ADR-0001。**変更はユーザー承認必須**）
- `machineCatalog.ts` … MACHINE_LIST（機種→S規格/EC/DC）+ MACHINE_CATALOG（機種×マウント×DC→品番）。
  lookup は 完全一致→正規化→fuzzy（先頭数字）の順
- `standardConfig.ts` … 標準構成の品番プラン生成（EC/DM 品番マップ、SW ヒッチ補完、GRD、
  CAT DC2/DC3・GC 分岐、SUMITOMO 追加部品、CAT 備考自動追記）
- `attachmentCategories.ts` … アタッチメント 17 カテゴリの ILIKE 検索パターン
- `quoteNumber.ts` … 採番。**SELECT max+1 のためレース条件あり**（specs/quote-number-race-fix.md）
- `email.ts` … Resend 通知。ドメイン未検証のため To は G.TRES 固定・From は onboarding@resend.dev
- `supabase.ts` … anon クライアント / service クライアント（server 専用）
- `dealerContacts.ts` … **デッドコード**（CC 機能廃止 f7e5fc5 の残骸。HANDOVER P4）

## README.md との主な乖離（README を信じてはいけない点）
| README の記述 | 現状 |
|---|---|
| Puppeteer で PDF 生成・Storage 保存 | **PDF 機能なし**（ADR-0002 で「作らない」決定） |
| 見積番号 `Q-YYYYMM-NNN` 形式 | `YYMMDD-NN`（改訂は `-Rn`） |
| reseller は固定 ×0.85 | 見積ごとに掛け率%を入力（未入力時 85%） |
| RSM 価格・御客様販売価の記載なし | rsm price_type + 0.8125/0.875 が実装済み |
| 見積種別は 1 フローのみ | tiltrotator / attachment の 2 モード |
| 改訂・在庫連携・品番検索の記載なし | いずれも実装済み（-Rn、inventory、/lookup） |
| next-pwa 使用 | 手書き SW（ADR-0005） |
| parts_catalog を参照 | 未使用。カタログは TS 定数（ADR-0004） |
