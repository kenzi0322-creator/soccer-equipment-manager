import { getItems, getMembers, getTeams, getHandoffs, getEvents, getEventRequiredItems, getEventParticipants } from '@/lib/data/db';
import EquipmentListClient from '@/components/EquipmentListClient';

export default async function Home() {
  const [items, members, teams, handoffs, events, eris, participants] = await Promise.all([
    getItems(),
    getMembers(),
    getTeams(),
    getHandoffs(),
    getEvents(),
    getEventRequiredItems(),
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
