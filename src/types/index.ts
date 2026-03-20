export type Team = {
  id: string;
  name: string;
  category?: string;
};

export type Venue = {
  id: string;
  name: string;
  address?: string;
  parking_note?: string;
  handoff_note?: string;
  meeting_note?: string;
  difficulty_note?: string;
};

export type Member = {
  id: string;
  name: string;
  role?: string;
  team_id: string;
  note?: string;
  uniform_number?: string;
  nearest_station?: string;
  has_car?: boolean;
};

export type Event = {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  start_at?: string; // HH:mm
  end_at?: string; // HH:mm
  venue_id: string;
  primary_team_id: string;
  is_joint_match: boolean;
  referee_time?: string;
  main_referee_id?: string;
  sub_referee_id?: string;
  note?: string;
};

export type EventParticipant = {
  id: string;
  event_id: string;
  member_id: string;
  attendance_status: 'attending' | 'absent' | 'pending';
  updated_at: string;
};

export type Item = {
  id: string;
  item_code: string;
  name: string;
  category?: string;
  size?: string;
  color?: string;
  owner_team_id: string;
  shared_flag: boolean;
  photo_url?: string;
  current_holder_id: string | null;
  current_holder_type?: string;
  status_note?: string;
  note?: string;
};

export type Handoff = {
  id: string;
  item_id: string;
  from_member_id: string;
  to_member_id: string;
  source_event_id?: string;
  target_event_id?: string;
  venue_id?: string;
  handoff_start_at?: string;
  handoff_end_at?: string;
  receive_deadline_at?: string;
  status: 'pending' | 'scheduled' | 'completed' | 'returned' | 'return_pending';
  note?: string;
};

export type EventRequiredItem = {
  id: string;
  event_id: string;
  item_id: string;
  required_flag: boolean;
  assigned_member_id?: string;
  assignment_status: 'unassigned' | 'assigned' | 'ready';
  note?: string;
};

// Item Status Types (Derived from app logic, not purely DB columns)
export type ItemStatusColor = 'blue' | 'yellow' | 'red' | 'gray';
export type ItemStatusLabel = '準備OK' | '受け渡し待ち' | '未確定' | '予定なし';
