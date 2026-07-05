# ADR-0003: 認証モデル（Supabase Auth + X-Admin-Key 共有秘密）

- Status: Accepted（リスクを明示的に受容。是正の方向は docs/specs/api-auth-hardening.md）
- 日付: 2026-07-05（現状の明文化）

## Context
利用者は少人数（G.TRES 社員 + 全国のディーラー担当者）で、次の 3 層がある：
1. 公開ページ：`/wizard`（見積作成）、`/lookup`（品番検索）— ディーラーが認証なしで使う前提
2. 管理画面：`/admin/*` — Supabase Auth（メール+パスワード）でログイン
3. 管理 API：`/api/admin/*` — `X-Admin-Key` ヘッダ == `SUPABASE_SERVICE_ROLE_KEY` の共有秘密

## Decision
- ディーラーの見積作成に認証は課さない（導入障壁を最小化する業務要件）。
  そのため quotes / quote_items は RLS で「公開 INSERT のみ」を許可
- 管理画面のログインは Supabase Auth。ページ側ガードはクライアントサイド
  （getSession → 未ログインなら /admin へ redirect）
- 破壊的な管理操作（セットアップ・価格シード・在庫置換）は X-Admin-Key 方式

## 受容しているリスク（既知・現状は許容）
- `GET /api/quotes`・`GET /api/quotes/[id]`・`/api/admin/dealers` 全メソッドが**無認証**。
  URL を知っていれば見積データの閲覧・ディーラーマスタの変更が可能
- X-Admin-Key に service_role キーそのものを使っており、管理者がブラウザ（sessionStorage /
  prompt 入力）にキーを置く運用。キー漏えい = DB フルアクセス
- ページガードがクライアントサイドのみで、API 単体では守られていない

## Rejected alternatives
- **全ページ認証必須**：ディーラーへのアカウント配布・管理コストが業務に見合わない（当面）
- **@supabase/ssr による middleware セッション検証**：依存は導入済みだが未実装。
  是正時の推奨路線として docs/specs/api-auth-hardening.md に落とした（今やらない理由：
  引き継ぎスプリントの範囲外の挙動変更であり、検証環境での動作確認が必要）

## Consequences
- **後継モデルへ**：新しい API route を追加するとき、この「無認証で service client を叩く」
  パターンを踏襲しないこと（.claude/rules/api.md 参照）
- 認証強化の実装優先度は HANDOVER.md の P1。仕様は docs/specs/api-auth-hardening.md が正
- 見積データの機微性が上がった場合（顧客名・価格の外部流出リスク）、受容の前提が崩れる
  ため本 ADR を再評価する
