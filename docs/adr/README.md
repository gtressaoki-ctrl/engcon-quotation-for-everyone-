# ADR（Architecture Decision Records）

このディレクトリは本プロジェクトの**確定済みの設計判断**を記録する。
**ここにある決定に反する実装は禁止**。変更したい場合は、該当 ADR の改訂案
（Status を Superseded にして新 ADR を追加）をユーザーに提示し、承認を得てから実装する。

## 一覧
| # | タイトル | Status |
|---|---|---|
| [0001](0001-pricing-model.md) | 価格計算体系（掛け率・丸め・税・運賃） | Accepted |
| [0002](0002-no-pdf-generation.md) | PDF 生成は行わない | Accepted |
| [0003](0003-auth-model.md) | 認証モデル（Supabase Auth + X-Admin-Key 共有秘密） | Accepted（リスク受容） |
| [0004](0004-catalog-in-typescript.md) | 品番カタログを TypeScript ハードコードで保持 | Accepted |
| [0005](0005-handwritten-pwa.md) | PWA は手書き Service Worker（next-pwa 不採用） | Accepted |
| [0006](0006-test-strategy.md) | テスト戦略（Vitest によるロジック層ユニットテスト） | Accepted |

## 書式
各 ADR は「Status / 日付 / Context（背景）/ Decision（決定）/
Rejected alternatives（却下した代替案と理由）/ Consequences（帰結・トレードオフ）」で構成する。
