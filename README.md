# engcon-quotation-for-everyone-
engcon 見積作成アプリ
# engcon チルトローテータ 見積もり作成システム
## 要件定義書 v1.0（Claude Code 実装用）

---

## 0. このドキュメントの使い方

本書はClaude Codeによる実装を前提に作成されている。
**未確定事項（§9）を除き、すべてそのまま実装してよい。**
未確定事項はスタブ・プレースホルダーで実装し、後から差し替えられる構造にすること。

---

## 1. システム概要

| 項目 | 内容 |
|------|------|
| アプリ名 | engcon 見積もり作成システム |
| 見積元（固定・変更不可） | 株式会社 G.TRES |
| 住所（固定） | 〒761-0301 香川県高松市2008番地1 |
| TEL/FAX（固定） | 087-868-2677 |
| 利用者 | G.TRES社員 / 販売ディーラー / 管理者 |
| 形態 | Webアプリ（ブラウザ完結） |
| ホスティング | Vercel（フロント） + Supabase（DB・ストレージ） |

---

## 2. 技術スタック

| レイヤー | 技術 |
|----------|------|
| フレームワーク | Next.js 14（App Router） |
| スタイリング | Tailwind CSS |
| DB | Supabase（PostgreSQL） |
| ファイルストレージ | Supabase Storage |
| 認証 | Supabase Auth（管理者のみ） |
| PDF生成 | Puppeteer（HTML→PDF変換） |
| 価格マスタ | Supabase DB（後述のExcelデータをインポート） |
| デプロイ | Vercel |

---

## 3. ユーザー種別と権限

### 3.1 種別一覧

| 種別 | 認証 | 見積元表示 | 利用可能機能 |
|------|------|------------|--------------|
| G.TRES社員 | 不要（自己申告） | 株式会社 G.TRES（固定） | 見積作成・自分のPDF出力 |
| ディーラー | 不要（自己申告） | 株式会社 G.TRES（固定） | 見積作成・自分のPDF出力 |
| 管理者 | ID/PW認証 | — | 全見積閲覧・全PDF DL・CSV出力 |

### 3.2 ユーザー入力情報

**G.TRES社員の場合**
- 会社名：「株式会社 G.TRES」固定表示（入力不要）
- 担当者名：テキスト入力（必須）

**ディーラーの場合**
- 会社名：テキスト入力（必須）
- 担当者名：テキスト入力（必須）

---

## 4. 価格計算ルール

### 4.1 定価の参照元

Excelファイル「チルトローテータ見積作成_2026.xlsm」の
`価格表2026` シート（列構成：Item No / Description / Rounded New price Curr）
をSupabase DBにインポートしたものを使用する。
**10,075件**の部品番号と丸め済み定価が格納されている。

### 4.2 販売価の計算式

#### G.TRES社員が使う場合

| 見積先種別 | 計算式 |
|------------|--------|
| ①ディーラー向け | 定価 × 0.75 × 1.1 |
| ②未登録販売店向け | 定価 × 0.85 |
| ③エンドユーザー・その他 | 定価 × 0.75 × 1.2 |

#### ディーラーが使う場合

| 見積先 | 計算式 |
|--------|--------|
| エンドユーザー向け（固定） | 定価 × 0.75 × 1.1 |

### 4.3 端数処理ルール

```
金額 >= 10,000円 → 下3桁四捨五入（1,000円単位）
  例）2,168,482円 → 2,168,000円

金額 < 10,000円 → 下2桁四捨五入（100円単位）
  例）1,725円 → 1,700円（※ホースプロテクションがこれに該当）
```

実装例（TypeScript）：
```typescript
function roundPrice(price: number): number {
  if (price >= 10000) {
    return Math.round(price / 1000) * 1000;
  } else {
    return Math.round(price / 100) * 100;
  }
}
```

### 4.4 追加費用項目

以下はすべて見積書に別行で明記する。

