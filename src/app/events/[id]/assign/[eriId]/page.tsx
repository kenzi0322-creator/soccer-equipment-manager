import { getEvents, getItems, getMembers } from '@/lib/data/db';
import { getEventRequiredItemsSupabase } from '@/lib/data/supabaseDb';
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
    getEventRequiredItemsSupabase()
  ]);

  const event = events.find(e => e.id === eventId);
  const eri = eris.find(e => e.id === eriId);
  
  if (!event || !eri) {
    notFound();
  }

  // Member Sorting (Numeric by uniform_number)
  const sortedMembers = [...members].sort((a, b) => {
    const numA = parseInt(a.uniform_number || '999');
    const numB = parseInt(b.uniform_number || '999');
    return numA - numB;
  });

  // Item Filtering Logic
  const isBallTemplate = eri.template_key ? eri.template_key.includes('ball') : false;
  const isGkTemplate = eri.template_key ? eri.template_key === 'gk' : false;
  
  const filteredItems = allItems.filter(i => {
    if (i.id.includes('template')) return false; // Hide templates in the destination list
    if (isGkTemplate) return i.category === 'goalkeeper' || (i.name && i.name.includes('GK'));
    if (isBallTemplate) return i.name && (i.name.includes('球') || i.name.includes('ボール'));
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
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{event.title} - {eri.display_name || '必要備品'}</p>
        </div>
      </div>

      <AssignmentForm 
        eventId={eventId}
        eriId={eriId}
        requirementName={eri.display_name || '必要備品'}
        members={sortedMembers}
        filteredItems={filteredItems}
        initialMemberId={eri.assigned_member_id || undefined}
        initialItemId={eri.item_id || undefined}
        isRefereeItem={eri.template_key ? eri.template_key.startsWith('ref_') : false}
      />
    </div>
  );
}
