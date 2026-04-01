import { Item, Event, Handoff, EventRequiredItem, EventParticipant, Member, ItemStatusColor, ItemStatusLabel } from '@/types';

type CalculatedItemStatus = {
  color: ItemStatusColor;
  label: ItemStatusLabel;
  nextEvent?: Event;
  nextHandoff?: Handoff;
  nextEri?: EventRequiredItem;
};

// ==========================================
// 状態色判定ロジック
// ==========================================
export function calculateItemStatus(
  item: Item,
  allEvents: Event[],
  allEris: EventRequiredItem[],
  allParticipants: EventParticipant[],
  allHandoffs: Handoff[]
): CalculatedItemStatus {
  // 1. Find the next event where this physical item is specifically required
  const requiredMappings = allEris.filter(eri => eri.item_id === item.id && eri.required_flag);
  
  // Rule 4: Gray (予定なし)
  if (requiredMappings.length === 0) {
    return { color: 'gray', label: '予定なし' };
  }

  // Find the earliest future event
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  
  const futureEvents = requiredMappings
    .map(eri => {
      const gEvent = allEvents.find(e => e.id === eri.event_id);
      return { eri, event: gEvent };
    })
    .filter(x => x.event && x.event.date >= todayStr)
    .sort((a, b) => a.event!.date.localeCompare(b.event!.date));

  // Rule 4: Gray (予定なし) - no future events
  if (futureEvents.length === 0) {
    return { color: 'gray', label: '予定なし' };
  }

  const nextPair = futureEvents[0];
  const nextEvent = nextPair.event!;
  const nextEri = nextPair.eri;

  // Active Handoffs (optional context, but possession is king)
  const pendingHandoff = allHandoffs.find(h => 
    h.item_id === item.id && 
    h.target_event_id === nextEvent.id && 
    (h.status === 'pending' || h.status === 'scheduled')
  );

  // --- New Logic Rules --- 

  // Rule 1: Red (未確定) - Assigned member is missing
  if (!nextEri.assigned_member_id) {
    return { color: 'red', label: '未確定', nextEvent, nextEri };
  }

  // Rule 3: Blue (準備OK) - Holder matches Assignee
  if (item.current_holder_id === nextEri.assigned_member_id) {
    return { color: 'blue', label: '準備OK', nextEvent, nextEri };
  }

  // Rule 2: Yellow (受け渡し待ち) - Holder is different
  return { color: 'yellow', label: '受け渡し待ち', nextEvent, nextHandoff: pendingHandoff, nextEri };
}
