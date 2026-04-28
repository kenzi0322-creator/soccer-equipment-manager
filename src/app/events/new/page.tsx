import type { Team } from '@/types';
import { getMembersSupabase } from '@/lib/data/supabaseDb';
import EventForm from '@/components/EventForm';
import { createEventAction } from '@/app/actions/event';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const TEAMS: Team[] = [
  { id: 't1', name: '文京一般', category: 'shared' },
  { id: 't2', name: '都O40', category: 'shared' },
  { id: 't3', name: '文京シニア', category: 'shared' },
  { id: 't_tun', name: 'TUN共通', category: 'shared' },
];

export default async function NewEventPage() {
  const [members] = await Promise.all([
    getMembersSupabase(),
  ]);
  const teams = TEAMS;

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/events" className="p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold text-slate-800">新しい試合を登録</h1>
      </div>

      <EventForm
        action={createEventAction}
        teams={teams}
        members={members}
      />
    </div>
  );
}
