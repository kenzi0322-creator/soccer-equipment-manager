import { createClient } from '@/lib/supabase/server';
import { Item, Event, EventRequiredItem, Member } from '@/types';

// ========================
// Items (equipment_items) Persistence
// ========================

function mapItemFromSupabase(row: any): Item {
  return {
    id: row.legacy_id || row.id,
    code: row.code || '',
    name: row.name || row.display_label || '',
    category: row.item_category || 'OTHER',
    owner_team_id: row.owner_team_category || 't1',
    shared_flag: row.item_category === 'shared',
    current_holder_id: row.current_holder?.legacy_id || null,
  };
}

export async function getItemsSupabase(): Promise<Item[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  console.log('[Supabase] getItemsSupabase called. URL:', supabaseUrl?.substring(0, 40), 'Key prefix:', supabaseKey?.substring(0, 20));
  if (!supabaseUrl) {
    console.warn('[Supabase] URL not set, returning empty items');
    return [];
  }
  const supabase = await createClient();
  const { data, error } = await supabase.from('equipment_items').select('*, current_holder:members(legacy_id)');
  if (error) {
    console.error('[Supabase] Error fetching items:', JSON.stringify(error));
    return [];
  }
  
  const items = (data as any[]).map(mapItemFromSupabase);
  
  // Apply size inference to referee items based on standard prefix grouping
  const prefixes = ['B', 'S', 'T'];
  for (const prefix of prefixes) {
    const prefixItems = items.filter(i => i.code.startsWith(prefix));
    prefixItems.sort((a, b) => parseInt(a.code.replace(/\D/g, '') || '0') - parseInt(b.code.replace(/\D/g, '') || '0'));
    
    let currentBagSize = '';
    for (const item of prefixItems) {
      if (item.name.includes('レフリー袋')) {
        const match = item.name.match(/レフリー袋（(.*?)）/);
        if (match) {
          currentBagSize = match[1];
        } else {
          currentBagSize = '';
        }
      } else if (currentBagSize && item.name.startsWith('レフリー') && !item.name.includes('（')) {
        if (['レフリー半袖', 'レフリー長袖', 'レフリーパンツ', 'レフリーソックス'].includes(item.name)) {
          item.name = `${item.name}（${currentBagSize}）`;
        }
      }
    }
  }

  return items;
}

export async function getItemSupabase(id: string): Promise<Item | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('equipment_items').select('*, current_holder:members(legacy_id)').eq('legacy_id', id).single();
  if (error || !data) {
    console.error('Error fetching item from Supabase:', error);
    return undefined;
  }
  return mapItemFromSupabase(data);
}

export async function insertItemSupabase(item: Item): Promise<void> {
  const supabase = await createClient();
  const insertData = {
    legacy_id: item.id,
    code: item.code,
    name: item.name,
    display_label: item.name,
    item_category: item.shared_flag ? 'shared' : 'personal',
    owner_team_category: item.owner_team_id
  };
  const { error } = await supabase.from('equipment_items').insert([insertData]);
  if (error) throw new Error(error.message);
}

export async function updateItemSupabase(item: Item): Promise<void> {
  const supabase = await createClient();
  const updateData = {
    code: item.code,
    name: item.name,
    display_label: item.name,
    item_category: item.shared_flag ? 'shared' : 'personal',
    owner_team_category: item.owner_team_id
  };
  const { error } = await supabase.from('equipment_items').update(updateData).eq('legacy_id', item.id);
  if (error) throw new Error(error.message);
}

export async function insertItemsBulkSupabase(items: Item[]): Promise<void> {
  const supabase = await createClient();
  const bulkData = items.map(item => ({
    legacy_id: item.id,
    code: item.code,
    name: item.name,
    display_label: item.name,
    item_category: item.shared_flag ? 'shared' : 'personal',
    owner_team_category: item.owner_team_id
  }));
  const { error } = await supabase.from('equipment_items').insert(bulkData);
  if (error) throw new Error(error.message);
}