| 項目 | 入力方法 | 計算 |
|------|----------|------|
| 国内運賃 | パレット数を入力 | パレット数 × 35,000円 |
| 取付費用 | 金額を直接入力 | そのまま |
| ホース取付部材 | 金額を直接入力 | そのまま |
| 出張費用 | 単価 × 回数 | 単価 × 回数 |
| 納入指導費 | 単価 × 回数 | 単価 × 回数 |
| その他費用 | 品名 + 金額（任意） | そのまま |

### 4.5 消費税

合計（税抜）× 10%（固定）

---

## 5. 見積もりウィザード フロー（10ステップ）

ウィザード形式のUI。各ステップで入力内容をstateで保持し、最後に一括確認・出力する。

```
STEP 1  作成者情報
STEP 2  見積先情報
STEP 3  ベースマシン情報
STEP 4  取付方式・S規格
STEP 5  品目一覧（自動展開 + 手動調整）  ← §6で詳述
STEP 6  追加アタッチメント選択
STEP 7  ICT情報
STEP 8  費用・物流
STEP 9  納期・設置場所・備考
STEP 10 確認・出力
```

### STEP 1：作成者情報

- 種別選択：「G.TRES社員」or「ディーラー」（ラジオボタン）
- G.TRESの場合：会社名は固定表示、担当者名のみ入力
- ディーラーの場合：会社名（テキスト入力）+ 担当者名（テキスト入力）

### STEP 2：見積先情報

**G.TRES社員の場合：**
- 見積先種別を選択（3択）
  - ①ディーラー向け → ディーラー名（プルダウン + 自由入力）
  - ②未登録販売店向け → 販売店名（テキスト入力）
  - ③エンドユーザー・その他 → 会社名または個人名（テキスト入力）
- プルダウン候補（既存ディーラーリスト）：
  生振商会株式会社 / 株式会社IB / 株式会社寿 / 株式会社シーエン / 原商株式会社 / 株式会社GEAR TRYM / 喜多機械産業株式會社 / 株式会社サーデック / 株式会社ヤマノ / 有限会社下元自動車整備場 / 株式会社ゆいまーる建機 / 合同会社リ―サステック / 株式会社MIGHT / 富士岡山運搬機株式会社
  ※後から管理画面で追加・削除できること

**ディーラーの場合：**
- 見積先種別：固定（エンドユーザー向け）
- 見積先名（テキスト入力）

### STEP 3：ベースマシン情報

- 新車 / 中古車（ラジオボタン）
- メーカー選択（プルダウン）：
  CAT / KOMATSU / HITACHI / SUMITOMO / VOLVO / KOBELCO / KUBOTA / Yanmar / その他
- 機種名（テキスト入力）
- 製造年月（任意・テキスト入力）
- 共用配管確認チェック（必須・チェックしないと次へ進めない）
- キャビン仕様確認チェック


### STEP 4：取付方式・S規格

- 取付方式：サンドイッチ（SW）/ ダイレクトマウント（DM）（ラジオボタン）
- S規格選択（プルダウン）：S40 / S45 / S60 / S70 / S80
  - ※S40のみ追加でECモデル選択（EC204 / EC206）が表示される
- コントロールシステム：DC2 / DC3（ラジオボタン）

### STEP 5：品目一覧（自動展開 + 手動調整）

**§6で詳細定義。**
選択内容（メーカー×取付方式×S規格×EC×DC）に基づき、
標準構成品目を自動的にテーブル表示する。
各行は編集可能（数量変更・削除・追加）。

### STEP 6：追加アタッチメント選択

S規格でフィルタリングされた部品一覧から複数選択（チェックボックス）。

**機械式アタッチメント（S規格別に表示）：**
整地バケット / 掘削バケット / 水路／排水溝バケット / 選別バケット /
整地ビーム / タールマックカッター / リッパ / パレットフォーク / アタッチメントブラケット

