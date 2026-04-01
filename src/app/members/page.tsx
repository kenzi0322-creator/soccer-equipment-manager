import { getMembers, getItems } from '@/lib/data/db';
import Link from 'next/link';
import { Users, Train } from 'lucide-react';
import { clsx } from 'clsx';

export default async function MembersPage() {
  const [members, items] = await Promise.all([
    getMembers(),
    getItems()
  ]);

  // 番号順に並び替え
  const sortedMembers = [...members].sort((a, b) => {
    const numA = parseInt(a.uniform_number || '');
    const numB = parseInt(b.uniform_number || '');
    const isNumA = !isNaN(numA);
    const isNumB = !isNaN(numB);

    if (isNumA && isNumB) return numA - numB;
    if (isNumA) return -1;
    if (isNumB) return 1;
    return (a.uniform_number || '').localeCompare(b.uniform_number || '');
  });

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="text-blue-600" /> メンバー一覧
        </h1>
      </div>

      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden">
        {sortedMembers.map(member => {
          const myItems = items.filter(i => i.current_holder_id === member.id);
          const hasGkRed = myItems.some(i => i.name.includes('GKユニ') && i.name.includes('赤'));
          const hasGkGreen = myItems.some(i => i.name.includes('GKユニ') && i.name.includes('緑'));
          const hasReferee = myItems.some(i => i.name.includes('レフリー'));
          const hasBibs = myItems.some(i => i.name.includes('ビブス'));
          const ballCount = myItems.filter(i => i.name.includes('球') || i.name.includes('ボール') || i.item_code.startsWith('M') || i.item_code.startsWith('F') || i.item_code.startsWith('U')).length;
          const hasOther = myItems.some(i => 
            !i.name.includes('GKユニ') && 
            !i.name.includes('レフリー') && 
            !i.name.includes('ビブス') && 
            !i.name.includes('球') && 
            !i.name.includes('ボール') &&
            !i.item_code.startsWith('M') &&
            !i.item_code.startsWith('F') &&
            !i.item_code.startsWith('U')
          );

          return (
            <Link 
              href={`/members/${member.id}`} 
              key={member.id} 
              className="flex items-center p-3 sm:p-4 hover:bg-slate-50 transition active:bg-slate-100 gap-3 sm:gap-4"
            >
              {/* 背番号と名前・保有ステータス */}
              <div className="flex items-center gap-3 w-[55%] sm:w-1/2 min-w-[180px]">
                <span className="w-8 h-8 flex items-center justify-center text-xs font-bold text-slate-600 bg-slate-100 rounded-md shrink-0">
                  {member.uniform_number || '-'}
                </span>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800 truncate">{member.name}</span>
                    <div className="flex gap-1 items-center shrink-0">
                      {hasGkRed && <span className="text-[10px] font-black bg-rose-50 text-rose-600 px-1 py-0.5 rounded border border-rose-100 uppercase">🟥GK</span>}
                      {hasGkGreen && <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-1 py-0.5 rounded border border-emerald-100 uppercase">🟩GK</span>}
                      {hasReferee && <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-1 py-0.5 rounded border border-slate-200 uppercase">🔳審判</span>}
                      {hasBibs && <span className="text-sm" title="ビブス">🎽</span>}
                      {ballCount > 0 && <span className="text-sm font-bold flex items-center gap-0.5" title="ボール">⚽️{ballCount}</span>}
                      {hasOther && <span className="text-sm" title="その他">📦</span>}
                    </div>
                  </div>
                  {member.note && (
                    <span className="text-[10px] text-slate-400 truncate mt-0.5" title={member.note}>
                      {member.note.length > 20 ? member.note.substring(0, 20) + '...' : member.note}
                    </span>
                  )}
                </div>
              </div>
              
              {/* 最寄駅 */}
              <div className="flex-1 flex items-center gap-2 text-sm text-slate-600 min-w-0">
                <Train size={16} className="text-slate-400 shrink-0" />
                <span className="truncate">{member.nearest_station || <span className="text-slate-400 italic text-xs">未登録</span>}</span>
              </div>

              {/* 車アイコン */}
              <div className="w-8 sm:w-12 flex justify-center shrink-0 text-xl" title={member.has_car ? "車出し可能" : "車なし"}>
                {member.has_car ? '🚗' : ''}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