export async function deleteItemSupabase(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('equipment_items').delete().eq('legacy_id', id);
  if (error) throw new Error(error.message);
}

export async function updateItemHolderSupabase(id: string, current_holder_id: string | null, last_handoff_at?: string): Promise<void> {
  const supabase = await createClient();
  
  let current_holder_member_id = null;
  if (current_holder_id) {
    const { data: member } = await supabase.from('members').select('id').eq('legacy_id', current_holder_id).single();
    if (member) current_holder_member_id = member.id;
  }
  
  const updateData: any = { current_holder_member_id };
  const { error } = await supabase.from('equipment_items').update(updateData).eq('legacy_id', id);
  if (error) throw new Error(error.message);
}

export async function updateItemHoldersBulkSupabase(legacyIds: string[], current_holder_id: string | null): Promise<void> {
  const supabase = await createClient();

  let current_holder_member_id = null;
  if (current_holder_id) {
    const { data: member } = await supabase.from('members').select('id').eq('legacy_id', current_holder_id).single();
    if (member) current_holder_member_id = member.id;
  }

  const { error } = await supabase
    .from('equipment_items')
    .update({ current_holder_member_id })
    .in('legacy_id', legacyIds);
  if (error) throw new Error(error.message);
}

// ========================
// Events Persistence
// ========================

function mapEventFromSupabase(row: any): Event {
  return {
    id: row.legacy_id || row.id,
    external_event_id: row.external_id || undefined,
    title: row.title || '',
    date: row.event_date || '',
    start_at: row.start_at || undefined,
    end_at: row.end_at || undefined,
    note: row.note || undefined,
    venue_id: row.venue_legacy_id || '',   // free-text venue name stored here
    primary_team_id: row.primary_team_category || 't1',
    is_joint_match: row.is_official || false,
    referee_time: row.referee_time || undefined,
    main_referee_id: row.main_referee_id || undefined,
    sub_referee_id: row.sub_referee_id || undefined,
    sub_referee_id_2: row.sub_referee_id_2 || undefined,
    sync_status: row.status === 'deleted_in_source' ? 'deleted_in_source' : 'normal'
  };
}

function mapEventToSupabase(evt: Event): any {
  return {
    legacy_id: evt.id,
    external_id: evt.external_event_id || null,
    title: evt.title,
    event_date: evt.date,
    start_at: evt.start_at || null,
    end_at: evt.end_at || null,
    note: evt.note || null,
    venue_legacy_id: evt.venue_id || null,  // free-text venue name stored here
    primary_team_category: evt.primary_team_id,
    is_official: evt.is_joint_match || false,
    referee_time: evt.referee_time || null,
    main_referee_id: evt.main_referee_id || null,
    sub_referee_id: evt.sub_referee_id || null,
    sub_referee_id_2: evt.sub_referee_id_2 || null,
    status: evt.sync_status === 'deleted_in_source' ? 'deleted_in_source' : 'active'
  };
}

export async function getEventsSupabase(): Promise<Event[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('events').select('*');
  if (error) {
    console.error('Error fetching events from Supabase:', error);
    return [];
  }
  return (data as any[]).map(mapEventFromSupabase);
}

export async function getEventSupabase(id: string): Promise<Event | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('events').select('*').eq('legacy_id', id).single();
  if (error || !data) {
    console.error('Error fetching event from Supabase:', error);
    return undefined;
  }
  return mapEventFromSupabase(data);
}

export async function insertEventSupabase(event: Event): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('events').insert([mapEventToSupabase(event)]);
  if (error) throw new Error(error.message);
}

export async function updateEventSupabase(event: Event): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('events').update(mapEventToSupabase(event)).eq('legacy_id', event.id);
  if (error) throw new Error(error.message);
}

export async function deleteEventSupabase(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('events').delete().eq('legacy_id', id);
  if (error) throw new Error(error.message);
}

