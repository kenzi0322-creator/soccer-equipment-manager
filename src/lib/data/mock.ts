import { Team, Venue, Member, Event, EventParticipant, Item, Handoff, EventRequiredItem } from '@/types';

// ========================
// ダミーデータ (Mock Data)
// ========================

export const MOCK_TEAMS: Team[] = [
  { id: 't1', name: '一般', category: 'open' },
  { id: 't2', name: 'オーバー40', category: 'o40' },
  { id: 't3', name: 'オーバー50', category: 'o50' },
];

export const MOCK_VENUES: Venue[] = [
  { id: 'v1', name: '市民グラウンドA', address: '東京都◯◯区1-1-1', parking_note: '無料駐車場あり', handoff_note: 'クラブハウス前が便利' },
  { id: 'v2', name: '県立スポーツセンター', address: '神奈川県◯◯市2-2', parking_note: '有料・要事前確保', handoff_note: '第1駐車場' },
];

export const MOCK_MEMBERS: Member[] = [
  { id: 'm1', name: '山田 太郎', team_id: 't1', role: 'キャプテン' },
  { id: 'm2', name: '鈴木 一郎', team_id: 't2', role: 'マネージャー' },
  { id: 'm3', name: '佐藤 次郎', team_id: 't3', role: 'メンバー' },
  { id: 'm4', name: '高橋 健太', team_id: 't1', role: 'メンバー' },
];

const today = new Date();
const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
const tomorrow = new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000);

const formatDate = (d: Date) => d.toISOString().split('T')[0];

export const MOCK_EVENTS: Event[] = [
  {
    id: 'e1',
    title: '市民リーグ 第1節',
    date: formatDate(tomorrow),
    start_at: '10:00',
    end_at: '12:00',
    venue_id: 'v1',
    primary_team_id: 't1',
    is_joint_match: false,
    referee_time: '12:30',
    main_referee_id: 'm1',
    sub_referee_id: 'm4',
  },
  {
    id: 'e2',
    title: 'シニアリーグ(O-40) 第3節',
    date: formatDate(nextWeek),
    start_at: '14:00',
    end_at: '16:00',
    venue_id: 'v2',
    primary_team_id: 't2',
    is_joint_match: false,
  }
];

export const MOCK_EVENT_PARTICIPANTS: EventParticipant[] = [
  { id: 'ep1', event_id: 'e1', member_id: 'm1', attendance_status: 'attending', updated_at: new Date().toISOString() },
  { id: 'ep2', event_id: 'e1', member_id: 'm4', attendance_status: 'absent', updated_at: new Date().toISOString() },
  { id: 'ep3', event_id: 'e2', member_id: 'm2', attendance_status: 'attending', updated_at: new Date().toISOString() },
];

export const MOCK_ITEMS: Item[] = [
  { id: 'i1', item_code: 'SS-C-01', name: 'レフェリースターターセットC-1', category: 'セット', owner_team_id: 't1', shared_flag: true, current_holder_id: 'm1' },
  { id: 'i2', item_code: 'SS-C-02', name: 'レフェリースターターセットC-2', category: 'セット', owner_team_id: 't2', shared_flag: true, current_holder_id: 'm2' },
  { id: 'i3', item_code: 'SS-C-03', name: 'レフェリースターターセットC-3', category: 'セット', owner_team_id: 't3', shared_flag: true, current_holder_id: null },
  { id: 'i4', item_code: 'CAP-O-01', name: 'キャプテンマーク オレンジ-1', color: 'オレンジ', category: '小物', owner_team_id: 't1', shared_flag: false, current_holder_id: 'm1' },
  { id: 'i5', item_code: 'CAP-O-02', name: 'キャプテンマーク オレンジ-2', color: 'オレンジ', category: '小物', owner_team_id: 't2', shared_flag: false, current_holder_id: 'm2' },
  { id: 'i6', item_code: 'CAP-Y-01', name: 'キャプテンマーク イエロー-1', color: 'イエロー', category: '小物', owner_team_id: 't3', shared_flag: false, current_holder_id: 'm3' },
  { id: 'i7', item_code: 'CAP-Y-02', name: 'キャプテンマーク イエロー-2', color: 'イエロー', category: '小物', owner_team_id: 't1', shared_flag: false, current_holder_id: 'm4' },
  { id: 'i8', item_code: 'FLAG-01', name: 'アシスタントレフリーフラッグ-1', category: 'フラッグ', owner_team_id: 't1', shared_flag: true, current_holder_id: 'm1' },
  { id: 'i9', item_code: 'FLAG-02', name: 'アシスタントレフリーフラッグ-2', category: 'フラッグ', owner_team_id: 't2', shared_flag: true, current_holder_id: 'm2' },
  { id: 'i10', item_code: 'FLAG-03', name: 'アシスタントレフリーフラッグ-3', category: 'フラッグ', owner_team_id: 't3', shared_flag: true, current_holder_id: 'm3' },
  { id: 'i11', item_code: 'REF-M-01', name: 'レフェリー4点セット M-1', size: 'M', category: 'ウェア', owner_team_id: 't1', shared_flag: true, current_holder_id: 'm4' },
  { id: 'i12', item_code: 'REF-M-02', name: 'レフェリー4点セット M-2', size: 'M', category: 'ウェア', owner_team_id: 't2', shared_flag: true, current_holder_id: null },
  { id: 'i13', item_code: 'REF-L-01', name: 'レフェリー4点セット L-1', size: 'L', category: 'ウェア', owner_team_id: 't3', shared_flag: true, current_holder_id: 'm3' },
  { id: 'i14', item_code: 'REF-L-02', name: 'レフェリー4点セット L-2', size: 'L', category: 'ウェア', owner_team_id: 't1', shared_flag: true, current_holder_id: 'm1' },
  { id: 'i15', item_code: 'REF-XO-01', name: 'レフェリー4点セット XO-1', size: 'XO', category: 'ウェア', owner_team_id: 't2', shared_flag: true, current_holder_id: 'm2' },
  { id: 'i16', item_code: 'REF-XO-02', name: 'レフェリー4点セット XO-2', size: 'XO', category: 'ウェア', owner_team_id: 't3', shared_flag: true, current_holder_id: 'm3' },
];

export const MOCK_EVENT_REQUIRED_ITEMS: EventRequiredItem[] = [
  // Event 1 needs SS-C-01 and REF-L-02. M1 is attending and holds both. (Status = READY / 水色)
  { id: 'eri1', event_id: 'e1', item_id: 'i1', required_flag: true, assigned_member_id: 'm1', assignment_status: 'ready' },
  { id: 'eri2', event_id: 'e1', item_id: 'i14', required_flag: true, assigned_member_id: 'm1', assignment_status: 'ready' },
  // Event 1 needs REF-M-01. M4 holds it, but M4 is absent. (Status = YELLOW or RED)
  { id: 'eri3', event_id: 'e1', item_id: 'i11', required_flag: true, assigned_member_id: 'm1', assignment_status: 'assigned' }, 
];

// e1 is tomorrow. M4 is absent, so M4 needs to hand off i11 to M1.
export const MOCK_HANDOFFS: Handoff[] = [
  {
    id: 'h1',
    item_id: 'i11',
    from_member_id: 'm4',
    to_member_id: 'm1',
    target_event_id: 'e1',
    receive_deadline_at: new Date(tomorrow.getTime() - 1*24*60*60*1000).toISOString(),
    status: 'pending' // Therefore i11 is YELLOW (受け渡し待ち)
  }
];
