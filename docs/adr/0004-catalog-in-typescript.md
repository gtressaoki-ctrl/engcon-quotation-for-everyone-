# ADR-0004: 品番カタログを TypeScript ハードコードで保持

- Status: Accepted
- 日付: 2026-07-05（現状の明文化）
- 実装: `lib/machineCatalog.ts`（機種マスタ）、`lib/standardConfig.ts`（標準構成の品番マップ）、
  `lib/attachmentCategories.ts`（アタッチメント検索パターン）

## Context
「機種 → S規格/EC モデル/DC 世代 → 標準構成品目の品番」の対応は本アプリの中核データで、
git 履歴の大半がこの修正である（例：S40 DM 品番の是正、CAT DC3 QSC の修正、YANMAR SV100-7 の
S規格修正）。これを DB に置くか、コードに置くかの選択。
一方、**価格**は Supabase の price_master テーブルに置いている（数千行・Excel 由来・一括更新）。

## Decision
機種→品番の対応マップは TypeScript 定数としてコード内に保持する。価格は DB（price_master）。

理由：
1. **変更のレビュー可能性**：品番修正は「なぜ・出典は何か」が重要で、git diff + commit message
   （出典明記ルール）+ PR が最良の監査ログになる。DB 直接更新は履歴が残らない
2. **型安全**：SStandard / MountType / DCSystem のユニオン型で不正値をコンパイル時に弾ける
3. **ロジックとの密結合**：CAT DC3 特殊分岐・GRD 系判定・優先順位付き lookup など、
  データと分岐が一体。コードにあるほうがテストしやすい
4. 更新者は現状 Claude（AI）+ ユーザー承認のフローであり、管理画面での編集ニーズがない

## Rejected alternatives
- **Supabase テーブル化（parts_catalog）**：001_initial.sql にテーブルだけ存在するが未使用。
  管理 UI・監査ログ・型生成の追加実装が必要になり、少人数運用では割に合わない
- **ルート直下の Excel/CSV から生成スクリプトで TS を自動生成**：出典データの形式が不安定
  （列名・表記ゆれ）で、生成の正しさの検証コストが手修正より高い。Excel はあくまで
  「人間と AI が正誤を確認する出典資料」と位置付ける

## Consequences
- 品番修正のワークフロー：出典確認 → TS マップ修正 → 対応テスト更新 → commit message に出典
  → push（詳細は .claude/rules/catalog.md）
- データ量が増えても（現状 MACHINE_LIST 約 130 機種）このままで問題ないが、
  「ディーラーが自分でカタログを編集したい」要件が出たら本 ADR を再評価
- parts_catalog テーブルはデッドスキーマとして残っている（HANDOVER P4 で削除候補）
