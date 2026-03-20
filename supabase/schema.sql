-- ==========================================
-- Equipment Manager Database Schema
-- ==========================================

-- 1. teams (チーム)
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT
);

-- 2. venues (会場)
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  parking_note TEXT,
  handoff_note TEXT,
  meeting_note TEXT,
  difficulty_note TEXT
);

-- 3. members (メンバー)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT,
  team_id UUID REFERENCES teams(id),
  note TEXT
);

-- 4. events (試合などの予定)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  date DATE NOT NULL,
  start_at TIME,
  end_at TIME,
  venue_id UUID REFERENCES venues(id),
  primary_team_id UUID REFERENCES teams(id),
  is_joint_match BOOLEAN DEFAULT false,
  note TEXT
);

-- 5. event_teams (合同試合用のチーム紐付け)
CREATE TABLE event_teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE
);

-- 6. event_participants (参加者予定)
CREATE TABLE event_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  attendance_status TEXT CHECK(attendance_status IN ('attending', 'absent', 'pending')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. items (備品マスタ)
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  size TEXT,
  color TEXT,
  owner_team_id UUID REFERENCES teams(id),
  shared_flag BOOLEAN DEFAULT false,
  photo_url TEXT,
  current_holder_id UUID REFERENCES members(id), -- 現在誰が持っているか
  current_holder_type TEXT DEFAULT 'member', -- member, storeroom, etc.
  status_note TEXT,
  note TEXT
);

-- 8. handoffs (受け渡し管理)
CREATE TABLE handoffs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  from_member_id UUID REFERENCES members(id),
  to_member_id UUID REFERENCES members(id),
  source_event_id UUID REFERENCES events(id),
  target_event_id UUID REFERENCES events(id),
  venue_id UUID REFERENCES venues(id),
  handoff_start_at TIMESTAMP WITH TIME ZONE,
  handoff_end_at TIMESTAMP WITH TIME ZONE,
  receive_deadline_at TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK(status IN ('pending', 'scheduled', 'completed', 'returned', 'return_pending')),
  note TEXT
);

-- 9. event_required_items (試合ごとの必要備品)
CREATE TABLE event_required_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE CASCADE,
  required_flag BOOLEAN DEFAULT true,
  assigned_member_id UUID REFERENCES members(id), -- 当日の持参・管理担当
  assignment_status TEXT CHECK(assignment_status IN ('unassigned', 'assigned', 'ready')),
  note TEXT
);
