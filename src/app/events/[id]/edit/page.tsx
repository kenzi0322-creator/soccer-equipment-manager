import { notFound } from 'next/navigation';
import { getEventSupabase } from '@/lib/data/supabaseDb';
import { getMembersSupabase } from '@/lib/data/supabaseDb';
import { getTeams } from '@/lib/data/db';
import EventForm from '@/components/EventForm';
import { updateEventAction } from '@/app/actions/event';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  
  const [event, teams, members] = await Promise.all([
    getEventSupabase(id),
    getTeams(),
    getMembersSupabase(),
  ]);
  
  if (!event) return notFound();

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center gap-2 mb-4">
        <Link href={`/events/${encodeURIComponent(id)}`} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold text-slate-800">試合の編集</h1>
      </div>

      <EventForm 
        initialData={event} 
        action={updateEventAction} 
        teams={teams}
        members={members}
      />
    </div>
  );
}
