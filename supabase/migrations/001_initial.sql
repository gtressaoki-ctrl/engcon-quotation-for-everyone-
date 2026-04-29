-- 価格マスタ
CREATE TABLE IF NOT EXISTS price_master (
  item_no       TEXT PRIMARY KEY,
  description   TEXT NOT NULL,
  price_jpy     INTEGER NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 部品カタログ（S規格別）
CREATE TABLE IF NOT EXISTS parts_catalog (
  id            SERIAL PRIMARY KEY,
  standard      TEXT NOT NULL,
  category      TEXT NOT NULL,
  type          TEXT NOT NULL,
  item_no       TEXT,
  name_ja       TEXT NOT NULL,
  name_en       TEXT
);

-- ディーラーマスタ
CREATE TABLE IF NOT EXISTS dealers (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO dealers (name) VALUES
  ('生振商会'), ('IB'), ('寿'), ('シーエン'), ('原商'),
  ('ギアトライム'), ('喜多機械'), ('サーデック'), ('ヤマノ'), ('下元')
ON CONFLICT (name) DO NOTHING;

-- 見積もりレコード
CREATE TABLE IF NOT EXISTS quotes (
  id              SERIAL PRIMARY KEY,
  quote_number    TEXT NOT NULL UNIQUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  creator_type    TEXT NOT NULL,
  creator_company TEXT NOT NULL,
  creator_name    TEXT NOT NULL,

  client_type     TEXT NOT NULL,
  client_name     TEXT NOT NULL,

  machine_condition TEXT NOT NULL,
  machine_maker   TEXT NOT NULL,
  machine_model   TEXT NOT NULL,
  machine_year    TEXT,

  mount_type      TEXT NOT NULL,
  s_standard      TEXT NOT NULL,
  ec_model        TEXT NOT NULL,
  dc_system       TEXT NOT NULL,

  has_ict         BOOLEAN DEFAULT FALSE,
  ict_maker       TEXT,
  ict_model       TEXT,
  ict_note        TEXT,

  pallet_count    INTEGER DEFAULT 0,
  freight_cost    INTEGER DEFAULT 0,
  install_cost    INTEGER DEFAULT 0,
  hose_parts_cost INTEGER DEFAULT 0,
  travel_cost     INTEGER DEFAULT 0,
  travel_count    INTEGER DEFAULT 0,
  guidance_cost   INTEGER DEFAULT 0,
  guidance_count  INTEGER DEFAULT 0,

  delivery_location TEXT,
  delivery_date    TEXT,
  delivery_terms   TEXT DEFAULT '別途御協議賜度',
  payment_terms    TEXT DEFAULT '別途御協議賜度',
  note            TEXT,

  subtotal        INTEGER NOT NULL,
  tax             INTEGER NOT NULL,
  total           INTEGER NOT NULL,

  pdf_path        TEXT,
  price_type      TEXT NOT NULL
);

-- 見積明細
CREATE TABLE IF NOT EXISTS quote_items (
  id          SERIAL PRIMARY KEY,
  quote_id    INTEGER REFERENCES quotes(id) ON DELETE CASCADE,
  sort_order  INTEGER NOT NULL,
  item_no     TEXT,
  name_ja     TEXT NOT NULL,
  list_price  INTEGER,
  qty         INTEGER NOT NULL DEFAULT 1,
  unit_price  INTEGER,
  amount      INTEGER,
  is_custom   BOOLEAN DEFAULT FALSE
);

-- RLS設定（認証なしで読み書き可能にする場合はRLSを無効化）
ALTER TABLE price_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE dealers ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;

-- 一般ユーザー向けポリシー（価格マスタ読み取り）
CREATE POLICY "price_master_read" ON price_master FOR SELECT USING (true);
CREATE POLICY "parts_catalog_read" ON parts_catalog FOR SELECT USING (true);
CREATE POLICY "dealers_read" ON dealers FOR SELECT USING (is_active = true);

-- 見積もり書き込みポリシー（認証不要）
CREATE POLICY "quotes_insert" ON quotes FOR INSERT WITH CHECK (true);
CREATE POLICY "quote_items_insert" ON quote_items FOR INSERT WITH CHECK (true);

-- 管理者向けポリシー（サービスロールキーで全操作可能）
-- Supabase service role key bypasses RLS by default
