import { Item, Event, Handoff, EventRequiredItem, EventParticipant, Member, ItemStatusColor, ItemStatusLabel } from '@/types';
import { MOCK_EVENTS, MOCK_EVENT_REQUIRED_ITEMS, MOCK_EVENT_PARTICIPANTS, MOCK_HANDOFFS } from '../data/mock';

type CalculatedItemStatus = {
  color: ItemStatusColor;
  label: ItemStatusLabel;
  nextEvent?: Event;
  nextHandoff?: Handoff;
};

// ==========================================
// 状態色判定ロジック
// ==========================================
export function calculateItemStatus(item: Item): CalculatedItemStatus {
  // 1. Find the next event where this item is required
  const requiredMappings = MOCK_EVENT_REQUIRED_ITEMS.filter(eri => eri.item_id === item.id && eri.required_flag);
  
  if (requiredMappings.length === 0) {
    return { color: 'gray', label: '予定なし' };
  }

  // Find the earliest future event
  const now = new Date();
  const futureEvents = requiredMappings
    .map(eri => {
      const gEvent = MOCK_EVENTS.find(e => e.id === eri.event_id);
      return { eri, event: gEvent };
    })
    .filter(x => x.event && new Date(x.event.date) >= new Date(now.toISOString().split('T')[0]))
    .sort((a, b) => new Date(a.event!.date).getTime() - new Date(b.event!.date).getTime());

  if (futureEvents.length === 0) {
    return { color: 'gray', label: '予定なし' };
  }

  const nextPair = futureEvents[0];
  const nextEvent = nextPair.event!;
  const nextEri = nextPair.eri;

  // Check Days until next event
  const daysUntil = Math.floor((new Date(nextEvent.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isWithin3Days = daysUntil <= 3;

  // Active Handoffs for this item to the next event?
  const pendingHandoff = MOCK_HANDOFFS.find(h => 
    h.item_id === item.id && 
    h.target_event_id === nextEvent.id && 
    (h.status === 'pending' || h.status === 'scheduled')
  );

  // Holder participation
  const holderParticipant = item.current_holder_id 
    ? MOCK_EVENT_PARTICIPANTS.find(ep => ep.event_id === nextEvent.id && ep.member_id === item.current_holder_id)
    : null;
  const isHolderAttending = holderParticipant?.attendance_status === 'attending';

  // --- Logic Conditions --- 

  // 水色（準備OK）
  // (次回利用予定あり) AND (保有者が次回試合に参加予定) AND (対象試合の必要備品として割り当て済 または 自身が持参)
  // *If there is a pending handoff, it's not ready yet.
  if (
    !pendingHandoff &&
    item.current_holder_id &&
    isHolderAttending &&
    (nextEri.assigned_member_id === item.current_holder_id || nextEri.assignment_status === 'ready')
  ) {
    return { color: 'blue', label: '準備OK', nextEvent, nextHandoff: pendingHandoff };
  }

  // 黄色（受け渡し待ち）
  // (次回利用予定あり) AND (受け渡しトランザクションが未完了状態)
  if (pendingHandoff) {
    return { color: 'yellow', label: '受け渡し待ち', nextEvent, nextHandoff: pendingHandoff };
  }

  // 赤（未確定）
  // 次回利用予定が3日以内なのに
  // (持参者・受け渡し先が未決定) OR (保有者が次回試合に不参加予定)
  if (isWithin3Days) {
    if (!nextEri.assigned_member_id || (item.current_holder_id && !isHolderAttending && !pendingHandoff)) {
      return { color: 'red', label: '未確定', nextEvent };
    }
  }

  // 3日以上先でまだ受け渡し等が決まっていない場合
  // とりあえず黄色（受け渡し待ち）もしくは赤とするが、要件に合わせて未確定にする
  if (!nextEri.assigned_member_id || !isHolderAttending) {
    // 3日以上先でも決まっていなければ未確定表示
    return { color: 'red', label: '未確定', nextEvent };
  }

  // Default fallback
  return { color: 'gray', label: '未確定', nextEvent };
}
