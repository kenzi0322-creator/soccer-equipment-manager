import { notFound } from 'next/navigation';
import { getMembers, getItems } from '@/lib/data/db';
import { ArrowLeft, User, MapPin, Car, BookOpen, Package, Edit3, Train } from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

export default async function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const members = await getMembers();
  const member = members.find(m => m.id === id);
  
  if (!member) return notFound();

  const allItems = await getItems();
  const heldItems = allItems.filter(item => item.current_holder_id === id);

  return (
    <div className="space-y-6 pb-6 mt-2">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Link href="/members" className="p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <span className="font-medium text-slate-800">メンバー詳細</span>
        <Link href={`/members/${member.id}/edit`} className="p-2 -mr-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50 transition-colors block">
          <Edit3 size={20} />
        </Link>
      </div>

      {/* Member Info Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 shrink-0">
            <span className="text-2xl font-bold text-blue-600">
              {member.uniform_number || '-'}
            </span>
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-bold text-slate-800 truncate">{member.name}</h2>
            <div className="text-sm text-slate-500 flex items-center gap-1 mt-1">
              <User size={14} /> {member.role || 'メンバー'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-2">
            <Train size={16} className="text-slate-400 mt-0.5" />
            <div>
              <span className="block text-[11px] text-slate-500 mb-0.5">最寄駅</span>
              <span className="text-sm font-medium text-slate-800">{member.nearest_station || '未登録'}</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Car size={16} className={clsx("mt-0.5", member.has_car ? "text-blue-500" : "text-slate-300")} />
            <div>
              <span className="block text-[11px] text-slate-500 mb-0.5">車出し</span>
              <span className="text-sm font-medium text-slate-800">{member.has_car ? '可能' : '不可'}</span>
            </div>
          </div>
        </div>

        {member.note && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
               備考・メモ
            </label>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap italic">
              {member.note}
            </p>
          </div>
        )}
      </div>

      {/* Held Items List */}
      <div className="space-y-3">
        <h3 className="text-[13px] font-bold text-slate-400 uppercase tracking-wider px-1 flex items-center gap-1.5">
          <Package size={14} /> Currently Held Equipment
        </h3>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {heldItems.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {heldItems.map(item => (
                <Link key={item.id} href={`/items/${item.id}`} className="block p-4 hover:bg-slate-50 transition-colors group">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 group-hover:bg-white group-hover:border-blue-200 transition-colors">
                          {item.item_code}
                        </span>
                        <span className="text-xs text-slate-400 truncate">
                          {item.category}
                        </span>
                      </div>
                      <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                        {item.name}
                      </div>
                    </div>
                    {item.size && (
                      <div className="shrink-0 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-[10px] font-bold text-slate-600 group-hover:bg-white transition-colors">
                        {item.size}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-10 text-center">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                <Package size={20} className="text-slate-300" />
              </div>
              <p className="text-sm text-slate-400 italic">現在保有中の用具はありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
