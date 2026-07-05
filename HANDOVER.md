# HANDOVER.md — 未完了タスクと既知の罠

最終更新: 2026-07-05（Fable 5 引き継ぎスプリント）。
**作業開始前に CLAUDE.md → 本ファイル → 関連する docs/specs/ の順で読むこと。**
タスクに着手したら `.claude/skills/deep-reasoning/` の手順で計画し、完了したら本ファイルを更新する。

## 優先順位付き未完了タスク

### P1: API 認証強化
- 仕様: `docs/specs/api-auth-hardening.md`（実装方針・受け入れ条件まで確定済み）
- 内容: 無認証の GET /api/quotes・GET /api/quotes/[id]・/api/admin/dealers 全メソッドを
  Supabase Auth の Bearer トークン検証で保護し、X-Admin-Key の browser prompt 運用を廃止
- DoD: 仕様書の受け入れ条件 1〜6 をすべて満たし、Vercel プレビューで確認済み

### P2: 見積番号の採番レース + save-quote のエラー握りつぶし修正
- 仕様: `docs/specs/quote-number-race-fix.md`
- 内容: quote_number に UNIQUE インデックス（migration 006）+ 衝突リトライ。
  同 PR で quotes/quote_items insert の error 未検査（失敗しても 200 が返る）を是正
- DoD: 仕様書の受け入れ条件 1〜5

### P3: 改訂読込で quote_mode が復元されないバグ
- 症状: 「アタッチメントのみ」で作成した見積を dashboard から改訂読込すると、
  quote_mode が QuoteRecord に保存されていないため tiltrotator モード（11 ステップ）で開く
- 原因: quotes テーブルに quote_mode カラムが無く、`lib/wizardStore.ts` の loadQuote も復元しない
- 修正案: migration で `quote_mode text NOT NULL DEFAULT 'tiltrotator'` を追加 →
  save-quote で保存 → types/quote.ts の QuoteRecord に追加 → loadQuote で復元
- DoD: attachment モードの見積を保存→改訂読込して 8 ステップ構成で開く。既存データは
  tiltrotator として扱われる。typecheck/test/build 通過

### P4: README の全面刷新
- 現状: 初期仕様 v1.0 のアーカイブ（冒頭に注記済み）。新規参加者を誤誘導しうる
- 内容: README を「プロジェクト概要 + セットアップ手順 + docs/ への案内」の短い文書に
  書き換え、旧仕様が必要なら docs/archive/initial-spec-v1.md へ移す
- DoD: README に現状と矛盾する記述が無くなる。セットアップ手順（env 設定→dev→seed）が
  新しいマシンで再現できる

### P5: デッドコード・デッドスキーマの削減（ユーザー確認のうえで）
- `lib/dealerContacts.ts` … CC 機能廃止（f7e5fc5）後の孤児。削除可か確認
- `@supabase/ssr`・`playwright` … 未使用依存。ただし ssr は P1 の実装方針次第で使う可能性
  があるため P1 の後に判断
- `parts_catalog` テーブル・`quotes` ストレージバケット・`quotes.pdf_path` … 未使用
  （ADR-0002/0004）。DB 変更なので削除は migration + ユーザー承認とセットで
- DoD: 各項目について「削除 or 残す理由の文書化」のどちらかが完了している

### P6（改善提案・任意）: ウィザード入力の永続化
- 現状リロードで全入力が消える。zustand の persist middleware（localStorage）で
  下書き保存すれば現場での事故が減る。導入時は「新規見積開始」時のリセット動線も設計すること

## 既知のバグ・罠（コードを触る前に必ず読む）
1. **save-quote は insert エラーを握りつぶす**（`app/api/save-quote/route.ts`）。
   quotes insert 失敗でも 200 + quoteId undefined が返りうる。P2 で修正予定
2. **合計金額はクライアント計算値をそのまま保存**（運賃のみサーバー再計算）。
   UI の計算を変えると保存値も変わる。サーバー側再計算は P2 以降の課題
3. **quote_mode は保存されない**（P3）。改訂読込・データ分析の両方に影響
4. **service_role キーがブラウザを経由する**（X-Admin-Key 方式。ADR-0003 で受容済み、P1 で解消）
5. **public/sw.js のキャッシュ**：アセット変更が反映されない報告が来たら CACHE_NAME バンプ漏れを疑う
6. **fuzzy lookup（先頭数字一致）は誤マッチしうる**：新機種対応はカタログへの明示追加が正道
7. **メール通知**：Resend ドメイン未検証のため To は G.TRES 固定・From は onboarding@resend.dev。
   外部アドレスを To/CC に足すと送信ごと失敗しうる（lib/email.ts のコメント参照）
8. **在庫アップロードは全置換**（POST /api/admin/inventory）。部分更新ではない
9. **カタログの整合性**：VOLVO ECR88D の S規格食い違いは解決済み（S45 が正、2026-07-06
   ユーザー確認）。両テーブルの S規格一致は machineCatalog.test.ts が自動検査する
10. **migration は main push で本番 DB に自動適用される**（.github/workflows/migrate.yml）

## 検証・運用の基本
- commit 前: `npm run typecheck && npm run lint && npm run test`（hooks が編集ごとに自動実行）
- push 後: Vercel MCP ツール（list_deployments → get_deployment_build_logs）でデプロイ成功を確認
- 品番・価格に触れる変更: `.claude/rules/pricing.md` / `.claude/rules/catalog.md` を先に読む

## 次の一手（このスプリントの直後にやること）
1. Phase 3 検収リハーサル：別セッションの下位モデルに本ファイルの小タスク（推奨: P3）を
   実行させ、詰まった箇所のフィードバックでドキュメントを補強する
2. その後 P1 → P2 の順に着手（P2 は P1 とは独立に進められる）
