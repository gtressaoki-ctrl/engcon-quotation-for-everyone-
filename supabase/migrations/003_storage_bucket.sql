-- PDF保存用ストレージバケット作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('quotes', 'quotes', false)
ON CONFLICT (id) DO NOTHING;

-- サービスロールのみアップロード可能
CREATE POLICY "service_role_upload" ON storage.objects
  FOR INSERT TO service_role USING (bucket_id = 'quotes');

CREATE POLICY "service_role_select" ON storage.objects
  FOR SELECT TO service_role USING (bucket_id = 'quotes');

CREATE POLICY "service_role_delete" ON storage.objects
  FOR DELETE TO service_role USING (bucket_id = 'quotes');