**油圧式アタッチメント（S規格別に表示）：**
石材／選別グラップル / コンビ／木材グリッパ / コンパクタ / スイーパーローラー /
着脱式スイーパー / グラップルソー

選択した品目は数量入力欄付きで品目一覧に追加される。
販売価は自動計算（§4の計算式適用）。

### STEP 7：ICT情報

- ICT取付予定：あり / なし（ラジオボタン）
- 「あり」の場合：
  - メーカー名（テキスト入力）
  - 機種名（テキスト入力）
  - 備考（テキストエリア）
- ICT注意文言を自動表示：CAT　DC3を選択した時のみ
  「ICTをご利用になる場合は別途 SEA：Grade Indication for 3rd party が必要になる場合があります。
   3Dについては機材メーカーへお問合せください。」

### STEP 8：費用・物流

- パレット数（数値入力）→ 国内運賃自動計算（× 35,000円）表示
- 取付費用（金額入力・任意）
- ホース取付部材一式（金額入力・任意）
- 出張費用（単価入力 × 回数入力・任意）
- 納入指導費（単価入力 × 回数入力・任意）
- その他費用（品名テキスト + 金額入力・任意・複数行追加可能）

### STEP 9：納期・設置場所・備考

- 取付場所（住所・ざっくりでよい）
- 希望納期（テキスト入力）
- 受渡期限（デフォルト「別途御協議賜度」・変更可能）
- 御支払条件（デフォルト「別途御協議賜度」・変更可能）
- その他要望・備考（テキストエリア）

### STEP 10：確認・出力

- 全入力内容のプレビュー表示
- 金額サマリー：
  - 各品目（品番・品名・定価・数量・販売価・金額）
  - 各追加費用
  - 小計（税抜）
  - 消費税（10%）
  - 合計（税込）= 御見積金額
- 「PDFを出力する」ボタン
  - クリックで即ダウンロード（ブラウザ）
  - 同時にSupabase Storageへ自動保存

---

## 6. 標準構成の自動展開ロジック

### 6.1 基本的な考え方

STEP4の選択（メーカー × 取付方式 × S規格 × ECモデル × DCシステム）に応じて、
標準的な構成品目を自動でテーブルに展開する。

これはExcelマクロの `RunEstimateSetup` と同等の機能をWebアプリで再現したものである。

### 6.2 S規格 → 標準ECモデルの対応

| S規格 | 標準ECモデル |
|-------|-------------|
| S40 | EC204 または EC206（ユーザーが選択） |
| S45 | EC209 |
| S60 | EC214 または EC219（ユーザーが選択） |
| S70 | EC226 |
| S80 | EC233（固定） |

### 6.3 標準構成品目（取付方式 × DCシステム別）

#### SW（サンドイッチ）× DC2 の標準構成
1. チルトローテータ本体（ECモデル名）
2. クイックカプラ（S規格対応品）
3. グリッパー（S規格対応品）
4. DC2コントロールシステム
5. MIG2ジョイスティック
6. QSCシステム（EXTDC2-MAP30-QH5）
7. ホースプロテクション × 4本（単価2,200円、下2桁四捨五入適用）

#### SW（サンドイッチ）× DC3 の標準構成
1. チルトローテータ本体（ECモデル名）
2. クイックカプラ（S規格対応品）
3. グリッパー（S規格対応品）
4. DC3コントロールシステム
5. QSCシステム
6. ホースプロテクション × 4本

#### DM（ダイレクトマウント）× DC2 の標準構成
1. チルトローテータ本体（ECモデル名）
2. グリッパー（S規格対応品）
3. DC2コントロールシステム
4. MIG2ジョイスティック
5. Q-safe
6. ホースプロテクション × 4本

#### DM（ダイレクトマウント）× DC3 の標準構成
1. チルトローテータ本体（ECモデル名）
2. グリッパー（S規格対応品）
3. DC3コントロールシステム
4. Q-safe
5. ホースプロテクション × 4本

