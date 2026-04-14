-- ============================================================
-- Supabase 移行準備 SQL
-- 実行タイミング: migrate-to-supabase.ts を走らせる前に Supabase SQL Editor で実行
-- ============================================================

-- ── 1. legacy_id 列の追加（既存 JSON の id を追えるようにする）──────────────
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS legacy_id text UNIQUE;

ALTER TABLE equipment_items
  ADD COLUMN IF NOT EXISTS legacy_id text UNIQUE;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS legacy_id text UNIQUE;

ALTER TABLE event_required_items
  ADD COLUMN IF NOT EXISTS legacy_id text UNIQUE;


-- ── 2. チームカテゴリ列の追加（teams テーブル不要にする）────────────────────
-- members: team_id（uuid FK）の代わりに text で保持
ALTER TABLE members
  ADD COLUMN IF NOT EXISTS team_category text;

-- equipment_items: owner_team_id（uuid FK）の代わりに text で保持
ALTER TABLE equipment_items
  ADD COLUMN IF NOT EXISTS owner_team_category text;

-- events: primary_team_id の代わりに text で保持
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS primary_team_category text;

-- events: venue_id は venues テーブルを使わず legacy 文字列で保持
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS venue_legacy_id text;


-- ── 3. event_required_items: テンプレート品目対応列の追加 ──────────────────
-- source_type: 'item'（実備品）or 'template'（テンプレート品目）
ALTER TABLE event_required_items
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'item';

-- template_key: 'gk' / 'match_ball' / 'warmup_ball'（source_type='template' のときのみ使用）
ALTER TABLE event_required_items
  ADD COLUMN IF NOT EXISTS template_key text;


-- ── 4. 確認クエリ（実行後に結果を確認する）──────────────────────────────────
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('members', 'equipment_items', 'events', 'event_required_items')
  AND column_name IN (
    'legacy_id', 'team_category', 'owner_team_category',
    'primary_team_category', 'venue_legacy_id',
    'source_type', 'template_key'
  )
ORDER BY table_name, column_name;
