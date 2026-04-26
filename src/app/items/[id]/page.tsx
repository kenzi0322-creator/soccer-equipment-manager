import { notFound } from 'next/navigation';
import { getItemSupabase, getItemsSupabase, getEventsSupabase, getEventRequiredItemsSupabase, getMembersSupabase } from '@/lib/data/supabaseDb';
import ItemDetailClient from '@/components/ItemDetailClient';

export default async function ItemDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const [item, members, events, eris] = await Promise.all([
    getItemSupabase(id),
    getMembersSupabase(),
    getEventsSupabase(),
    getEventRequiredItemsSupabase(),
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
    />
  );
}
