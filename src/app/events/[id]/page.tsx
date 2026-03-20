import { notFound } from 'next/navigation';
import { getEvent, getEventRequiredItems, getItems } from '@/lib/data/db';
import { removeRequiredItemAction, addRequiredItemAction } from '@/app/actions/event';
import { MOCK_TEAMS, MOCK_VENUES, MOCK_MEMBERS, MOCK_EVENT_PARTICIPANTS, MOCK_HANDOFFS } from '@/lib/data/mock';
import { ArrowLeft, MapPin, Users, Calendar, CheckCircle, AlertCircle, RefreshCw, Package, Clock, ShieldAlert, Info, X, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';
import EventActions from '@/components/EventActions';

export default async function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const event = await getEvent(id);
  if (!event) return notFound();

  const venue = MOCK_VENUES.find(v => v.id === event.venue_id);
  const team = MOCK_TEAMS.find(t => t.id === event.primary_team_id);
  const mainReferee = MOCK_MEMBERS.find(m => m.id === event.main_referee_id);
  const subReferee = MOCK_MEMBERS.find(m => m.id === event.sub_referee_id);
  
  const allEris = await getEventRequiredItems();
  const requiredItemLinks = allEris.filter(eri => eri.event_id === event.id && eri.required_flag);
  
  const allItems = await getItems();
  const availableItems = allItems.filter(i => !requiredItemLinks.some(eri => eri.item_id === i.id));

  // Calculate statuses for required items
  const itemStatuses = requiredItemLinks.map(eri => {
    const item = allItems.find(i => i.id === eri.item_id)!;
    const assignedMember = MOCK_MEMBERS.find(m => m.id === eri.assigned_member_id);
    const holderMember = MOCK_MEMBERS.find(m => m.id === item.current_holder_id);
    
    // Is the assigned member or holder attending?
    const targetUserId = eri.assigned_member_id || item.current_holder_id;
    const isAttending = MOCK_EVENT_PARTICIPANTS.find(ep => ep.event_id === event.id && ep.member_id === targetUserId)?.attendance_status === 'attending';

    // Are there pending handoffs to the assigned person?
    const pendingHandoff = MOCK_HANDOFFS.find(h => h.item_id === item.id && h.target_event_id === event.id && h.status !== 'completed');

    let statusColor: 'blue' | 'yellow' | 'red' = 'red';
    let statusLabel = '未定・問題あり';

    if (!eri.assigned_member_id || !isAttending) {
      statusColor = 'red';
      statusLabel = !eri.assigned_member_id ? '持参者未設定' : '担当者不参加';
    } else if (pendingHandoff) {
      statusColor = 'yellow';
      statusLabel = '受け渡し未完了';
    } else if (item.current_holder_id === eri.assigned_member_id && eri.assignment_status === 'ready') {
      statusColor = 'blue';
      statusLabel = '準備OK';
    } else {
      statusColor = 'yellow';
      statusLabel = '確認中';
    }

    return { eri, item, assignedMember, holderMember, statusColor, statusLabel, isAttending, pendingHandoff };
  });

  // Event overall status
  let overallColor: 'blue' | 'yellow' | 'red' = 'blue';
  if (itemStatuses.some(i => i.statusColor === 'red')) overallColor = 'red';
  else if (itemStatuses.some(i => i.statusColor === 'yellow')) overallColor = 'yellow';

  const getEventOverallBg = () => {
    if (overallColor === 'blue') return 'bg-blue-50 border-blue-200 text-blue-800';
    if (overallColor === 'yellow') return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    return 'bg-red-50 border-red-200 text-red-800';
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link href="/events" className="p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <span className="font-medium text-slate-800">試合詳細</span>
        <EventActions eventId={event.id} />
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center gap-2 mb-3">
          <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
            <Calendar size={12}/>
            {new Date(event.date).toLocaleDateString('ja-JP')}
          </span>
          {event.is_joint_match && <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-md">合同試合</span>}
        </div>
        
        <h1 className="text-xl font-bold text-slate-900 mb-4">{event.title}</h1>
        
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Calendar className="text-slate-400 mt-0.5 shrink-0" size={18} />
            <div className="text-sm">
              <span className="text-slate-500 text-xs block mb-0.5">時間</span>
              <span className="font-medium text-slate-800">{event.start_at} 〜 {event.end_at}</span>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <MapPin className="text-slate-400 mt-0.5 shrink-0" size={18} />
            <div className="text-sm flex-1">
              <span className="text-slate-500 text-xs block mb-0.5">会場</span>
              <span className="font-medium text-slate-800 block">{venue?.name || '未定'}</span>
              {venue?.address && <span className="text-xs text-slate-500 mt-0.5 block">{venue.address}</span>}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Users className="text-slate-400 mt-0.5 shrink-0" size={18} />
            <div className="text-sm">
              <span className="text-slate-500 text-xs block mb-0.5">対象チーム</span>
              <span className="font-medium text-slate-800">{team?.name}</span>
            </div>
          </div>
          
          {(event.referee_time || event.main_referee_id || event.sub_referee_id) && (
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldAlert className="text-slate-400 mt-0.5 shrink-0" size={18} />
                <div className="text-sm">
                  <span className="text-slate-500 text-xs block mb-0.5">審判担当</span>
                  <div className="font-medium text-slate-800 space-y-1.5 mt-1">
                    {event.referee_time && (
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-slate-400" />
                        <span>担当時間: <span className="font-bold">{event.referee_time}</span></span>
                      </div>
                    )}
                    {event.main_referee_id && (
                       <div className="flex items-center gap-1.5">
                         <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">主審</span>
                         <span>{mainReferee?.name || event.main_referee_id}</span>
                       </div>
                    )}
                    {event.sub_referee_id && (
                       <div className="flex items-center gap-1.5">
                         <span className="bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">副審</span>
                         <span>{subReferee?.name || event.sub_referee_id}</span>
                       </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {event.note && (
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-start gap-3">
              <Info className="text-slate-400 mt-0.5 shrink-0" size={18} />
              <div className="text-sm">
                <span className="text-slate-500 text-xs block mb-1">詳細メモ</span>
                <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-[13px]">{event.note}</p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 総合ステータス */}
      <div className={clsx("rounded-xl p-4 border flex items-center gap-3 shadow-sm", getEventOverallBg())}>
        {overallColor === 'blue' && <CheckCircle size={28} className="text-blue-500" />}
        {overallColor === 'yellow' && <RefreshCw size={28} className="text-yellow-500" />}
        {overallColor === 'red' && <AlertCircle size={28} className="text-red-500" />}
        <div>
          <h2 className="font-bold text-sm">必要備品の準備状況</h2>
          <p className="text-xs opacity-90 mt-0.5">
            {overallColor === 'blue' && 'すべての備品の準備・受け渡しが完了しています。'}
            {overallColor === 'yellow' && '当日までに受け渡しが必要な備品があります。'}
            {overallColor === 'red' && '持参者が決まっていない、または不参加の備品があります！'}
          </p>
        </div>
      </div>

      {/* 必要備品一覧 */}
      <div>
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-2 mb-3">Required Items</h2>
        <div className="space-y-3">
          {itemStatuses.map((ist, idx) => (
            <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 relative overflow-hidden">
              <div className={clsx(
                "absolute top-0 left-0 w-1.5 h-full",
                ist.statusColor === 'blue' && "bg-blue-500",
                ist.statusColor === 'yellow' && "bg-yellow-400",
                ist.statusColor === 'red' && "bg-red-500",
              )} />
              
              <div className="flex justify-between items-start mb-2">
                <Link href={`/items/${ist.item.id}`} className="font-bold text-slate-800 hover:underline flex items-center gap-1.5">
                  <Package size={16} className="text-slate-400" />
                  {ist.item.name}
                </Link>
                <div className="flex items-center gap-2">
                  <span className={clsx(
                    "text-[10px] font-bold px-2 py-0.5 rounded border",
                    ist.statusColor === 'blue' && "bg-blue-50 text-blue-700 border-blue-200",
                    ist.statusColor === 'yellow' && "bg-yellow-50 text-yellow-700 border-yellow-200",
                    ist.statusColor === 'red' && "bg-red-50 text-red-700 border-red-200",
                  )}>
                    {ist.statusLabel}
                  </span>
                  <form action={removeRequiredItemAction}>
                    <input type="hidden" name="id" value={ist.eri.id} />
                    <input type="hidden" name="event_id" value={event.id} />
                    <button type="submit" className="text-slate-400 hover:text-red-500 transition-colors p-1" title="削除">
                      <X size={16} />
                    </button>
                  </form>
                </div>
              </div>

              <div className="text-sm text-slate-600 space-y-1.5 mt-3">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-xs">担当者:</span>
                  <span className={clsx("font-medium", !ist.assignedMember && "text-red-500 italic")}>
                    {ist.assignedMember?.name || '未設定'}
                    {ist.assignedMember && !ist.isAttending && <span className="text-red-500 text-xs ml-1">(不参加)</span>}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-xs">現在の保有:</span>
                  <span className="font-medium">{ist.holderMember?.name || '不明・倉庫'}</span>
                </div>
                
                {ist.pendingHandoff && (
                  <div className="mt-2 bg-orange-50 border border-orange-100 rounded p-2 text-xs text-orange-800 flex items-start gap-1.5">
                    <RefreshCw size={12} className="mt-0.5 shrink-0"/>
                    <div>
                      {ist.holderMember?.name} から {ist.assignedMember?.name} へ受け渡し予定<br/>
                      期限: {new Date(ist.pendingHandoff.receive_deadline_at!).toLocaleDateString('ja-JP')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {itemStatuses.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-sm bg-slate-50 border border-slate-200 rounded-xl">
              必要備品は登録されていません
            </div>
          )}
          
          <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Plus size={16}/> 備品を追加登録</h3>
            <form action={addRequiredItemAction} className="flex gap-2">
              <input type="hidden" name="event_id" value={event.id} />
              <select name="item_id" className="flex-1 border border-slate-200 bg-white rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" required>
                 <option value="">備品を選択...</option>
                 {availableItems.map(i => <option key={i.id} value={i.id}>{i.name} ({i.item_code})</option>)}
              </select>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-1.5 text-sm font-bold shadow-sm transition">
                追加
              </button>
            </form>
          </div>

        </div>
      </div>
    
    </div>
  );
}
