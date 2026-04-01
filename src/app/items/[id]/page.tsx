import { notFound } from 'next/navigation';
import { getItem, getMembers, getTeams, getVenues, getHandoffs, getEvents, getEventRequiredItems, getEventParticipants } from '@/lib/data/db';
import ItemDetailClient from '@/components/ItemDetailClient';

export default async function ItemDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const [item, members, teams, venues, handoffs, events, eris, participants] = await Promise.all([
    getItem(id),
    getMembers(),
    getTeams(),
    getVenues(),
    getHandoffs(),
    getEvents(),
    getEventRequiredItems(),
    getEventParticipants()
  ]);
  
  if (!item) return notFound();

  return (
    <ItemDetailClient 
      initialItem={item} 
      members={members} 
      teams={teams}
      venues={venues}
      handoffs={handoffs}
      events={events}
      eris={eris}
      participants={participants}
    />
  );
}
