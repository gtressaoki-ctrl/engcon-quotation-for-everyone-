# 見積番号採番レース修正 仕様（未実装 / HANDOVER P2）

## 問題
`lib/quoteNumber.ts` は「当日 prefix の最大値を SELECT → +1」で採番するため、
2 つの保存が同時に走ると同じ番号（例 `260705-03`）が 2 件発行されうる。
改訂番号（`-Rn`）も同様。現状 quotes.quote_number に UNIQUE 制約が無いため、
重複はサイレントに保存される。

再現：POST /api/save-quote を同時に 2 本投げる（`curl ... & curl ...`）。

## 方針（推奨実装：DB UNIQUE 制約 + 衝突リトライ）
楽観的アプローチ。トラフィックが低いため、衝突時のリトライで十分。

### 1. migration（新規 006_quote_number_unique.sql — 既存ファイルは書き換えない）
```sql
-- 事前に重複が存在しないか確認し、あれば手動で -R 付与等の是正をしてから適用する
CREATE UNIQUE INDEX IF NOT EXISTS quotes_quote_number_key ON quotes (quote_number);
```
※ 適用前チェック：`SELECT quote_number, count(*) FROM quotes GROUP BY 1 HAVING count(*) > 1;`

### 2. save-quote のリトライループ
`app/api/save-quote/route.ts` の insert を最大 3 回のループにする：
1. `generateQuoteNumber()`（または改訂版）で番号取得
2. insert 実行。**error を必ず検査**（現状未検査の既知の罠もここで直す）
3. error.code === '23505'（unique_violation）なら番号を取り直して再試行。
   3 回失敗したら 500 で `{ error: '見積番号の採番が混み合っています。再度保存してください' }`
4. その他の error は即 500（error.message を返す）

### 3. ついでに直すこと（同一 PR 内で可）
- quotes insert 後の `quoteRecord` が null の場合に 200 を返さない（500 にする）
- quote_items insert の error も検査し、失敗時は quotes 行を削除してから 500
  （擬似トランザクション。Supabase JS はトランザクション未対応のため）

## 代替案（却下）
- **Postgres シーケンス/RPC で採番**：日付 prefix 付き連番のためシーケンス単体では不可。
  `exec_sql` RPC での採番関数追加は migration が複雑になり、リトライ方式で十分
- **アプリ内 mutex**：serverless（複数インスタンス）では意味がない

## 受け入れ条件
1. migration 006 適用後、同時 POST ×5 で番号が重複しない（全件ユニーク or 一部が 500）
2. 通常の単発保存・改訂保存（-Rn）が従来どおり動く
3. quotes insert 失敗時に 200 が返らないこと（curl で不正 body を投げて確認）
4. lib/quoteNumber.test.ts のモックテストが通る（リトライ分岐のテストを追加）
5. typecheck / lint / test / build 通過
