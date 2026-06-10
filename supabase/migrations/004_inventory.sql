-- 在庫マスタ（管理画面からのアップロードで更新）
CREATE TABLE IF NOT EXISTS inventory (
  item_no       TEXT PRIMARY KEY,
  part_name     TEXT,
  balance       NUMERIC NOT NULL DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_read" ON inventory;
CREATE POLICY "inventory_read" ON inventory FOR SELECT USING (true);

-- 管理者向け操作はサービスロールキーで実行（RLSをバイパス）
