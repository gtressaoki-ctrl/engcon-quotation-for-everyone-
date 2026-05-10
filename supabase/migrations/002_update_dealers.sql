-- ディーラー名を正式社名に更新
UPDATE dealers SET name = '生振商会株式会社'       WHERE name = '生振商会';
UPDATE dealers SET name = '株式会社IB'             WHERE name = 'IB';
UPDATE dealers SET name = '株式会社寿'             WHERE name = '寿';
UPDATE dealers SET name = '株式会社シーエン'        WHERE name = 'シーエン';
UPDATE dealers SET name = '原商株式会社'           WHERE name = '原商';
UPDATE dealers SET name = '株式会社GEAR TRYM'      WHERE name = 'ギアトライム';
UPDATE dealers SET name = '喜多機械産業株式會社'   WHERE name = '喜多機械';
UPDATE dealers SET name = '株式会社サーデック'     WHERE name = 'サーデック';
UPDATE dealers SET name = '株式会社ヤマノ'         WHERE name = 'ヤマノ';
UPDATE dealers SET name = '有限会社下元自動車整備場' WHERE name = '下元';

-- 新規ディーラーを追加
INSERT INTO dealers (name) VALUES
  ('株式会社ゆいまーる建機'),
  ('合同会社リ―サステック'),
  ('株式会社MIGHT'),
  ('富士岡山運搬機株式会社')
ON CONFLICT (name) DO NOTHING;