### 6.4 品番の解決

各構成品目の部品番号は `価格表2026` テーブルから検索して取得する。
部品番号が「—」（未定義）の品目は品名のみ表示し、定価欄は空欄にする。

### 6.5 メーカー別の追加対応

CATシートに記載されたメーカー×機種別の特殊構成が存在する。
**このロジックは後日別途説明するため、現時点ではスタブ実装でよい。**
（メーカー選択時に「この機種は標準構成です。後日詳細を設定してください」と表示する）

---

## 7. PDF出力仕様

### 7.1 出力フォーマット（既存見積書を完全再現）

以下は実際のPDFから確認した既存フォーマット。これを忠実に再現すること。

```
【ヘッダー部】
御 見 積 書（中央タイトル）

左側：
  [見積先名]　御中

右側：
  御見積作成日：YYYY年MM月DD日
  見積番号：YYMMDD-NN（当日の連番）

【本文左側ブロック】
下記の通り御見積り申し上げますので、
何卒御用命賜りたく、御願い申し上げます。

御見積金額：¥X,XXX,XXX（消費税含）
受 渡 場 所：貴社御指定の場所
受 渡 期 限：[入力値 or 別途御協議賜度]
御支払条件：[入力値 or 別途御協議賜度]
見積有効期限：見積日から1カ月

【本文右側ブロック（G.TRES情報）】
株式会社 G.TRES
〒761-0301
香川県高松市2008番地1
TEL/FAX：087-868-2677
[ロゴ・角印画像プレースホルダー]

【品目テーブルヘッダー】
機種 / 特別仕様 / 付属品等 | 定価 | 数量 | 単位 | 販売価 | 金額

【品目テーブル本文】
【新車販売】 
engcon製チルトローテータ
[取付方式]　対象機種：[機種名]
【詳細】
[各品目行（品名・モデル名・定価・数量・販売価・金額）]

（空白行でアタッチメントを分離）

[追加費用行]
国内運賃　　　35,000　[パレット数]　　35,000　[合計]
取付費用　　　[金額]　1　　　　　　　[金額]　[金額]
（以下同様）

【フッター部】
                        計　　　X,XXX,XXX
                     消費税　　　  XXX,XXX

【備考欄】
【備考】
対象機種：[機種名]
[その他備考テキスト]
[ICT情報（取付予定ありの場合）]
```

### 7.2 見積番号の採番ルール

- 形式：`YYMMDD-NN`（例：260423-04）
- YY：西暦下2桁、MM：月2桁、DD：日2桁
- NN：当日の連番（Supabase DBで管理、1始まり）
- 同一日の2件目は -02、3件目は -03

### 7.3 PDF生成方式

Puppeteerを使用してサーバーサイドでHTML→PDF変換を行う。
Next.js API Route（/api/generate-pdf）として実装する。

### 7.4 出力後の動作

1. ブラウザで即時ダウンロード（作成者）
2. Supabase Storageへ自動保存（管理者用バックアップ）
3. Supabase DBへ見積メタデータを記録（§8参照）

---

## 8. データ設計（Supabase）

### 8.1 テーブル定義

#### `price_master`（価格マスタ）
```sql
CREATE TABLE price_master (
  item_no       TEXT PRIMARY KEY,   -- 部品番号
  description   TEXT NOT NULL,       -- 品名（英語）
  price_jpy     INTEGER NOT NULL,    -- 丸め済み定価（円）
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
-- 価格表2026シートの全10,075件をインポート
```

#### `parts_catalog`（部品カタログ：S規格別）
```sql
CREATE TABLE parts_catalog (
  id            SERIAL PRIMARY KEY,
  standard      TEXT NOT NULL,       -- S40, S45, S60, S70, S80
  category      TEXT NOT NULL,       -- クイックカプラ, グレーディングバケット, etc.
  type          TEXT NOT NULL,       -- mechanical / hydraulic / tiltrotator / control
  item_no       TEXT,                -- 部品番号（NULLの場合は品名のみ）
  name_ja       TEXT NOT NULL,       -- 品名（日本語）
  name_en       TEXT                 -- 品名（英語）
);
-- S30-180〜S80-QS80シートのデータをインポート
```

