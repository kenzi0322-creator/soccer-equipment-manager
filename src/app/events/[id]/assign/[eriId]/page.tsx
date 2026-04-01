import { getEvents, getItems, getMembers, getEventRequiredItems } from '@/lib/data/db';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AssignmentForm from '@/components/AssignmentForm';

export default async function AssignmentPage({ params }: { params: Promise<{ id: string, eriId: string }> }) {
  const { id: rawId, eriId } = await params;
  const eventId = decodeURIComponent(rawId);

  const [events, allItems, members, eris] = await Promise.all([
    getEvents(),
    getItems(),
    getMembers(),
    getEventRequiredItems()
  ]);

  const event = events.find(e => e.id === eventId);
  const eri = eris.find(e => e.id === eriId);
  
  if (!event || !eri) {
    notFound();
  }

  let currentItem = allItems.find(i => i.id === eri.item_id);
  
  // Virtual Template Handling: If item not found but it's a known template ID
  if (!currentItem) {
    if (eri.item_id === 'i_gk_template') {
      currentItem = { id: 'i_gk_template', name: 'GKユニフォーム (種類選択)', category: 'goalkeeper', shared_flag: true } as any;
    } else if (eri.item_id === 'i_match_ball_template') {
      currentItem = { id: 'i_match_ball_template', name: '試合球 (種類選択)', category: 'shared', shared_flag: true } as any;
    } else if (eri.item_id === 'i_warmup_ball_template') {
      currentItem = { id: 'i_warmup_ball_template', name: 'アップ用ボール (種類選択)', category: 'shared', shared_flag: true } as any;
    } else if (eri.item_id === 'i_ref_half_template') {
      currentItem = { id: 'i_ref_half_template', name: 'レフリー半袖', category: 'shared', shared_flag: true } as any;
    } else if (eri.item_id === 'i_ref_long_template') {
      currentItem = { id: 'i_ref_long_template', name: 'レフリー長袖', category: 'shared', shared_flag: true } as any;
    } else if (eri.item_id === 'i_ref_pants_template') {
      currentItem = { id: 'i_ref_pants_template', name: 'レフリーパンツ', category: 'shared', shared_flag: true } as any;
    } else if (eri.item_id === 'i_ref_socks_template') {
      currentItem = { id: 'i_ref_socks_template', name: 'レフリーソックス', category: 'shared', shared_flag: true } as any;
    } else if (eri.item_id === 'i_ref_flags_template') {
      currentItem = { id: 'i_ref_flags_template', name: 'レフリーフラッグ', category: 'shared', shared_flag: true } as any;
    } else if (eri.item_id === 'i_ref_gear_template') {
      currentItem = { id: 'i_ref_gear_template', name: 'レフリー機材（ホイッスル等）', category: 'shared', shared_flag: true } as any;
    }
  }

  if (!currentItem) {
    notFound();
  }

  // Member Sorting (Numeric by uniform_number)
  const sortedMembers = [...members].sort((a, b) => {
    const numA = parseInt(a.uniform_number || '999');
    const numB = parseInt(b.uniform_number || '999');
    return numA - numB;
  });

  // Item Filtering Logic
  const currentCategory = currentItem.category;
  const isBallTemplate = currentItem.id.includes('ball') || currentItem.name.includes('球') || currentItem.name.includes('ボール');
  
  const filteredItems = allItems.filter(i => {
    if (i.id.includes('template')) return false; // Hide templates in the destination list
    if (currentCategory === 'goalkeeper') return i.category === 'goalkeeper';
    if (isBallTemplate) return i.name.includes('球') || i.name.includes('ボール');
    return true;
  });

  return (
    <div className="max-w-xl mx-auto min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <Link href={`/events/${encodeURIComponent(eventId)}`} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="font-bold text-slate-900 line-clamp-1">割り当て</h1>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{event.title} - {currentItem.name}</p>
        </div>
      </div>

      <AssignmentForm 
        eventId={eventId}
        eriId={eriId}
        currentItem={currentItem}
        members={sortedMembers}
        filteredItems={filteredItems}
        initialMemberId={eri.assigned_member_id}
        initialItemId={eri.item_id.includes('template') ? undefined : eri.item_id}
      />
    </div>
  );
}
