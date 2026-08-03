-- ディーラーログイン対応
-- 見積を作成したディーラーアカウント（auth.users.id）を紐付け、
-- ログインしたディーラーが「自分が作った見積」を後から見返せるようにする。
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS creator_user_id UUID;
CREATE INDEX IF NOT EXISTS idx_quotes_creator_user_id ON quotes(creator_user_id);
