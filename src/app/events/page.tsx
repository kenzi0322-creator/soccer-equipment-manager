import { getEvents } from '@/lib/data/db';
import { MOCK_TEAMS, MOCK_VENUES } from '@/lib/data/mock';
import { Calendar, MapPin, Users, Plus, ChevronRight, History } from 'lucide-react';
import Link from 'next/link';
import BandSyncForm from '@/components/BandSyncForm';

export default async function EventsList() {
  const eventsRaw = await getEvents();
  
  // 1週間より前の試合は除外する
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - 7);
  const thresholdDateStr = thresholdDate.toISOString().split('T')[0];
  
  const recentEvents = eventsRaw
    .filter(e => e.date >= thresholdDateStr)
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6 pb-6">
      
      {/* 1. BAND同期セクション */}
      <BandSyncForm />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">試合予定</h1>
        <button className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={16} /> 新規登録
        </button>
      </div>

      <div className="space-y-4">
        {recentEvents.map(event => {
          const mainTeam = MOCK_TEAMS.find(t => t.id === event.primary_team_id);
          const venue = MOCK_VENUES.find(v => v.id === event.venue_id);
          const isPast = new Date(event.date) < new Date(new Date().toISOString().split('T')[0]);

          return (
            <Link key={event.id} href={`/events/${encodeURIComponent(event.id)}`} className={`block bg-white rounded-2xl p-4 shadow-sm border border-slate-200 transition-transform active:scale-[0.98] ${isPast ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Calendar size={12}/>
                    {new Date(event.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' })}
                  </span>
                  {event.is_joint_match && (
                    <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-md">合同</span>
                  )}
                </div>
                {/* 簡易ステータスアイコン */}
                <div className="flex items-center text-slate-400">
                  <ChevronRight size={18} />
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-800 mb-1 leading-tight">{event.title}</h3>
              
              <div className="space-y-1.5 mt-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Calendar size={14} className="text-slate-400" />
                  {event.start_at} - {event.end_at}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={14} className="text-slate-400" />
                  {venue?.name || '未定の設定'}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Users size={14} className="text-slate-400" />
                  対象: {mainTeam?.name}
                </div>
              </div>
            </Link>
          );
        })}

        {recentEvents.length === 0 && (
          <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-2xl">
             <p className="text-slate-500 text-sm">直近の試合予定はありません</p>
          </div>
        )}
      </div>

      <div className="pt-4 flex justify-center">
        <Link href="/events/archive" className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
          <History size={16} /> 過去の試合一覧を見る
        </Link>
      </div>

    </div>
  );
}
