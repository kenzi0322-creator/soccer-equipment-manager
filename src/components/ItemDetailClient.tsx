'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { calculateItemStatus } from '@/lib/logic/status';
import { ArrowLeft, Edit3, User, Calendar, MapPin, Tag, Flag, Package, Info, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Item, ItemStatusColor, Member, Team, Venue, Handoff, Event, EventRequiredItem, EventParticipant } from '@/types';
import { clsx } from 'clsx';
import { formatItemCode } from '@/lib/utils/format';

export default function ItemDetailClient({ 
  initialItem, 
  members,
  teams,
  venues,
  handoffs,
  events,
  eris,
  participants,
  usageHistory = [],
}: { 
  initialItem: Item, 
  members: Member[],
  teams: Team[],
  venues: Venue[],
  handoffs: Handoff[],
  events: Event[],
  eris: EventRequiredItem[],
  participants: EventParticipant[],
  usageHistory?: Array<{ date: string; title: string; assigneeName: string | null }>,
}) {
  const router = useRouter();
  
  // Note: we use initialItem directly. If we want realtime optimistic updates 
  // on notes, we could keep local state. For now, we just derive status.
  const item = initialItem;
  
  const statusData = calculateItemStatus(item, events, eris, participants, handoffs);
  const team = teams.find(t => t.id === item.owner_team_id);
  // コードプレフィックスによるフォールバック（B→一般, T→O40, S→シニア）
  const codePrefix = (item.code || '').charAt(0);
  const teamName = team?.name
    ?? (codePrefix === 'B' ? '文京一般'
      : codePrefix === 'T' ? '都O40'
      : codePrefix === 'S' ? '文京シニア'
      : '不明');
  const holder = members.find(m => m.id === item.current_holder_id);

  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(item.note || '');

  const handleSaveNote = () => {
    // In a real app with Supabase, this would call a Server Action
    // updateItemNote(item.id, noteText);
    item.note = noteText;
    setIsEditingNote(false);
  };

  const formatDateStr = (dateStr: string): string => {
    const d = new Date(dateStr);
    const wd = ['日','月','火','水','木','金','土'];
    return `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}（${wd[d.getDay()]}）`;
  };

  const getStatusStyles = (color: ItemStatusColor) => {
    switch(color) {
      case 'blue': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'red': return 'bg-red-100 text-red-700 border-red-200';
      case 'gray': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 pb-6 mt-2">
      {/* Header Area */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <span className="font-medium text-slate-800">備品詳細</span>
        <Link href={`/items/${item.id}/edit`} className="p-2 -mr-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50 transition-colors block">
          <Edit3 size={20} />
        </Link>
      </div>

      {/* Photo & Basic Info */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
        <div className="aspect-video bg-slate-100 rounded-2xl mb-5 flex items-center justify-center border border-slate-200/60 relative overflow-hidden">
          <Package size={48} className="text-slate-300" />
          <div className={clsx(
            "absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl font-bold text-sm",
            getStatusStyles(statusData.color)
          )}>
            {statusData.label}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <span className="font-mono text-slate-500 tracking-wider">
            {formatItemCode(item.code || '', true)}
          </span>
          {item.shared_flag && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md font-medium border border-purple-200">
              合同チーム共用可
            </span>
          )}
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mb-4">{item.name}</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-2">
            <Calendar size={16} className="text-slate-400 mt-0.5" />
            <div>
              <span className="block text-[11px] text-slate-500 mb-0.5">最終受渡日</span>
              <span className="text-sm font-medium text-slate-800">
                {(item as any).last_handoff_at
                  ? new Date((item as any).last_handoff_at).toLocaleDateString('ja-JP')
                  : '—'}
              </span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Flag size={16} className="text-slate-400 mt-0.5" />
            <div>
              <span className="block text-[11px] text-slate-500 mb-0.5">所属チーム</span>
              <span className="text-sm font-medium text-slate-800">
                 {teamName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Status & Next Actions */}
      <div className="space-y-3">
        <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider px-1">Current Status</h3>
        
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute left-0 top-0 w-1.5 h-full bg-blue-500"></div>
          
          <div className="flex items-center gap-3 mb-4 pl-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
              <User size={20} className="text-blue-600" />
            </div>
            <div>
              <span className="block text-xs text-slate-500 mb-0.5">現在保有者</span>
              <span className="font-bold text-slate-800 text-lg">
                {holder ? holder.name : '未設定'}
              </span>
            </div>
          </div>

          {statusData.nextEvent ? (
            <div className="pl-2 pt-4 border-t border-slate-100">
              <span className="block text-xs text-slate-500 mb-2">次回利用予定</span>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60">
                <div className="font-bold text-slate-800 text-sm mb-1">{statusData.nextEvent.title}</div>
                <div className="flex items-center gap-4 text-xs text-slate-600">
                  <span className="flex items-center gap-1"><Calendar size={12}/> {statusData.nextEvent.date}</span>
                  {statusData.nextEvent.venue_id && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12}/> 
                      {venues.find(v => v.id === statusData.nextEvent!.venue_id)?.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="pl-2 pt-4 border-t border-slate-100 text-sm text-slate-500 italic">
              近い予定はありません
            </div>
          )}

          {statusData.nextHandoff && (
            <div className="mt-4 pl-2">
               <div className="bg-orange-50 rounded-xl p-3 border border-orange-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider block mb-1">Action Required</span>
                  <div className="text-sm font-bold text-slate-800">
                    {members.find(m => m.id === statusData.nextHandoff!.to_member_id)?.name} へパスする
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    期限: {new Date(statusData.nextHandoff.receive_deadline_at!).toLocaleDateString('ja-JP')}
                  </div>
                </div>
                <button className="bg-orange-600 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm">
                  受渡完了
                </button>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* History & Notes */}
      <div className="space-y-3">
        <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider px-1">Details</h3>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold text-sm">
                <Info size={16} /> 管理メモ
              </div>
              {!isEditingNote && (
                <button onClick={() => setIsEditingNote(true)} className="text-xs text-blue-600 font-medium">編集</button>
              )}
            </div>

            {/* レフリー袋の場合はセット内容を表示 */}
            {item.name.includes('レフリー袋') && (
              <div className="mb-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <div className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1">
                  🎽 セット内容（レフリーユニセット）
                </div>
                <div className="text-sm text-slate-700 space-y-0.5">
                  <div>・レフリー半袖</div>
                  <div>・レフリー長袖</div>
                  <div>・レフリーパンツ</div>
                  <div>・レフリーソックス</div>
                </div>
                <div className="mt-2 text-xs text-blue-500">※ 冬夏問わず一式まとめて袋に入れて渡します</div>
              </div>
            )}
            
            {isEditingNote ? (
              <div className="mt-2">
                <textarea 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="状態や特記事項をメモ..."
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button onClick={() => setIsEditingNote(false)} className="px-3 py-1.5 text-xs text-slate-500 font-medium">キャンセル</button>
                  <button onClick={handleSaveNote} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold">保存</button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-600 leading-relaxed min-h-[40px]">
                {item.note || <span className="text-slate-400 italic">メモはありません</span>}
              </p>
            )}
          </div>

          <div className="p-4 bg-slate-50/50">
             <div className="flex items-center gap-1.5 text-slate-700 font-bold text-sm mb-3">
                <RefreshCw size={16} /> 過去の使用履歴
              </div>
              {usageHistory.length > 0 ? (
                <div className="space-y-2">
                  {usageHistory.map((h, i) => (
                    <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-100 last:border-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-2 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-400 mb-0.5">{formatDateStr(h.date)}</div>
                        <div className="text-sm font-medium text-slate-700 truncate">{h.title}</div>
                        {h.assigneeName && (
                          <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <User size={10} />{h.assigneeName}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-400 italic pl-2">まだ使用履歴はありません</div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
