import { getHandoffs, getItems, getMembers, getEvents } from '@/lib/data/db';
import { ArrowLeftRight, Clock, CheckCircle, Package, Calendar } from 'lucide-react';
import Link from 'next/link';

export default async function HandoffsList() {
  const [handoffs, allItems, members, events] = await Promise.all([
    getHandoffs(),
    getItems(),
    getMembers(),
    getEvents()
  ]);

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">受け渡し管理</h1>
        {/* Simple Tabs mock */}
        <div className="flex bg-slate-200 p-1 rounded-lg">
          <button className="px-3 py-1 bg-white text-slate-900 text-xs font-bold rounded shadow-sm">未完了</button>
          <button className="px-3 py-1 text-slate-500 hover:text-slate-800 text-xs font-bold rounded">履歴</button>
        </div>
      </div>

      <div className="space-y-4">
        {handoffs.length > 0 ? handoffs.map(handoff => {
          const item = allItems.find(i => i.id === handoff.item_id);
          const fromUser = members.find(m => m.id === handoff.from_member_id);
          const toUser = members.find(m => m.id === handoff.to_member_id);
          const targetEvent = events.find(e => e.id === handoff.target_event_id);

          const isPending = handoff.status === 'pending' || handoff.status === 'scheduled';
          
          return (
            <div key={handoff.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
              
              <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
                  <Package size={16} className="text-blue-500" />
                  <Link href={`/items/${item?.id}`} className="hover:underline">{item?.name || '不明な備品'}</Link>
                </div>
                {isPending ? (
                  <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-bold animate-pulse">
                    未完了
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold">
                    完了
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between px-2 mb-4">
                <div className="text-center">
                  <div className="text-[10px] text-slate-500 mb-1">渡す人</div>
                  <div className="font-bold text-slate-800 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                    {fromUser?.name || '不明'}
                  </div>
                </div>
                
                <div className="flex flex-col items-center justify-center flex-1 px-4 text-slate-300">
                  <ArrowLeftRight size={24} className="text-blue-400 mb-1" />
                  <div className="h-px bg-slate-200 w-full relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-[10px] text-slate-400">
                      To
                    </div>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-[10px] text-slate-500 mb-1">受け取る人</div>
                  <div className="font-bold text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm">
                    {toUser?.name || '不明'}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 text-sm">
                {targetEvent && (
                  <div className="flex items-start gap-2">
                    <Calendar size={14} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-500 text-xs block">利用予定の試合</span>
                      <Link href={`/events/${targetEvent.id}`} className="font-medium text-blue-600 hover:underline">
                        {targetEvent.date} {targetEvent.title}
                      </Link>
                    </div>
                  </div>
                )}
                
                {handoff.receive_deadline_at && (
                  <div className="flex items-start gap-2">
                    <Clock size={14} className="text-orange-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-slate-500 text-xs block">受け渡し期限</span>
                      <span className="font-bold text-orange-600">
                        {new Date(handoff.receive_deadline_at).toLocaleDateString('ja-JP')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {isPending && (
                <button className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow-sm flex items-center justify-center gap-2">
                  <CheckCircle size={18} />
                  受け渡しを完了にする
                </button>
              )}

            </div>
          );
        }) : (
          <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
            受け渡し予定はありません
          </div>
        )}
      </div>
    </div>
  );
}
