# API 認証強化 仕様（未実装 / HANDOVER P1）

ADR-0003 で受容した認証リスクのうち、**無認証で見積データ・マスタに触れる 3 系統**を塞ぐ。
実装前に本仕様を読み、着手時は deep-reasoning スキルの手順に従うこと。

## 対象と現状
| # | エンドポイント | 現状 | 望ましい状態 |
|---|---|---|---|
| A | GET /api/quotes、GET /api/quotes/[id] | 無認証で全見積閲覧可 | 管理者のみ |
| B | /api/admin/dealers（GET/POST/PATCH/DELETE） | 無認証で CRUD 可 | 読み取りは公開可、書き込みは管理者のみ |
| C | 管理画面の X-Admin-Key（= service_role キー）運用 | ブラウザにキーを入力・保持 | service_role キーをブラウザに出さない |

※ POST /api/save-quote と GET /api/inventory・/api/quote-number・/lookup の price_master 読みは
公開のまま（業務要件。ADR-0003）。

## 方針（推奨実装）
**Supabase Auth のアクセストークン（JWT）検証を API 側に導入する。**
管理画面は既にログイン済みセッションを持っているため、追加の UI は不要。

### サーバー側ヘルパー（新規 lib/adminAuth.ts）
```ts
// Authorization: Bearer <access_token> を検証し、管理者ユーザーなら user を返す
export async function requireAdmin(req: NextRequest): Promise<{ user } | NextResponse>
```
- 実装：`createServiceClient().auth.getUser(token)` でトークン検証。
  失敗時は `NextResponse.json({ error: 'Unauthorized' }, { status: 401 })` を返す
- 管理者判定：現状は「Supabase Auth にユーザーが存在する = 管理者」でよい
  （管理者アカウントは G.TRES が手動作成しており、一般ユーザー登録経路が無いため）。
  将来ロールが必要になったら user_metadata.role を見る

### クライアント側
- `app/admin/dashboard/page.tsx`・`app/admin/dealers/page.tsx` の fetch に
  `Authorization: Bearer ${session.access_token}` を付与（session は既存 getSession() から取得）
- dashboard の管理操作（setup/seed-prices/inventory）も同ヘッダに移行し、
  **prompt() での X-Admin-Key 入力を廃止**（対象 C の解消）

### API 側の変更
- A：quotes 2 route の先頭に requireAdmin を追加
- B：dealers route は **GET を含む全メソッドに requireAdmin**。
  確認済み（2026-07-05）：公開ウィザードのディーラー選択（Step2Client.tsx:21）は
  anon クライアント + RLS（is_active のみ SELECT 可）で直接 dealers テーブルを読んでおり、
  /api/admin/dealers を使っていない。この route の利用者は /admin/dealers ページのみ
- C：admin/setup・seed-prices・inventory は X-Admin-Key と Bearer の**両対応**を一時期間置き、
  動作確認後に X-Admin-Key を削除（ロールバック容易性のため 2 commit に分ける）

## エラー処理
- 401：トークン無し/無効。クライアントは /admin へ redirect
- 403 は現状不要（ロール導入時に追加）
- 既存のエラー応答形式 `{ error: string }` を踏襲

## 受け入れ条件
1. 未ログインで `curl GET /api/quotes` → 401
2. ログイン済みブラウザから dashboard の一覧・詳細・CSV・改訂読込が従来どおり動く
3. 未ログインで dealers POST/PATCH/DELETE → 401。管理画面からの CRUD は動く
4. dashboard の管理操作 3 種が prompt なしで動き、service_role キーがブラウザの
   ネットワークタブ・sessionStorage のどこにも現れない
5. /wizard・/lookup（公開フロー）が未ログインで従来どおり完走できる
6. typecheck / lint / test / build 通過、Vercel プレビューで 1〜5 を確認

## やらないこと（スコープ外）
- ディーラー向けの認証導入（ADR-0003 の業務要件を維持）
- RLS ポリシーの変更（アプリ層で守る。RLS 強化は別途検討）
- middleware.ts / @supabase/ssr への全面移行（大改修。必要になったら別 spec）
