'use client';

import { useState, useMemo } from 'react';
import { calculateItemStatus } from '@/lib/logic/status';
import { Item, ItemStatusColor, Member, Team, Venue, Handoff, Event, EventRequiredItem, EventParticipant } from '@/types';
import { MapPin, Calendar, User, Search, CheckCircle, RefreshCw, AlertCircle, Clock, Trash2, Edit3, Save, X, Shirt, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { deleteItemAction, updateItemHolderAction } from '@/app/actions/item';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatItemCode } from '@/lib/utils/format';

export default function EquipmentListClient({ 
  initialItems, 
  members,
  teams,
  handoffs,
  events,
  eris,
  participants
}: { 
  initialItems: Item[], 
  members: Member[],
  teams: Team[],
  handoffs: Handoff[],
  events: Event[],
  eris: EventRequiredItem[],
  participants: EventParticipant[]
}) {
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const router = useRouter();

  const itemsWithStatus = useMemo(() => {
    return initialItems.map(item => {
      const status = calculateItemStatus(item, events, eris, participants, handoffs);
      const team = teams.find(t => t.id === item.owner_team_id);
      const holder = members.find(m => m.id === item.current_holder_id);
      return { ...item, statusData: status, team, holder };
    });
  }, [initialItems, members, teams, events, eris, participants, handoffs]);

  const summary = useMemo(() => {
    return {
      red: itemsWithStatus.filter(i => i.statusData.color === 'red').length,
      yellow: itemsWithStatus.filter(i => i.statusData.color === 'yellow').length,
      blue: itemsWithStatus.filter(i => i.statusData.color === 'blue').length,
      gray: itemsWithStatus.filter(i => i.statusData.color === 'gray').length,
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

  // Section visibility states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    red: true,
    yellow: true,
    blue: false,
    general: false,
    tokyo40: false,
    senior: false,
    balls: false,
    others: false,
  });

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Grouping Logic
  const groupedItems = useMemo(() => {
    const groups = {
      // Active (Match-related)
      red: [] as typeof filteredItems,
      yellow: [] as typeof filteredItems,
      blue: [] as typeof filteredItems,
      // Inactive (Inventory)
      general: [] as typeof filteredItems,
      tokyo40: [] as typeof filteredItems,
      senior: [] as typeof filteredItems,
      balls: [] as typeof filteredItems,
      others: [] as typeof filteredItems,
    };

    filteredItems.forEach(item => {
      const color = item.statusData.color;
      
      if (color !== 'gray') {
        // Match-related
        if (color === 'red') groups.red.push(item);
        else if (color === 'yellow') groups.yellow.push(item);
        else if (color === 'blue') groups.blue.push(item);
      } else {
        // Inventory (予定なし)
        const name = item.name;
        // Check for balls first
        const isBall = (name.includes('試合球') || name.includes('ボール') || name.includes('フットサル') || name.toLowerCase().includes('ball') || /^U\d+/.test(name)) && !name.includes('ゴール');
        
        if (isBall) {
          groups.balls.push(item);
        } else if (item.item_code.startsWith('B')) {
          groups.general.push(item);
        } else if (item.item_code.startsWith('T')) {
          groups.tokyo40.push(item);
        } else if (item.item_code.startsWith('S')) {
          groups.senior.push(item);
        } else {
          groups.others.push(item);
        }
      }
    });

    return groups;
  }, [filteredItems]);

  const getStatusIcon = (color: ItemStatusColor) => {
    switch(color) {
      case 'blue': return <CheckCircle size={12} className="mr-1" />;
      case 'yellow': return <RefreshCw size={12} className="mr-1" />;
      case 'red': return <AlertCircle size={12} className="mr-1" />;
      case 'gray': return <Clock size={12} className="mr-1" />;
      default: return null;
    }
  };

  const getItemIcon = (name: string) => {
    if (name.includes('ユニ') || name.includes('ビブス') || name.includes('キャプテンマーク')) {
      if (name.includes('赤')) return '🟥';
      if (name.includes('緑') || name.includes('きみどり')) return '🟩';
      if (name.includes('紫')) return '🟪';
      if (name.includes('黄') || name.includes('イエロー')) return '🟨';
      if (name.includes('水色')) return '🩵';
      if (name.includes('青') || name.includes('ネイビー')) return '🟦';
      if (name.includes('オレンジ')) return '🟧';
      if (name.includes('ピンク')) return '🩷';
      if (name.includes('白')) return '⬜';
      if (name.includes('黒')) return '⬛';
    }
    if (name.includes('レフリー')) return '🔳';
    if (name.includes('キーパーグローブ')) return '🧤';
    if (((name.includes('試合球') || name.includes('ボール') || name.includes('フットサル') || name.toLowerCase().includes('ball') || /^U\d+/.test(name)) && !name.includes('ゴール'))) return '⚽️';
    if (name.includes('担架')) return '🚑';
    if (name.includes('コーン') || name.includes('マーカー')) return '🚩';
    if (name.includes('ビブス')) return '🎽';
    if (name.includes('GKユニ')) return '👔';
    return '📦';
  };

  const renderSection = (id: string, title: string, items: typeof filteredItems, theme: 'active' | 'inventory', showIfEmpty: boolean = false) => {
    if (items.length === 0 && !showIfEmpty) return null;
    const isOpen = openSections[id];
    
    return (
      <div key={id} className="space-y-3">
        <button 
          onClick={() => toggleSection(id)}
          className={clsx(
            "w-full flex items-center justify-between p-3 rounded-xl border transition-all shadow-sm",
            theme === 'active' ? "bg-white border-slate-200" : "bg-slate-100/50 border-slate-200",
            isOpen ? "mb-1" : "mb-0"
          )}
        >
          <div className="flex items-center gap-2">
            <span className={clsx(
              "p-1 rounded-lg",
              id === 'red' && "bg-rose-100 text-rose-600",
              id === 'yellow' && "bg-amber-100 text-amber-600",
              id === 'blue' && "bg-sky-100 text-sky-600",
              theme === 'inventory' && "bg-slate-200 text-slate-500"
            )}>
              {id === 'red' && <AlertCircle size={14} />}
              {id === 'yellow' && <RefreshCw size={14} />}
              {id === 'blue' && <CheckCircle size={14} />}
              {theme === 'inventory' && <Clock size={14} />}
            </span>
            <span className={clsx("font-black text-sm", theme === 'active' ? "text-slate-900" : "text-slate-700")}>
              {title} <span className="ml-1 opacity-50 font-bold">({items.length})</span>
            </span>
          </div>
          <div className={clsx("transition-transform duration-200", isOpen ? "rotate-180" : "")}>
            <span className="text-slate-400">▼</span>
          </div>
        </button>

        {isOpen && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
            {items.map(item => {
              const status = item.statusData;
              const nextEvent = status.nextEvent;
              const recipient = members.find(m => m.id === status.nextEri?.assigned_member_id);
              const isUrgent = status.color === 'red' || status.color === 'yellow';

              return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-slate-200 relative overflow-hidden transition-all hover:border-blue-200 group">
                  <div className={clsx(
                    "absolute top-0 left-0 w-1 h-full",
                    status.color === 'blue' && "bg-sky-500",
                    status.color === 'yellow' && "bg-amber-400",
                    status.color === 'red' && "bg-rose-500",
                    status.color === 'gray' && "bg-slate-300"
                  )} />
                  
                  <div className="p-3 pl-4">
                    {/* Header: Name & Status */}
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                        <Link href={`/items/${item.id}`} className="font-black text-slate-900 text-[15px] hover:underline truncate flex items-center gap-1.5">
                          <span className="shrink-0">{getItemIcon(item.name)}</span>
                          {item.name}
                        </Link>
                      </div>
                      <span className={clsx(
                        "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center border shrink-0",
                        status.color === 'blue' && "bg-sky-50 text-sky-600 border-sky-100",
                        status.color === 'yellow' && "bg-amber-50 text-amber-700 border-amber-100",
                        status.color === 'red' && "bg-rose-50 text-rose-600 border-rose-100",
                        status.color === 'gray' && "bg-slate-50 text-slate-400 border-slate-100"
                      )}>
                        {getStatusIcon(status.color)}
                        {status.color === 'yellow' ? '受け渡し前' : status.label}
                      </span>
                    </div>

                    {/* Event Info (Active items only) */}
                    {nextEvent && status.color !== 'gray' && (
                      <div className="my-2 p-2 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                        {/* Match Day */}
                        <div className="flex items-center gap-1 text-[11px]">
                          <Calendar size={12} className="text-slate-400" />
                          <span className="text-slate-500">試合日:</span>
                          <span className="font-bold text-slate-800">
                            {(() => {
                              const d = new Date(nextEvent.date);
                              const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
                              return `${d.getMonth() + 1}/${d.getDate()}（${weekdays[d.getDay()]}）`;
                            })()}
                          </span>
                        </div>

                        {/* Handoff Details (Deadline and Recipient - only for Red/Yellow/Blue if relevant) */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 border-t border-slate-200/50 mt-1">
                          <div className="flex items-center gap-1 text-[11px]">
                            <Clock size={12} className="text-slate-400" />
                            <span className="text-slate-500">受渡期限:</span>
                            <span className="font-bold text-slate-800">
                              {(() => {
                                const d = new Date(nextEvent.date);
                                const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
                                return `${d.getMonth() + 1}/${d.getDate()}（${weekdays[d.getDay()]}）`;
                              })()} {nextEvent.start_at || ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-[11px]">
                            <User size={12} className="text-slate-400" />
                            <span className="text-slate-500">受取:</span>
                            <span className={clsx("font-black", recipient ? "text-blue-700 underline decoration-blue-200" : "text-rose-600")}>
                              {recipient?.name || '担当未決定'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Bottom Row: Holder & TeamPanel */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/60">
                      <div className="flex items-center gap-3 text-[11px]">
                        <div className="flex items-center gap-1">
                          <User size={12} className="text-slate-400" />
                          <span className="text-slate-500">保有:</span>
                          <span className={clsx("font-black text-slate-800", !item.holder && "text-rose-600 italic")}>
                            {item.holder?.name || '倉庫・不明'}
                          </span>
                        </div>
                        
                        {/* Team Identification Panel */}
                        {(() => {
                          const code = item.item_code;
                          let label = code;
                          let colorClass = "bg-slate-100 text-slate-600 border-slate-200";
                          
                          if (code.startsWith('B')) {
                            label = `一般${code.slice(1)}`;
                            colorClass = "bg-[#d9f99d] text-[#365314] border-[#a3e635] shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.5)]";
                          } else if (code.startsWith('T')) {
                            label = `O40都${code.slice(1)}`;
                            colorClass = "bg-purple-200 text-purple-900 border-purple-300 shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.4)]";
                          } else if (code.startsWith('S')) {
                            label = `50シニア${code.slice(1)}`;
                            colorClass = "bg-amber-900 text-amber-50 border-amber-950 shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.2)]";
                          } else if (code.startsWith('OTH-')) {
                            label = `共${code.split('-')[1]}`;
                          } else if (code.startsWith('M')) {
                            label = `球${code.slice(1)}`;
                          } else if (code.startsWith('U')) {
                            label = `UP${code.slice(1)}`;
                          }

                          return (
                            <span className={clsx("px-2 py-0.5 rounded-md font-black text-[10px] border shadow-sm transition-transform active:scale-95", colorClass)}>
                              {label}
                            </span>
                          );
                        })()}
                      </div>

                      <div className="flex items-center gap-1">
                        {editingId !== item.id && (
                          <button 
                            onClick={() => setEditingId(item.id)}
                            className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-1 shadow-sm"
                          >
                            <Edit3 size={10} />
                            変更
                          </button>
                        )}
                        <form action={deleteItemAction} onSubmit={(e) => { if (!confirm(`「${item.name}」を本当に削除しますか？`)) e.preventDefault(); }}>
                          <input type="hidden" name="id" value={item.id} />
                          <button type="submit" className="text-slate-300 hover:text-rose-500 transition-colors p-1 rounded-md hover:bg-rose-50">
                            <Trash2 size={14} />
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Inline Editing Form */}
                    {editingId === item.id && (
                      <div className="mt-3 p-3 bg-blue-50/30 rounded-xl border border-blue-100">
                        <form action={async (formData) => {
                          const result = await updateItemHolderAction(formData);
                          if (result.success) {
                            setEditingId(null);
                            router.refresh();
                          } else {
                            alert(result.error);
                          }
                        }} className="space-y-3">
                          <input type="hidden" name="id" value={item.id} />
                          <div className="grid grid-cols-1 gap-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">新しい保有者</label>
                            <select 
                              name="current_holder_id" 
                              defaultValue={item.current_holder_id || ""}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs font-bold text-slate-700 outline-none"
                              required
                            >
                              <option value="">未設定</option>
                              {[...members].sort((a,b) => (parseInt(a.uniform_number||'999') - parseInt(b.uniform_number||'999'))).map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.uniform_number ? `${m.uniform_number} ` : ''}{m.name}
                                </option>
                              ))}
                            </select>
                            <div className="flex items-center gap-2">
                              <label className="text-[10px] font-bold text-slate-400 shrink-0">受渡日:</label>
                              <input 
                                type="date" 
                                name="last_handoff_at" 
                                defaultValue={item.last_handoff_at || new Date().toISOString().split('T')[0]}
                                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 outline-none w-full"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button type="button" onClick={() => setEditingId(null)} className="text-[10px] font-bold text-slate-500 px-3 py-1.5">
                              取消
                            </button>
                            <button type="submit" className="text-[10px] font-bold text-white bg-slate-900 px-3 py-1.5 rounded-lg">
                              保存
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-6">
      
      {/* 1. Status Summary */}
      <section className="grid grid-cols-4 gap-2">
        <div className="bg-rose-50 p-2 rounded-xl border border-rose-100 shadow-sm flex flex-col items-center">
          <span className="text-[9px] text-rose-600 font-bold uppercase">未確定</span>
          <span className="text-xl font-black text-rose-700">{summary.red}</span>
        </div>
        <div className="bg-amber-50 p-2 rounded-xl border border-amber-100 shadow-sm flex flex-col items-center">
          <span className="text-[9px] text-amber-600 font-bold uppercase">受渡待</span>
          <span className="text-xl font-black text-amber-700">{summary.yellow}</span>
        </div>
        <div className="bg-sky-50 p-2 rounded-xl border border-sky-100 shadow-sm flex flex-col items-center">
          <span className="text-[9px] text-sky-600 font-bold uppercase">準備OK</span>
          <span className="text-xl font-black text-sky-700">{summary.blue}</span>
        </div>
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center">
          <span className="text-[9px] text-slate-500 font-bold uppercase">予定無</span>
          <span className="text-xl font-black text-slate-700">{summary.gray}</span>
        </div>
      </section>

      {/* 2. Search & Filters */}
      <section className="space-y-2 sticky top-14 bg-slate-50 z-30 py-2 -mx-4 px-4 shadow-[0_10px_10px_-10px_rgba(0,0,0,0.05)]">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none shadow-sm transition-all focus:ring-1 focus:ring-blue-500"
            placeholder="備品名・コードで検索"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <select 
            className="bg-white border border-slate-200 text-slate-700 text-[11px] rounded-lg p-1.5 shadow-sm shrink-0 outline-none"
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
          >
            <option value="all">全チーム</option>
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select 
            className="bg-white border border-slate-200 text-slate-700 text-[11px] rounded-lg p-1.5 shadow-sm shrink-0 outline-none"
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

      {/* 3. Items List (Sectioned) */}
      <div className="space-y-8">
        {/* A. 今対応が必要な備品 */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">今対応が必要な備品</h2>
          <div className="space-y-2">
            {renderSection('red', '未確定', groupedItems.red, 'active')}
            {renderSection('yellow', '受け渡し前', groupedItems.yellow, 'active')}
            {renderSection('blue', '準備OK', groupedItems.blue, 'active')}
          </div>
        </section>

        {/* B. まだ予定のない備品 */}
        <section className="space-y-4">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">まだ予定のない備品</h2>
          <div className="space-y-2">
            {renderSection('general', '文京一般チーム備品', groupedItems.general, 'inventory', true)}
            {renderSection('tokyo40', 'O40都リーグチーム備品', groupedItems.tokyo40, 'inventory', true)}
            {renderSection('senior', '文京シニアチーム備品', groupedItems.senior, 'inventory', true)}
            {renderSection('balls', '共有ボール', groupedItems.balls, 'inventory', true)}
            {renderSection('others', 'その他の備品', groupedItems.others, 'inventory', true)}
          </div>
        </section>

        {filteredItems.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400 text-sm">
            対象の備品が見つかりませんでした
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <Link 
        href="/items/new" 
        className="fixed bottom-20 right-4 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all z-40"
      >
        <Plus size={24} />
      </Link>
    </div>
  );
}
