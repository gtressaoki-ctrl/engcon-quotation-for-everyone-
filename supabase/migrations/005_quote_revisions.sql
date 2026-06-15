-- 見積の改訂（再編集）対応
-- revision_of: 元になった見積のID（改訂版の場合のみセット）
-- revision_of_quote_number: 元になった見積の見積番号（一覧表示用）
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS revision_of INTEGER REFERENCES quotes(id);
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS revision_of_quote_number TEXT;