export async function updateEventSyncStatusSupabase(id: string, sync_status: string): Promise<void> {
  const supabase = await createClient();
  const statusStr = sync_status === 'deleted_in_source' ? 'deleted_in_source' : 'active';
  const { error } = await supabase.from('events').update({ status: statusStr }).eq('legacy_id', id);
  if (error) throw new Error(error.message);
}

// ========================
// Event Required Items Persistence
// ========================

const TEMPLATE_KEY_NAMES: Record<string, string> = {
  'gk': 'GKユニ',
  'match_ball': '試合球',
  'warmup_ball': 'アップ用ボール',
  'ref_half': 'レフリー半袖',
  'ref_long': 'レフリー長袖',
  'ref_pants': 'レフリーパンツ',
  'ref_socks': 'レフリーソックス',
  'ref_flags': 'レフリーフラッグ',
  'ref_bag': 'レフリー袋',
  'ref_gear': 'レフリー機材',
};

function mapEriFromSupabase(row: any, memberLegacyMap: Map<string, string>, itemLegacyMap: Map<string, string>, eventLegacyMap: Map<string, string>): EventRequiredItem {
  const templateKey = row.template_key || null;
  const dbDisplayName = row.display_name;
  const displayName = (dbDisplayName && dbDisplayName !== templateKey)
    ? dbDisplayName
    : (templateKey ? (TEMPLATE_KEY_NAMES[templateKey] || templateKey) : '必要備品');

  // UUIDからlegacy_idへの変換（マップから引く）
  const assigneeLegacyId = row.assignee_member_id
    ? (memberLegacyMap.get(row.assignee_member_id) || null)
    : null;
  const itemLegacyId = row.selected_equipment_item_id
    ? (itemLegacyMap.get(row.selected_equipment_item_id) || null)
    : null;
  const eventLegacyId = row.event_id
    ? (eventLegacyMap.get(row.event_id) || row.event_id)
    : '';

  const isPersonalCarry = row.is_personal_carry || false;
  const assignmentStatus = assigneeLegacyId ? 'ready' : 'unassigned';

  return {
    id: row.legacy_id || row.id,
    event_id: eventLegacyId,
    template_key: templateKey,
    display_name: displayName,
    item_id: itemLegacyId,
    required_flag: true,
    assignment_status: assignmentStatus,
    assigned_member_id: assigneeLegacyId,
    is_personal_item: isPersonalCarry
  };
}

export async function getEventRequiredItemsSupabase(): Promise<EventRequiredItem[]> {
  const supabase = await createClient();

  // ERIと参照テーブルを並列取得
  const [eriRes, membersRes, itemsRes, eventsRes] = await Promise.all([
    supabase.from('event_required_items').select('*'),
    supabase.from('members').select('id, legacy_id'),
    supabase.from('equipment_items').select('id, legacy_id'),
    supabase.from('events').select('id, legacy_id'),
  ]);

  if (eriRes.error) {
    console.error('[Supabase] Error fetching ERIs:', JSON.stringify(eriRes.error));
    return [];
  }

  // UUID → legacy_id のルックアップマップを作成
  const memberLegacyMap = new Map<string, string>(
    (membersRes.data || []).filter(m => m.legacy_id).map(m => [m.id, m.legacy_id])
  );
  const itemLegacyMap = new Map<string, string>(
    (itemsRes.data || []).filter(i => i.legacy_id).map(i => [i.id, i.legacy_id])
  );
  const eventLegacyMap = new Map<string, string>(
    (eventsRes.data || []).filter(e => e.legacy_id).map(e => [e.id, e.legacy_id])
  );

  return (eriRes.data as any[]).map(row =>
    mapEriFromSupabase(row, memberLegacyMap, itemLegacyMap, eventLegacyMap)
  );
}



