-- 見積の承認フロー対応
-- ディーラーが作成した見積を管理者が確認し、正式見積として承認できるようにする。
-- status: NULL または 'pending' = 審査中 / 'approved' = 承認済み（正式見積）
-- admin_comment: 管理者が承認時に追記するコメント（画面では赤字で表示）
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS status TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS admin_comment TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
