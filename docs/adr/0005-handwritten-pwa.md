# ADR-0005: PWA は手書き Service Worker（next-pwa 不採用）

- Status: Accepted
- 日付: 2026-07-05（現状の明文化）
- 実装: `public/sw.js`、`app/manifest.ts`、`app/ServiceWorkerRegister.tsx`

## Context
現場のディーラーがスマホから使うため、ホーム画面追加（PWA インストール）と
最低限のオフライン耐性が欲しい。README 初期案は `@ducanh2912/next-pwa` を想定していた。

## Decision
プラグインを使わず、約 40 行の手書き Service Worker で運用する：
- キャッシュ名 `engcon-quote-v1`（**アセット変更時は手動バンプ**）
- `/api/` とクロスオリジンは**キャッシュしない**（価格・在庫・見積データは常に最新を取る）
- 同一オリジンの GET アセットはネットワーク優先 + キャッシュフォールバック
- manifest は `app/manifest.ts`（Next の Metadata route）で生成。
  ブランド：背景 #FFD300（engcon yellow）、テーマ #000000

## Rejected alternatives
- **next-pwa / @ducanh2912/next-pwa**：Workbox ベースで高機能だが、
  (1) precache が全ビルドアセットに及び、価格系 API まで誤キャッシュする事故リスク、
  (2) Next 14 との互換性追従コスト、(3) このアプリのオフライン要件は
  「直近ページが開ける」程度で十分 — の 3 点から過剰と判断
- **Service Worker なし（manifest のみ）**：iOS Safari でもインストール自体は可能だが、
  電波の悪い現場での再訪時に白画面になるため最低限のフォールバックは残す

## Consequences
- **罠**：sw.js はブラウザに強くキャッシュされる。アセットを変えたのに反映されない報告が
  来たら、まず CACHE_NAME のバンプ漏れを疑う
- `/api/` を絶対にキャッシュ対象へ追加しないこと（価格・在庫の誤表示は業務事故になる）
- オフライン対応を本格化する要件が出たら（見積の下書きオフライン保存など）、
  SW ではなく wizardStore の永続化（localStorage）から着手するのが正道（HANDOVER 参照）
