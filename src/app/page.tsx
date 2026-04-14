import { getTeams, getHandoffs, getEventParticipants } from '@/lib/data/db';
import { getItemsSupabase, getMembersSupabase, getEventsSupabase, getEventRequiredItemsSupabase } from '@/lib/data/supabaseDb';
import EquipmentListClient from '@/components/EquipmentListClient';

export default async function Home() {
  const [items, members, teams, handoffs, events, eris, participants] = await Promise.all([
    getItemsSupabase(),
    getMembersSupabase(),
    getTeams(),
    getHandoffs(),
    getEventsSupabase(),
    getEventRequiredItemsSupabase(),
    getEventParticipants()
  ]);

  return (
    <EquipmentListClient 
      initialItems={items} 
      members={members} 
      teams={teams}
      handoffs={handoffs}
      events={events}
      eris={eris}
      participants={participants}
    />
  );
}
