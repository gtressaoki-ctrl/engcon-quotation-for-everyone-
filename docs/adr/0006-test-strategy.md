# ADR-0006: テスト戦略（Vitest によるロジック層ユニットテスト）

- Status: Accepted
- 日付: 2026-07-05

## Context
本プロジェクトは 2026-07 時点までテストが 1 本も無かった。一方で不具合の実績は
ほぼすべて「品番マップ・標準構成展開の誤り」（git 履歴参照）で、UI の不具合は軽微。
リスクは lib/ のビジネスロジックとデータに集中している。

## Decision
1. **テストランナーは Vitest**。対象は lib/ の純粋ロジック：
   - `lib/pricing.ts` … 掛け率・丸め境界（9,999/10,000）・RSM 判定・税 floor
   - `lib/machineCatalog.ts` … 正規化一致・fuzzy 一致・非ヒット
   - `lib/standardConfig.ts` … 標準構成展開（CAT DC2/DC3・GC 分岐・SUMITOMO 追加部品・
     S40 DM の EC 選択・SW ヒッチ補完・GRD 系除外）
   - `lib/quoteNumber.ts` … 採番・改訂番号（Supabase クライアントはモック）
2. **品番マップを変えたら対応テストも変える**（.claude/rules/catalog.md で強制）
3. CI（GitHub Actions）で PR/push ごとに typecheck + lint + test + build を回す
4. 標準構成展開ロジックは Step5ItemList.tsx から `lib/standardConfig.ts` へ抽出して
   テスト可能にする（挙動不変のリファクタ）

## Rejected alternatives
- **Jest**：Next.js での TS/ESM 設定が重い。Vitest は設定ほぼゼロで TS が動き、実行も速い
- **Playwright E2E を主軸にする**：devDependencies に playwright が入っていたが未使用だった。
  E2E は Supabase 実環境（price_master シード）が必要で、CI での維持コストが高い。
  不具合実績がロジック層に集中している以上、ユニットテストの費用対効果が圧倒的に高い。
  E2E は将来の選択肢として HANDOVER に記載（当面 playwright 依存は削除候補）
- **スナップショットテスト**：品目リストの「正しさ」は出典との一致であり、
  現状を固定化するスナップショットは誤りも固定化するため不採用

## Consequences
- `npm run test` が commit 前の必須ゲート（CLAUDE.md 必須ルール）
- API route・UI コンポーネントは当面テスト対象外（リスクが低く、コストが高い）。
  save-quote のサーバー側再計算を実装する際はそのテストを必ず追加すること
- テストが品番マップの「出典との一致」を証明するわけではない点に注意。
  テストは「意図した対応関係が壊れていないこと」を守る回帰ガード
