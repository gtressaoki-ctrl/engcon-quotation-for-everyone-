# UI・ブランド現状仕様（再構築版）

元の外部ファイル engcon-quotation-ui-fix-spec.md / engcon-brand-implementation-spec.md は
失われたため、実装 commit（3ff1213, caebc02, 6301df4, 847a85a, 1d2b131）と現行コードから
**実装済みの現状仕様**として再構築した（2026-07-05）。今後の UI 変更はこの仕様との整合を保つこと。

## 1. ブランドトークン（6301df4）
- 出典：engcon グラフィックマニュアル。**engcon yellow #FFD300（PMS 116C）が主色、黒が唯一の副色**
- 定義場所は 1 箇所：`app/globals.css` の CSS 変数
  - `--brand-yellow: #FFD300` / `--brand-black: #000000`
  - `--color-primary: var(--brand-black)` … 主ボタン・見出し・本文
  - `--color-accent: var(--brand-yellow)` … アクティブ・強調・選択状態
- Tailwind からは `bg-primary` / `bg-accent` / `brand-yellow` 等で参照（tailwind.config.ts の extend.colors）
- **禁止**：blue-* 系ユーティリティの使用（全廃済み）。黄色背景の上のテキストは必ず黒
- チェックボックス/ラジオは `accent-color: var(--brand-black)`
- ロゴ：`public/brand/engcon-logo-on-yellow.jpg`（ヘッダー用）/ `engcon-logo-on-black.jpg`
- PWA：manifest の background #FFD300 / theme #000000（layout.tsx の themeColor も #000000）

## 2. タイポグラフィ（caebc02, 6301df4）
- フォント：Inter（欧文）+ Noto Sans JP（和文）。next/font/google で読み込み、CSS 変数
  `--font-inter` / `--font-noto` → body の font-family
- `font-feature-settings: 'tnum'`：数字は等幅（品番・金額の桁揃え）。金額セルには
  `tabular-nums` クラスを併用

## 3. UI コンポーネント規約
- **STEP 見出しの一元管理（3ff1213）**：「STEP X／N：ラベル」は `app/wizard/page.tsx` が
  ラベル配列 index から自動生成する。**Step コンポーネント内に STEP 番号を書かない**
  （番号重複・attachment モードのズレ再発防止）
- **ステップチップ**：現在=黄背景+黒文字（bg-accent）、完了=neutral（クリックで戻れる）、
  未到達=グレー（disabled）
- **数量入力は Stepper コンポーネント（caebc02）**：`components/Stepper.tsx` の ＋− ステッパー。
  素の `<input type="number">` を数量に使わない（販売価の手修正入力は例外）
- **在庫表示は InventoryBadge に統一（caebc02）**：「在庫あり/なし」のみ表示し実数は見せない。
  在庫切れでも選択は可能（赤字表示のみ）。データ源は GET /api/inventory
- **ボタン**：折り返し防止に `whitespace-nowrap`（検索/追加/保存系）。保存ボタン文言は「見積を保存」
- **操作ボタンの画面下固定（1d2b131）**：各 Step の「← 戻る／次へ →／見積を保存」は
  `sticky bottom-0 bg-white/95 backdrop-blur border-t` のフッターに置く

## 4. レスポンシブ（847a85a）
- **md 未満では表をカードに切り替える**：品目一覧（Step5・Step10）と admin の見積一覧は
  `hidden md:block` のテーブル + `md:hidden` のカードリストの 2 実装を併記する
- カードには 定価/数量/販売価/金額（+ RSM 時は御客様販売価/金額）を必ず含める —
  **テーブルにあってカードに無い情報を作らない**
- 横スクロールが必要な表には `overflow-x-auto` を付ける

## 5. 価格表示規約
- 金額は `toLocaleString()` + `¥` プレフィクス。未確定は `—`
- 定価が引けない品目は黄色ハイライト（bg-yellow-50）+「要確認」表示。0 円で埋めない
- /lookup と ディーラー向け画面では販売価・仕切価を表示しない（bb958f0）
- RSM 見積（price_type === 'rsm'）のみ「御客様販売価/金額」列を追加表示（PC・モバイル両方）

## 受け入れ条件（今後の UI 変更時の回帰チェック）
1. 全画面で blue 系クラスが出現しない（`grep -r "blue-" app components` が 0 件）
2. STEP 番号がモード切替（tiltrotator/attachment）でも連番で表示される
3. iPhone SE 幅（375px）で品目一覧・見積一覧に横スクロールが発生しない
4. 操作ボタンがスクロール中も画面下に見えている
5. RSM 見積で御客様販売価が PC/モバイル両方に表示される
6. `npm run build` が通り、Vercel プレビューで上記を目視確認