#### `dealers`（ディーラーマスタ）
```sql
CREATE TABLE dealers (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE, -- ディーラー名
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
-- 初期データ：生振商会/IB/寿/シーエン/原商/ギアトライム/喜多機械/サーデック/ヤマノ/下元
```

#### `quotes`（見積もりレコード）
```sql
CREATE TABLE quotes (
  id              SERIAL PRIMARY KEY,
  quote_number    TEXT NOT NULL UNIQUE,  -- 見積番号（YYMMDD-NN）
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  -- 作成者情報
  creator_type    TEXT NOT NULL,   -- 'gtres' or 'dealer'
  creator_company TEXT NOT NULL,   -- G.TRES or ディーラー名
  creator_name    TEXT NOT NULL,   -- 担当者名

  -- 見積先情報
  client_type     TEXT NOT NULL,   -- 'dealer' / 'reseller' / 'enduser'
  client_name     TEXT NOT NULL,   -- 見積先名

  -- ベースマシン
  machine_condition TEXT NOT NULL, -- 'new' or 'used'
  machine_maker   TEXT NOT NULL,
  machine_model   TEXT NOT NULL,
  machine_year    TEXT,

  -- 取付情報
  mount_type      TEXT NOT NULL,   -- 'SW' or 'DM'
  s_standard      TEXT NOT NULL,   -- S40/S45/S60/S70/S80
  ec_model        TEXT NOT NULL,
  dc_system       TEXT NOT NULL,   -- 'DC2' or 'DC3'

  -- ICT
  has_ict         BOOLEAN DEFAULT FALSE,
  ict_maker       TEXT,
  ict_model       TEXT,
  ict_note        TEXT,

  -- 物流・費用
  pallet_count    INTEGER DEFAULT 0,
  freight_cost    INTEGER DEFAULT 0,
  install_cost    INTEGER DEFAULT 0,
  hose_parts_cost INTEGER DEFAULT 0,
  travel_cost     INTEGER DEFAULT 0,
  travel_count    INTEGER DEFAULT 0,
  guidance_cost   INTEGER DEFAULT 0,
  guidance_count  INTEGER DEFAULT 0,

  -- 納期・場所
  delivery_location TEXT,
  delivery_date    TEXT,
  delivery_terms   TEXT DEFAULT '別途御協議賜度',
  payment_terms    TEXT DEFAULT '別途御協議賜度',
  note            TEXT,

  -- 金額
  subtotal        INTEGER NOT NULL,
  tax             INTEGER NOT NULL,
  total           INTEGER NOT NULL,

  -- ファイル
  pdf_path        TEXT,  -- Supabase Storage のパス

  -- 価格種別
  price_type      TEXT NOT NULL   -- 'dealer' / 'reseller' / 'enduser'
);
```

#### `quote_items`（見積明細）
```sql
CREATE TABLE quote_items (
  id          SERIAL PRIMARY KEY,
  quote_id    INTEGER REFERENCES quotes(id) ON DELETE CASCADE,
  sort_order  INTEGER NOT NULL,
  item_no     TEXT,           -- 部品番号（NULLの場合は品名のみ）
  name_ja     TEXT NOT NULL,  -- 品名
  list_price  INTEGER,        -- 定価（NULL=定価なし）
  qty         INTEGER NOT NULL DEFAULT 1,
  unit_price  INTEGER,        -- 販売価（単価）
  amount      INTEGER,        -- 金額（= unit_price × qty）
  is_custom   BOOLEAN DEFAULT FALSE  -- 手動追加品目
);
```

### 8.2 Supabase Storage バケット構造

