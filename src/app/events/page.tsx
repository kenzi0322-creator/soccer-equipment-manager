import { getEvents, getTeams, getVenues, getEventRequiredItems } from '@/lib/data/db';
import { Calendar, MapPin, Users, Plus, ChevronRight, History, AlertTriangle, Trophy } from 'lucide-react';
import Link from 'next/link';
import BandSyncForm from '@/components/BandSyncForm';
import { clsx } from 'clsx';
import { getEstimatedVenue } from '@/lib/venue-utils';

export default async function EventsList() {
  const [eventsRaw, teams, venues, eris] = await Promise.all([
    getEvents(),
    getTeams(),
    getVenues(),
    getEventRequiredItems()
  ]);
  
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - 7);
  const thresholdDateStr = thresholdDate.toISOString().split('T')[0];
  
  const recentEvents = eventsRaw
    .filter(e => e.date >= thresholdDateStr)
    .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6 pb-6">
      <BandSyncForm />

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">試合予定</h1>
        <Link href="/events/new" className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={16} /> 新規登録
        </Link>
      </div>

      <div className="space-y-4">
        {(() => {
          const todayStr = new Date().toISOString().split('T')[0];
          let renderedSeparator = false;

          const normalizeTitle = (s: string) => {
            return s
              .trim()
              .replace(/[\s\u3000]+/g, ' ')
              .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (m) => String.fromCharCode(m.charCodeAt(0) - 0xFEE0))
              .toUpperCase();
          };

          return recentEvents.map((event, idx) => {
            const mainTeam = teams.find(t => t.id === event.primary_team_id);
            const venue = venues.find(v => v.id === event.venue_id);
            const isPast = event.date < todayStr;
            const normTitle = normalizeTitle(event.title);
            const isOfficialRaw = normTitle.includes('公式戦');
            const isExcluded = normTitle.includes('TOPチーム') || normTitle.includes('観戦') || normTitle.includes('応援');
            const isHighPriority = isOfficialRaw && !isExcluded;

            const getEventCategory = (title: string) => {
              const upper = title.toUpperCase();
              if (upper.includes('一般')) return { label: '一般', classes: 'bg-[#d9f99d] text-[#365314] border-[#a3e635]' };
              if (upper.includes('O40') || upper.includes('40都')) return { label: 'O40都', classes: 'bg-purple-200 text-purple-900 border-purple-300' };
              if (upper.includes('シニア') || upper.includes('50')) return { label: '50シニア', classes: 'bg-amber-900 text-amber-50 border-amber-950' };
              return null;
            };
            const category = getEventCategory(event.title);
            
            let separator = null;
            if (!isPast && !renderedSeparator && idx > 0) {
              renderedSeparator = true;
              separator = (
                <div key="separator" className="relative py-8">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t-4 border-dashed border-slate-900"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-slate-900 px-3 py-1 text-[10px] font-black tracking-widest text-white rounded-full uppercase">NEXT</span>
                  </div>
                </div>
              );
            }

            return (
              <div key={event.id} className="relative">
                {separator}
                <div className={clsx(
                  "relative rounded-2xl transition-all duration-300",
                  isHighPriority && !isPast && "p-[1.5px] bg-gradient-to-br from-amber-200 via-amber-600 to-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                )}>
                  {/* Luxury Gold Frame: Decorative Corners & Double Border Effect */}
                  {isHighPriority && !isPast && (
                    <>
                      {/* External Frame Decorations */}
                      <div className="absolute top-[-2px] left-[-2px] w-5 h-5 border-t-[3.5px] border-l-[3.5px] border-amber-700/70 rounded-tl-xl z-20" />
                      <div className="absolute top-[-2px] right-[-2px] w-5 h-5 border-t-[3.5px] border-r-[3.5px] border-amber-700/70 rounded-tr-xl z-20" />
                      <div className="absolute bottom-[-2px] left-[-2px] w-5 h-5 border-b-[3.5px] border-l-[3.5px] border-amber-700/70 rounded-bl-xl z-20" />
                      <div className="absolute bottom-[-2px] right-[-2px] w-5 h-5 border-b-[3.5px] border-r-[3.5px] border-amber-700/70 rounded-br-xl z-20" />
                      
                      {/* Metallic sheen */}
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none z-10" />
                    </>
                  )}

                  <Link 
                    href={`/events/${encodeURIComponent(event.id)}`} 
                    className={clsx(
                      "block bg-white rounded-[14px] p-4 shadow-sm transition-all duration-200 active:scale-[0.98] relative overflow-hidden",
                      isPast ? "opacity-60" : "opacity-100",
                      isHighPriority 
                        ? "border-[2px] border-amber-400/40 bg-gradient-to-br from-amber-50/30 via-white to-white" 
                        : "border border-slate-200"
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-tiny">
                          <Calendar size={12}/>
                          {new Date(event.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' })}
                        </span>

                        {category && (
                          <span className={clsx("text-[10px] font-black px-2 py-0.5 rounded-md border shadow-tiny", category.classes)}>
                            {category.label}
                          </span>
                        )}
                        {event.is_joint_match && (
                          <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-md shadow-tiny">合同</span>
                        )}
                        {isHighPriority && (
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-400 shadow-[0_2px_8px_-2px_rgba(245,158,11,0.4)]">
                            <Trophy size={10} className="text-amber-600 fill-amber-500" /> 公式戦
                          </span>
                        )}
                        {event.sync_status === 'deleted_in_source' && (
                          <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                            <AlertTriangle size={10} /> 中止候補
                          </span>
                        )}
                      </div>
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
                        <span className={clsx(!venue || event.venue_id === 'v1' ? "text-slate-400 italic" : "text-slate-600")}>
                          {(() => {
                            const isSample = event.venue_id === 'v1' || !venue;
                            if (!isSample) return venue?.name;
                            
                            const estimated = venues.find(v => v.id !== 'v1' && (event.title + (event.note || '')).includes(v.name));
                            if (estimated) return `推定: ${estimated.name}`;
                            return '(未設定)';
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users size={14} className="text-slate-400" />
                        対象: {mainTeam?.name || '未設定'}
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            );
          });
        })()}

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
