-- PDF保存用ストレージバケット作成
-- Service Roleキーはデフォルトでストレージへの全アクセス権を持つためRLSポリシーは不要
INSERT INTO storage.buckets (id, name, public)
VALUES ('quotes', 'quotes', false)
ON CONFLICT (id) DO NOTHING;