```
バケット名: quotes
/G.TRES/[担当者名]/YYYY-MM/YYMMDD-NN_[見積先名].pdf
/[ディーラー会社名]/[担当者名]/YYYY-MM/YYMMDD-NN_[見積先名].pdf
```

---

## 9. 管理者機能

### 9.1 ログイン

- Supabase Auth を使用（メールアドレス + パスワード）
- 管理者アカウントは初期設定で1件登録
- 管理者向けURL：`/admin`

### 9.2 見積一覧画面

- 全見積もりを一覧表示
- 表示カラム：見積番号 / 作成日 / 作成者（会社・担当） / 見積先 / 合計金額 / 種別
- フィルター：期間 / 作成者会社 / 担当者名 / 見積先種別
- ソート：作成日（デフォルト降順）

### 9.3 操作

- PDFダウンロード（個別）
- CSVエクスポート（フィルタ条件に合致する全件）
- ディーラーマスタ管理（追加・削除・有効無効切り替え）

---

## 10. 未確定事項（スタブで実装すること）

| # | 内容 | 対応方針 |
|---|------|----------|
| 1 | メーカー別×機種別の特殊構成ロジック（CATシート等の詳細） | 「後日設定予定」の表示でスタブ |
| 2 | G.TRESロゴ・角印画像 | プレースホルダー画像で実装 |
| 3 | 見積書の受渡期限：「御見積時点 在庫有」と「別途御協議賜度」の出し分け条件 | 両方選択できるUIで対応 |
| 4 | ディーラーリストの追加（現在10社） | 管理画面から追加できる仕組みで対応済み |
| 5 | 標準構成ロジックの詳細（マクロのRunEstimateSetupの完全再現） | 後日別途説明する |

---

## 11. ディレクトリ構成（推奨）

```
/
├── app/
│   ├── page.tsx                    # ウィザードトップ
│   ├── wizard/
│   │   └── page.tsx               # 見積ウィザード（10ステップ）
│   ├── admin/
│   │   ├── page.tsx               # 管理者ログイン
│   │   ├── dashboard/page.tsx     # 見積一覧
│   │   └── dealers/page.tsx       # ディーラー管理
│   └── api/
│       ├── generate-pdf/route.ts  # PDF生成エンドポイント
│       ├── quotes/route.ts        # 見積CRUD
│       └── quote-number/route.ts  # 見積番号採番
├── components/
│   ├── wizard/
│   │   ├── Step1Creator.tsx
│   │   ├── Step2Client.tsx
│   │   ├── Step3Machine.tsx
│   │   ├── Step4MountStandard.tsx
│   │   ├── Step5ItemList.tsx
│   │   ├── Step6Attachments.tsx
│   │   ├── Step7ICT.tsx
│   │   ├── Step8Costs.tsx
│   │   ├── Step9Delivery.tsx
│   │   └── Step10Confirm.tsx
│   └── pdf/
│       └── QuoteTemplate.tsx      # PDF用HTMLテンプレート
├── lib/
│   ├── supabase.ts                # Supabaseクライアント
│   ├── pricing.ts                 # 価格計算ロジック
│   ├── quoteNumber.ts             # 見積番号採番
│   └── pdfStorage.ts             # PDF保存ロジック
├── types/
│   └── quote.ts                   # 型定義
└── supabase/
    └── migrations/                # DBマイグレーション
```

---

## 12. 実装の優先順位

Claude Codeはこの順序で実装すること。

1. **DBセットアップ**：Supabaseテーブル作成・価格マスタインポート
2. **価格計算ロジック**：`lib/pricing.ts`（テスト必須）
3. **ウィザードUI**：STEP1〜10（stateはzustandで管理）
4. **PDF生成**：テンプレートHTML作成 → Puppeteer API Route
5. **Supabase Storage保存**：PDF自動アップロード
6. **管理者画面**：一覧・フィルター・DL
7. **デプロイ設定**：Vercel環境変数・Supabase接続# Claude-Code
test 
