import { notFound } from 'next/navigation';
import { getItemSupabase, getEventsSupabase, getEventRequiredItemsSupabase, getMembersSupabase, getItemUsageHistorySupabase } from '@/lib/data/supabaseDb';
import ItemDetailClient from '@/components/ItemDetailClient';

export default async function ItemDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const [item, members, events, eris, usageHistory] = await Promise.all([
    getItemSupabase(id),
    getMembersSupabase(),
    getEventsSupabase(),
    getEventRequiredItemsSupabase(),
    getItemUsageHistorySupabase(id),
  ]);
  
  if (!item) return notFound();

  return (
    <ItemDetailClient 
      initialItem={item} 
      members={members} 
      teams={[]}
      venues={[]}
      handoffs={[]}
      events={events}
      eris={eris}
      participants={[]}
      usageHistory={usageHistory}
    />
  );
}
