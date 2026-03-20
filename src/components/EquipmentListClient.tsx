'use client';

import { useState, useMemo } from 'react';
import { MOCK_TEAMS, MOCK_MEMBERS, MOCK_VENUES, MOCK_HANDOFFS } from '@/lib/data/mock';
import { calculateItemStatus } from '@/lib/logic/status';
import { Item, ItemStatusColor } from '@/types';
import { MapPin, Calendar, User, Search, CheckCircle, RefreshCw, AlertCircle, Clock } from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';

export default function EquipmentListClient({ initialItems }: { initialItems: Item[] }) {
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const itemsWithStatus = useMemo(() => {
    return initialItems.map(item => {
      const status = calculateItemStatus(item);
      const team = MOCK_TEAMS.find(t => t.id === item.owner_team_id);
      const holder = MOCK_MEMBERS.find(m => m.id === item.current_holder_id);
      return { ...item, statusData: status, team, holder };
    });
  }, [initialItems]);

  const summary = useMemo(() => {
    return {
      handoffsToday: 0,
      closeDeadlines: MOCK_HANDOFFS.filter(h => h.status === 'pending').length,
      unconfirmed: itemsWithStatus.filter(i => i.statusData.color === 'red').length,
      lending: itemsWithStatus.filter(i => i.current_holder_id && !i.shared_flag).length,
    };
  }, [itemsWithStatus]);

  const filteredItems = useMemo(() => {
    let result = itemsWithStatus;
    
    if (search) {
      result = result.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.item_code.toLowerCase().includes(search.toLowerCase()));
    }
    if (teamFilter !== 'all') {
      result = result.filter(i => i.team?.id === teamFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter(i => i.statusData.color === statusFilter);
    }
    
    const colorWeight: Record<ItemStatusColor, number> = { red: 1, yellow: 2, blue: 3, gray: 4 };
    result.sort((a, b) => {
      const wA = colorWeight[a.statusData.color] || 5;
      const wB = colorWeight[b.statusData.color] || 5;
      if (wA !== wB) return wA - wB;
      
      const dA = a.statusData.nextEvent ? new Date(a.statusData.nextEvent.date).getTime() : Infinity;
      const dB = b.statusData.nextEvent ? new Date(b.statusData.nextEvent.date).getTime() : Infinity;
      return dA - dB;
    });

    return result;
  }, [itemsWithStatus, search, teamFilter, statusFilter]);

  const getStatusStyles = (color: ItemStatusColor) => {
    switch(color) {
      case 'blue': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'yellow': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'red': return 'bg-red-100 text-red-700 border-red-200';
      case 'gray': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getStatusIcon = (color: ItemStatusColor) => {
    switch(color) {
      case 'blue': return <CheckCircle size={14} className="mr-1" />;
      case 'yellow': return <RefreshCw size={14} className="mr-1" />;
      case 'red': return <AlertCircle size={14} className="mr-1" />;
      case 'gray': return <Clock size={14} className="mr-1" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 pb-6">
      
      <section className="grid grid-cols-2 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">今日受渡予定</span>
          <span className="text-2xl font-bold mt-1">{summary.handoffsToday}<span className="text-sm font-normal text-slate-400 ml-1">件</span></span>
        </div>
        <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 shadow-sm flex flex-col">
          <span className="text-xs text-orange-600 font-medium whitespace-nowrap">未受領 (期限近)</span>
          <span className="text-2xl font-bold text-orange-700 mt-1">{summary.closeDeadlines}<span className="text-sm font-normal text-orange-400 ml-1">件</span></span>
        </div>
        <div className="bg-red-50 p-3 rounded-xl border border-red-100 shadow-sm flex flex-col">
          <span className="text-xs text-red-600 font-medium whitespace-nowrap">未確定備品</span>
          <span className="text-2xl font-bold text-red-700 mt-1">{summary.unconfirmed}<span className="text-sm font-normal text-red-400 ml-1">件</span></span>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">貸出中</span>
          <span className="text-2xl font-bold mt-1">{summary.lending}<span className="text-sm font-normal text-slate-400 ml-1">件</span></span>
        </div>
      </section>

      <section className="space-y-3 sticky top-14 bg-slate-50 z-30 py-2 -mx-4 px-4 shadow-[0_10px_10px_-10px_rgba(0,0,0,0.05)]">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none shadow-sm transition-all"
            placeholder="備品名・コードで検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          <select 
            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 shadow-sm shrink-0"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            <option value="all">全チーム</option>
            {MOCK_TEAMS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select 
            className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2 shadow-sm shrink-0"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">全ステータス</option>
            <option value="red">未確定</option>
            <option value="yellow">受け渡し待ち</option>
            <option value="blue">準備OK</option>
            <option value="gray">予定なし</option>
          </select>
        </div>
      </section>

      <section className="space-y-4">
        {filteredItems.map(item => (
          <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 relative overflow-hidden active:scale-[0.98] transition-transform">
            <div className={clsx(
              "absolute top-0 left-0 w-1.5 h-full",
              item.statusData.color === 'blue' && "bg-blue-500",
              item.statusData.color === 'yellow' && "bg-yellow-400",
              item.statusData.color === 'red' && "bg-red-500",
              item.statusData.color === 'gray' && "bg-slate-300"
            )} />
            
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 pr-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className={clsx(
                    "px-2 py-0.5 rounded-full text-xs font-bold flex items-center border",
                    getStatusStyles(item.statusData.color)
                  )}>
                    {getStatusIcon(item.statusData.color)}
                    {item.statusData.label}
                  </span>
                  <span className="text-[10px] text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded bg-slate-50">
                    {item.item_code}
                  </span>
                  {item.shared_flag && (
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">
                      共用
                    </span>
                  )}
                </div>
                <h3 className="text-base font-bold text-slate-800 leading-tight">
                  <Link href={`/items/${item.id}`} className="hover:underline">
                    {item.name}
                  </Link>
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5">
                  {(item.size || item.color) && (
                    <span>{item.size} {item.color}</span>
                  )}
                  {item.team && (
                    <span className="flex items-center"><div className="w-2 h-2 rounded-full bg-blue-200 mr-1"></div>{item.team.name}</span>
                  )}
                </div>
              </div>
              
              <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                <span className="text-[10px] text-slate-400">No Photo</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2.5">
              <div className="flex items-start gap-2">
                <User size={16} className="text-slate-400 mt-0.5 shrink-0" />
                <div className="text-sm">
                  <span className="text-slate-500 text-xs block mb-0.5">現在の保有者</span>
                  <span className="font-medium text-slate-800">
                    {item.holder ? item.holder.name : '未定・倉庫'}
                  </span>
                </div>
              </div>

              {item.statusData.nextEvent ? (
                <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
                  <div className="flex items-start gap-2 mb-2">
                    <Calendar size={14} className="text-slate-400 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <span className="text-slate-500 text-xs block mb-0.5">次回利用予定</span>
                      <span className="font-medium text-slate-800">
                        {item.statusData.nextEvent.date} {item.statusData.nextEvent.title}
                      </span>
                    </div>
                  </div>
                  
                  {item.statusData.nextEvent.venue_id && (
                    <div className="flex items-start gap-2 mb-2">
                      <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                      <div className="text-sm text-slate-700">
                        {MOCK_VENUES.find(v => v.id === item.statusData.nextEvent!.venue_id)?.name}
                      </div>
                    </div>
                  )}

                  {item.statusData.nextHandoff && (
                    <div className="mt-2 border-t border-slate-200 pt-2 flex items-start gap-2 text-sm">
                      <Clock size={14} className="text-orange-500 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <span className="text-orange-600 font-medium text-xs block mb-0.5">受渡期限</span>
                        <span className="font-medium text-slate-800">
                          {new Date(item.statusData.nextHandoff.receive_deadline_at!).toLocaleDateString('ja-JP')}
                        </span>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {MOCK_MEMBERS.find(m => m.id === item.statusData.nextHandoff!.to_member_id)?.name} へ
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-sm text-slate-400 flex items-center gap-1.5 italic">
                  <Calendar size={14} />
                  直近の利用予定はありません
                </div>
              )}
            </div>

          </div>
        ))}
        {filteredItems.length === 0 && (
          <div className="text-center py-10 text-slate-400">
            条件に一致する備品がありません
          </div>
        )}
      </section>
      
      {/* Floating Action Button */}
      <Link 
        href="/items/new" 
        className="fixed bottom-20 right-4 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-[0_8px_16px_rgba(37,99,235,0.3)] hover:bg-blue-700 hover:scale-105 transition-all z-40 active:scale-95"
      >
        <div className="text-3xl font-light mb-1">+</div>
      </Link>
    </div>
  );
}
