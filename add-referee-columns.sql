-- ============================================================
-- events テーブルに審判情報列を追加
-- Supabase SQL Editor で実行してください
-- ============================================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS main_referee_id TEXT,
  ADD COLUMN IF NOT EXISTS sub_referee_id  TEXT,
  ADD COLUMN IF NOT EXISTS sub_referee_id_2 TEXT,
  ADD COLUMN IF NOT EXISTS referee_time TEXT,
  ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS event_date DATE;

-- event_date が空の場合は date 列からコピー（既存データの保全）
UPDATE events SET event_date = date::DATE WHERE event_date IS NULL;

-- 追加結果の確認
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'events'
ORDER BY ordinal_position;
