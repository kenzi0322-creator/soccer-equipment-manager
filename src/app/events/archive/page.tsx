import { getEvents } from '@/lib/data/db';
import { MOCK_TEAMS, MOCK_VENUES } from '@/lib/data/mock';
import { Calendar, MapPin, Users, ChevronRight, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function ArchiveEventsList() {
  const eventsRaw = await getEvents();
  
  // 1週間より前の試合を取得する
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - 7);
  const thresholdDateStr = thresholdDate.toISOString().split('T')[0];
  
  const pastEvents = eventsRaw
    .filter(e => e.date < thresholdDateStr)
    // 新しい順に降順ソート
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 pb-6">
      
      <div className="flex items-center gap-3">
        <Link href="/events" className="p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">過去の試合予定</h1>
      </div>

      <div className="space-y-4">
        {pastEvents.map(event => {
          const mainTeam = MOCK_TEAMS.find(t => t.id === event.primary_team_id);
          const venue = MOCK_VENUES.find(v => v.id === event.venue_id);

          return (
            <Link key={event.id} href={`/events/${encodeURIComponent(event.id)}`} className="block bg-slate-50 rounded-2xl p-4 border border-slate-200 transition-transform active:scale-[0.98] opacity-80 hover:opacity-100">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Calendar size={12}/>
                    {new Date(event.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' })}
                  </span>
                  {event.is_joint_match && (
                    <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-md">合同</span>
                  )}
                </div>
                <div className="flex items-center text-slate-400">
                  <ChevronRight size={18} />
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-700 mb-1 leading-tight">{event.title}</h3>
              
              <div className="space-y-1.5 mt-3">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <MapPin size={14} className="text-slate-400" />
                  {venue?.name || '未定の設定'}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Users size={14} className="text-slate-400" />
                  対象: {mainTeam?.name}
                </div>
              </div>
            </Link>
          );
        })}
        
        {pastEvents.length === 0 && (
          <div className="text-center py-10 bg-white border border-slate-200 rounded-2xl shadow-sm">
             <p className="text-slate-500 text-sm">過去の試合履歴はありません</p>
          </div>
        )}
      </div>
    </div>
  );
}
