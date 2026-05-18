-- PDF保存用ストレージバケット作成
INSERT INTO storage.buckets (id, name, public)
VALUES ('quotes', 'quotes', false)
ON CONFLICT (id) DO NOTHING;

-- ポリシーが存在しない場合のみ作成
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'service_role_upload'
  ) THEN
    EXECUTE 'CREATE POLICY service_role_upload ON storage.objects FOR INSERT TO service_role USING (bucket_id = ''quotes'')';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'service_role_select'
  ) THEN
    EXECUTE 'CREATE POLICY service_role_select ON storage.objects FOR SELECT TO service_role USING (bucket_id = ''quotes'')';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'service_role_delete'
  ) THEN
    EXECUTE 'CREATE POLICY service_role_delete ON storage.objects FOR DELETE TO service_role USING (bucket_id = ''quotes'')';
  END IF;
END $$;
