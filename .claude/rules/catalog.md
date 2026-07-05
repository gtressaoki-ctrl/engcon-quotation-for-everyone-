---
paths:
  - "lib/machineCatalog.ts"
  - "lib/standardConfig.ts"
  - "components/wizard/Step5ItemList.tsx"
---

# 品番カタログ・標準構成ルール

このリポジトリの不具合履歴の大半は「品番の誤り」。品番は価格と発注に直結するため、
以下を厳守する。

## 品番（item_no）を追加・変更するとき
1. **出典必須**：engcon 価格表 Excel（ルート直下）／`Part list as of *.csv`／ユーザーの明示指示の
   いずれかを commit message 本文に書く。出典を確認できない変更は行わず、ユーザーに確認する
2. 変更したら `npm run test` で標準構成テスト（lib/standardConfig.test.ts ほか）を更新・実行する
3. 一括変更（例：S40 DM 全機種）はスクリプト的に diff を提示し、件数と対象条件を報告する

## 構造の前提（壊さない）
- MACHINE_LIST = 機種選択ドロップダウン＋S規格/EC/DC の自動判定用。
  MACHINE_CATALOG = 機種×マウント×DC ごとの実品番（ec_item_no / hitch_item_no）
- lookup の順序：完全一致 → 正規化一致（空白除去・大文字化）→ fuzzy（先頭数字一致）。
  fuzzy は誤マッチしうるので、新機種はまず MACHINE_LIST / MACHINE_CATALOG への明示追加を検討する
- チルトローテータ品番の解決優先順位（buildDefaultItems）：
  CAT×DC3 は CAT_DC3_TILT_ROTATOR_MAP が最優先 → DM は S40 なら EC モデル別 Direct 品番優先、
  S45 以上は catalog の機種別品番優先 → SW は EC_ITEM_MAP
- hitch_item_no に GRD 系品番（GRD_TYPE_HITCH_ITEM_NOS）が入っている場合、それはグリッパーで
  あってクイックカプラではない。SW のヒッチ補完時に除外する既存ロジックを維持する
- グリッパーは S 規格別の汎用 GRD 品番を SW/DM 共通で常に 1 点計上（S30/S80 はマップ外→「要確認」）
- CAT の DC2/MIG2 セットは「313 以上かつ GC シリーズ」と「それ以外（NG 301-310）」で品番が違う
- 備考の自動追記は appendNote（重複防止）経由。CAT DC3 の必須部品注記・ディーラー向け注記を勝手に消さない

## UI 側（Step5ItemList.tsx）
- 定価が引けない品目は `list_price == null` のまま出す（黄色「要確認」表示）。0 円で埋めない
- 品目の並びは sort_order を 1 から振り直す
- RSM 列（御客様販売価/金額）はテーブルとモバイルカードの両方に必要