export async function insertErisSupabase(eris: EventRequiredItem[]): Promise<void> {
  const supabase = await createClient();
  
  // Do lookups for UUIDs
  const inserts = [];
  for (const e of eris) {
    let eventUuid = null;
    let memberUuid = null;
    let itemUuid = null;
    let templateKey = null;

    if (e.event_id) {
      const { data } = await supabase.from('events').select('id').eq('legacy_id', e.event_id).single();
      if (data) eventUuid = data.id;
    }
    
    if (e.assigned_member_id) {
      const { data } = await supabase.from('members').select('id').eq('legacy_id', e.assigned_member_id).single();
      if (data) memberUuid = data.id;
    }

    if (e.template_key) {
      templateKey = e.template_key;
    } else if (e.item_id && e.item_id.endsWith('_template')) {
      templateKey = e.item_id.replace('i_', '').replace('_template', '');
    }

    if (e.item_id && !e.item_id.endsWith('_template')) {
      const { data } = await supabase.from('equipment_items').select('id').eq('legacy_id', e.item_id).single();
      if (data) itemUuid = data.id;
    }

    inserts.push({
      legacy_id: e.id,
      event_id: eventUuid,
      required_type: templateKey || 'standard',
      display_name: e.display_name || templateKey || '必要備品',
      assignee_member_id: memberUuid,
      selected_equipment_item_id: itemUuid,
      template_key: templateKey,
      is_personal_carry: e.is_personal_item || false
    });
  }

  const { error } = await supabase.from('event_required_items').insert(inserts);
  if (error) throw new Error(error.message);
}

export async function updateEriSupabase(id: string, updates: Partial<EventRequiredItem>): Promise<void> {
  const supabase = await createClient();
  const dbUpdates: any = {};
  
  if (updates.assigned_member_id !== undefined) {
    if (updates.assigned_member_id === null) {
      dbUpdates.assignee_member_id = null;
    } else {
      const { data } = await supabase.from('members').select('id').eq('legacy_id', updates.assigned_member_id).single();
      if (data) dbUpdates.assignee_member_id = data.id;
    }
  }

  if (updates.template_key !== undefined) {
    dbUpdates.template_key = updates.template_key;
  }
  if (updates.display_name !== undefined) {
    dbUpdates.display_name = updates.display_name;
  }

  if (updates.item_id !== undefined) {
    if (updates.item_id === null) {
      dbUpdates.selected_equipment_item_id = null;
    } else if (updates.item_id.endsWith('_template')) {
      // Compatibility fallback
      dbUpdates.template_key = updates.item_id.replace('i_', '').replace('_template', '');
      dbUpdates.selected_equipment_item_id = null;
    } else {
      const { data } = await supabase.from('equipment_items').select('id').eq('legacy_id', updates.item_id).single();
      if (data) dbUpdates.selected_equipment_item_id = data.id;
    }
  }
  
  if (updates.is_personal_item !== undefined) {
    dbUpdates.is_personal_carry = updates.is_personal_item;
  }

  const { error } = await supabase.from('event_required_items').update(dbUpdates).eq('legacy_id', id);
  if (error) throw new Error(error.message);
}

export async function deleteEriSupabase(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('event_required_items').delete().eq('legacy_id', id);
  if (error) throw new Error(error.message);
}

// ========================
// Members Persistence
// ========================

function mapMemberFromSupabase(row: any): Member {
  return {
    id: row.legacy_id || row.id,
    name: row.display_name || '',
    uniform_number: row.jersey_number || undefined,
    nearest_station: row.nearest_station || undefined,
    has_car: row.has_car || false,
    note: row.note || undefined,
    team_id: row.team_category || 't1'
  };
}

function mapMemberToSupabase(member: Member): any {
  return {
    legacy_id: member.id,
    display_name: member.name,
    jersey_number: member.uniform_number || null,
    nearest_station: member.nearest_station || null,
    has_car: member.has_car,
    note: member.note || null,
    team_category: member.team_id
  };
}

export async function getMembersSupabase(): Promise<Member[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('members').select('*');
  if (error) {
    console.error('Error fetching members from Supabase:', error);
    return [];
  }
  return (data as any[]).map(mapMemberFromSupabase);
}

export async function updateMemberSupabase(member: Member): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('members').update(mapMemberToSupabase(member)).eq('legacy_id', member.id);
  if (error) throw new Error(error.message);
}
