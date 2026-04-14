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
  // Note: Ignore requirements marked as personal carry, as they don't use shared inventory.
  const requiredMappings = allEris.filter(eri => eri.item_id === item.id && eri.required_flag && !eri.is_personal_item);
  
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

/**
 * 共通の個別必要備品ステータス判定ロジック
 * 試合詳細、備品一覧、予定一覧のすべてでこのロジックを使用する
 */
export function calculateRequirementStatus(
  eri: EventRequiredItem,
  allItems: Item[],
  allEvents: Event[]
): { color: ItemStatusColor; label: string; isReady: boolean } {
  const event = allEvents.find(e => e.id === eri.event_id);
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // 1. 過去の試合分はグレー（対象外）
  if (!event || event.date < todayStr) {
    return { color: 'gray', label: '過去分', isReady: false };
  }

  // 2. 個人持参（私物対応）
  if (eri.is_personal_item) {
    if (eri.assigned_member_id) {
      return { color: 'blue', label: '個人持参', isReady: true };
    } else {
      return { color: 'red', label: '持参者未設定', isReady: false };
    }
  }

  // 3. 担当者未設定（未確定）
  if (!eri.assigned_member_id) {
    return { color: 'red', label: '持参者未設定', isReady: false };
  }

  // 4. 実物備品のチェック
  const item = allItems.find(i => i.id === eri.item_id);
  
  // 実物が特定されている場合（共有備品）
  if (item) {
    if (item.current_holder_id === eri.assigned_member_id) {
      return { color: 'blue', label: '準備OK', isReady: true };
    } else {
      return { color: 'yellow', label: '受け渡し待ち', isReady: false };
    }
  }

  // 種類選択（テンプレート）の状態で担当者だけ決まっている場合
  // この場合も、まだ実物が決まっていないので「受け渡し待ち」または「未確定」に近いが、
  // ユーザーの要件「共有備品で担当者設定済み、本人未所持 → 受渡待ち」に従う
  return { color: 'yellow', label: '受け渡し待ち', isReady: false };
}
