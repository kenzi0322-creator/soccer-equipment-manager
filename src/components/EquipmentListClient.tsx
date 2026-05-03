'use client';

import { useState, useMemo } from 'react';
import { calculateItemStatus, calculateRequirementStatus } from '@/lib/logic/status';
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
  const [editingCompactId, setEditingCompactId] = useState<string | null>(null);
  const [bulkReferee, setBulkReferee] = useState(false);
  const router = useRouter();

  const itemsWithStatus = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // 1. Get all relevant requirements for future events
    const futureEvents = events.filter(e => e.date >= todayStr);
    const futureEventIds = new Set(futureEvents.map(e => e.id));
    const activeEris = eris.filter(eri => eri.required_flag && futureEventIds.has(eri.event_id));

    // 2. Physical Inventory Items
    // For physical items, we still want to show their "Next Action" status
    const physical = initialItems.map(item => {
      const status = calculateItemStatus(item, events, eris, participants, handoffs);
      const team = teams.find(t => t.id === item.owner_team_id);
      const holder = members.find(m => m.id === item.current_holder_id);
      return { ...item, statusData: status, team, holder, isPersonal: false };
    });

    // 3. Virtual Items (Requirements not covered by the primary display of a physical item)
    // We already show each physical item once with its "Next" event.
    // However, if there are OTHER requirements (personal or place-holders) they need to be shown too.
    // ALSO, if a physical item has MULTIPLE future requirements, they should ideally all be counted in summary.
    
    // To simplify:
    // - Every physical item is shown once in the list (Match-related or Inventory).
    // - Every requirement that IS NOT a physical item (template) or IS a personal item is shown as a virtual item.
    
    const virtual = activeEris
      .filter(eri => {
        // If it's personal carry, it's always virtual
        if (eri.is_personal_item) return true;
        // If it's a template (not a physical item), it's virtual
        return !initialItems.some(i => i.id === eri.item_id);
      })
      .map(eri => {
        const event = events.find(e => e.id === eri.event_id);
        const member = members.find(m => m.id === eri.assigned_member_id);
        const status = calculateRequirementStatus(eri, initialItems, events);
        
        let name = "必要備品";
        let code = eri.is_personal_item ? "私物" : "";
        
        if (eri.is_personal_item) {
          const physicalMatch = eri.item_id ? initialItems.find(i => i.id === eri.item_id) : undefined;
          if (physicalMatch) {
            name = physicalMatch.name;
            code = physicalMatch.code || '';
          } else {
            name = eri.display_name || '私物（必要備品）';
          }
        } else {
          // Template placeholder
          name = eri.display_name || '必要備品';
        }

        return {
          id: `virtual_${eri.id}`,
          name,
          code: code,
          statusData: {
            ...status,
            nextEvent: event,
            nextEri: eri
          },
          team: null,
          holder: member,
          isPersonal: eri.is_personal_item,
          owner_team_id: '',
          shared_flag: false,
          current_holder_id: member?.id || null,
          last_handoff_at: undefined,
          category: '',
          size: '',
          color: '',
          photo_url: '',
          current_holder_type: 'member',
          status_note: '',
          note: ''
        } as any;
      });

    return [...physical, ...virtual];
  }, [initialItems, members, teams, events, eris, participants, handoffs]);

  const summary = useMemo(() => {
    // The summary should reflect all ACTIVE requirements for future events.
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const futureEvents = events.filter(e => e.date >= todayStr);
    const futureEventIds = new Set(futureEvents.map(e => e.id));
    const activeEris = eris.filter(eri => eri.required_flag && futureEventIds.has(eri.event_id));

    const counts = { red: 0, yellow: 0, blue: 0, gray: 0 };
    
    activeEris.forEach(eri => {
      const status = calculateRequirementStatus(eri, initialItems, events);
      if (status.color === 'red') counts.red++;
      else if (status.color === 'yellow') counts.yellow++;
      else if (status.color === 'blue') counts.blue++;
    });

    // Gray is for physical items that have NO future requirements
    const physicalWithRequirements = new Set(activeEris.map(eri => eri.item_id));
    const unscheduledCount = initialItems.filter(item => !physicalWithRequirements.has(item.id)).length;
    counts.gray = unscheduledCount;

    return counts;
  }, [initialItems, events, eris]);


  const filteredItems = useMemo(() => {
    let result = itemsWithStatus;
    
    if (search) {
      result = result.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || (i.code || '').toLowerCase().includes(search.toLowerCase()));
    }
    if (teamFilter !== 'all') {
      result = result.filter(i => i.team?.id === teamFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter(i => i.statusData.color === statusFilter);
    }
    
    const colorWeight: Record<ItemStatusColor, number> = { red: 1, yellow: 2, blue: 3, gray: 4 };
    result.sort((a, b) => {
      const wA = colorWeight[a.statusData.color as ItemStatusColor] || 5;
      const wB = colorWeight[b.statusData.color as ItemStatusColor] || 5;
      if (wA !== wB) return wA - wB;
      
      const dA = a.statusData.nextEvent ? new Date(a.statusData.nextEvent.date).getTime() : Infinity;
      const dB = b.statusData.nextEvent ? new Date(b.statusData.nextEvent.date).getTime() : Infinity;
      if (dA !== dB) return dA - dB;
      
      // Fallback: sort by code (prefix then number)
      const codeAStr = a.code || a.id || '';
      const codeBStr = b.code || b.id || '';
      const prefixA = codeAStr.replace(/[0-9]/g, '');
      const prefixB = codeBStr.replace(/[0-9]/g, '');
      if (prefixA !== prefixB) return prefixA.localeCompare(prefixB);
      
      const numA = parseInt(codeAStr.replace(/\D/g, '') || '0', 10);
      const numB = parseInt(codeBStr.replace(/\D/g, '') || '0', 10);
      return numA - numB;
    });

    return result;
  }, [itemsWithStatus, search, teamFilter, statusFilter]);

  // ===== レフリーユニセット グループ化（表示のみ・全セクション対応） =====
  const REF_UNI_NAMES = ['レフリー袋', 'レフリー半袖', 'レフリー長袖', 'レフリーパンツ', 'レフリーソックス'];
  const REF_UNI_KEYS = new Set(['ref_bag', 'ref_half', 'ref_long', 'ref_pants', 'ref_socks']);
  const isRefUni = (item: any) => {
    const tk = item.statusData?.nextEri?.template_key || '';
    return REF_UNI_KEYS.has(tk) || REF_UNI_NAMES.some(n => item.name.includes(n));
  };
  const isRefBag = (item: any) => {
    const tk = item.statusData?.nextEri?.template_key || '';
    return tk === 'ref_bag' || item.name.includes('レフリー袋');
  };
  const isRefGear = (item: any) => {
    const tk = item.statusData?.nextEri?.template_key || '';
    return tk === 'ref_gear' || item.name.includes('レフリー機材');
  };

  const displayItems = useMemo(() => {
    const physicalRefBag = initialItems.find(i => i.name.includes('レフリー袋'));
    const refBagLinkId = physicalRefBag?.id || null;
    const colorPri: Record<string, number> = { red: 0, yellow: 1, blue: 2, gray: 3 };

    // グループキー: グレーは全体で1グループ、アクティブはイベントごと
    const getGroupKey = (item: any) => {
      if (item.statusData.color === 'gray') return 'ref_uni_gray';
      const evId = item.statusData.nextEvent?.id || item.statusData.nextEri?.event_id || 'unknown';
      return `ref_uni_${item.statusData.color}_${evId}`;
    };

    const seenGroups = new Set<string>();
    const result: typeof filteredItems = [];

    for (const item of filteredItems) {
      if (isRefGear(item)) {
        result.push({ ...item, name: 'レフリー道具セット（笛・カード・ワッペンなど）' } as any);
      } else if (isRefUni(item)) {
        const groupKey = getGroupKey(item);
        if (!seenGroups.has(groupKey)) {
          seenGroups.add(groupKey);
          const groupItems = filteredItems.filter(i => isRefUni(i) && getGroupKey(i) === groupKey);
          const worstColor = groupItems.reduce((worst, i) =>
            (colorPri[i.statusData.color] ?? 99) < (colorPri[worst] ?? 99) ? i.statusData.color : worst
          , 'blue' as string);
          const repItem = groupItems.find(i => isRefBag(i)) || item;
          result.push({
            ...repItem,
            id: refBagLinkId || `ref_uni_${groupKey}`,
            name: 'レフリーユニセット（M）',
            isPersonal: true, // 編集はイベント詳細から（セット全体のため）
            statusData: { ...repItem.statusData, color: worstColor as any },
          } as any);
        }
        // 個別アイテムはスキップ
      } else {
        result.push(item);
      }
    }
    return result;
  }, [filteredItems, initialItems]);

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
      red: [] as typeof displayItems,
      yellow: [] as typeof displayItems,
      blue: [] as typeof displayItems,
      general: [] as typeof displayItems,
      tokyo40: [] as typeof displayItems,
      senior: [] as typeof displayItems,
      balls: [] as typeof displayItems,
      others: [] as typeof displayItems,
    };

    displayItems.forEach(item => {
      const color = item.statusData.color;
      if (color !== 'gray') {
        if (color === 'red') groups.red.push(item);
        else if (color === 'yellow') groups.yellow.push(item);
        else if (color === 'blue') groups.blue.push(item);
      } else {
        const name = item.name;
        const isBall = (name.includes('試合球') || name.includes('ボール') || name.includes('フットサル') || name.toLowerCase().includes('ball') || /^U\d+/.test(name)) && !name.includes('ゴール');
        if (isBall) groups.balls.push(item);
        else if ((item.code || '').startsWith('B')) groups.general.push(item);
        else if ((item.code || '').startsWith('T')) groups.tokyo40.push(item);
        else if ((item.code || '').startsWith('S')) groups.senior.push(item);
        else groups.others.push(item);
      }
    });
    return groups;
  }, [displayItems]);

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
    if (name.includes('レフリーユニセット')) return '🎽';
    if (name.includes('レフリー道具セット')) return '🎯';
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

  const renderSection = (id: string, title: string, items: typeof filteredItems, theme: 'active' | 'inventory', showIfEmpty: boolean = false, compact: boolean = false, noCollapse: boolean = false) => {
    if (items.length === 0 && !showIfEmpty) return null;
    const isOpen = noCollapse || openSections[id];
    
    return (
      <div key={id} className="space-y-3">
        {/* 折りたたみヘッダー（noCollapseの場合はボタンなしで静的表示） */}
        {noCollapse ? (
          <div className={clsx(
            "w-full flex items-center p-3 rounded-xl border shadow-sm",
            theme === 'active' ? "bg-white border-slate-200" : "bg-slate-100/50 border-slate-200",
            "mb-1"
          )}>
            <div className="flex items-center gap-2">
              <span className={clsx(
                "p-1 rounded-lg",
                id === 'blue' && "bg-sky-100 text-sky-600",
              )}>
                <CheckCircle size={14} />
              </span>
              <span className="font-black text-sm text-slate-900">
                {title} <span className="ml-1 opacity-50 font-bold">({items.length})</span>
              </span>
            </div>
          </div>
        ) : (
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
        )}

        {isOpen && (
          <div className={clsx("animate-in fade-in slide-in-from-top-1 duration-200", compact ? "" : "space-y-3")}>
            {compact ? (
              // コンパクト1行表示（準備OK用）
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {items.map((item, idx) => {
                  const status = item.statusData;
                  const nextEvent = status.nextEvent;
                  const recipient = members.find(m => m.id === status.nextEri?.assigned_member_id);
                  const dateStr = nextEvent ? (() => {
                    const d = new Date(nextEvent.date);
                    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
                    return `${d.getMonth() + 1}/${d.getDate()}（${weekdays[d.getDay()]}）`;
                  })() : '—';
                  const isEditingThis = editingCompactId === item.id;
                  return (
                    <div key={item.id} className={clsx(
                      idx !== 0 && "border-t border-slate-100"
                    )}>
                      {/* 1行表示 */}
                      <div className="flex items-center gap-2 px-3 py-2.5">
                        <div className="w-1 h-5 rounded-full bg-sky-400 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-500 shrink-0 w-[72px]">{dateStr}</span>
                        <span className="flex-1 text-[13px] font-black text-slate-800 truncate flex items-center gap-1">
                          <span className="shrink-0 text-[11px]">{getItemIcon(item.name)}</span>
                          {item.name}
                        </span>
                        <span className="text-[12px] font-bold text-sky-700 shrink-0 max-w-[60px] truncate text-right">
                          {recipient?.name || item.holder?.name || '—'}
                        </span>
                        {isEditingThis ? (
                          <button
                            onClick={() => setEditingCompactId(null)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors shrink-0"
                          >
                            <X size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => setEditingCompactId(item.id)}
                            className="p-1 text-slate-300 hover:text-blue-500 rounded-full hover:bg-blue-50 transition-colors shrink-0"
                          >
                            <Edit3 size={13} />
                          </button>
                        )}
                      </div>

                      {/* インライン編集フォーム（展開時） */}
                      {isEditingThis && !item.isPersonal && (
                        <div className="mx-3 mb-3 p-3 bg-blue-50/40 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-1 duration-150">
                          <form action={async (formData) => {
                            const result = await updateItemHolderAction(formData);
                            if (result.success) {
                              setEditingCompactId(null);
                              router.refresh();
                            } else {
                              alert(result.error);
                            }
                          }} className="space-y-2">
                            <input type="hidden" name="id" value={item.id} />
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
                                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 outline-none flex-1"
                              />
                            </div>
                            <div className="flex gap-2 justify-end pt-1">
                              <button type="button" onClick={() => setEditingCompactId(null)} className="text-[10px] font-bold text-slate-500 px-3 py-1.5">取消</button>
                              <button type="submit" className="text-[10px] font-bold text-white bg-slate-900 px-3 py-1.5 rounded-lg">保存</button>
                            </div>
                          </form>
                        </div>
                      )}
                      {/* 個人持参の場合は試合詳細から変更できることを案内 */}
                      {isEditingThis && item.isPersonal && (
                        <div className="mx-3 mb-3 p-3 bg-blue-50/40 rounded-xl border border-blue-100 text-[11px] text-slate-500">
                          個人持参の備品は<br />
                          <span className="font-bold text-slate-700">試合詳細ページ → 割り当て「修正」</span><br />
                          から変更できます。
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              // 通常カード表示
              <div className="space-y-3">
              {items.map(item => {
                const status = item.statusData;
                const nextEvent = status.nextEvent;
                const recipient = members.find(m => m.id === status.nextEri?.assigned_member_id);

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
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                          {(item.id.startsWith('virtual_') || item.id.startsWith('ref_uni_')) ? (
                            <span className="font-black text-slate-900 text-[15px] truncate flex items-center gap-1.5">
                              <span className="shrink-0">{getItemIcon(item.name)}</span>
                              {item.name}
                            </span>
                          ) : (
                            <Link href={`/items/${item.id}`} className="font-black text-slate-900 text-[15px] hover:underline truncate flex items-center gap-1.5">
                              <span className="shrink-0">{getItemIcon(item.name)}</span>
                              {item.name}
                            </Link>
                          )}
                        </div>
                        <span className={clsx(
                          "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider flex items-center border shrink-0",
                          status.color === 'blue' && "bg-sky-50 text-sky-600 border-sky-100",
                          status.color === 'yellow' && "bg-amber-50 text-amber-700 border-amber-100",
                          status.color === 'red' && "bg-rose-50 text-rose-600 border-rose-100",
                          status.color === 'gray' && "bg-slate-50 text-slate-400 border-slate-100"
                        )}>
                          {getStatusIcon(status.color)}
                          {item.isPersonal ? '私物対応' : (status.color === 'yellow' ? '受け渡し前' : status.label)}
                        </span>
                      </div>

                      {nextEvent && status.color !== 'gray' && (
                        <div className="my-2 p-2 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
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

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100/60">
                        <div className="flex items-center gap-3 text-[11px]">
                          <div className="flex items-center gap-1">
                            <User size={12} className="text-slate-400" />
                            <span className="text-slate-500">{item.isPersonal ? '持参者' : '保有'}:</span>
                            <span className={clsx("font-black text-slate-800", !item.holder && "text-rose-600 italic")}>
                              {item.holder?.name || '倉庫・不明'}
                            </span>
                          </div>
                          {!item.isPersonal && (() => {
                            const code = item.code || '';
                            let label = code;
                            let colorClass = "bg-slate-100 text-slate-600 border-slate-200";
                            if (code.startsWith('B')) { label = `一般${code.slice(1)}`; colorClass = "bg-[#d9f99d] text-[#365314] border-[#a3e635]"; }
                            else if (code.startsWith('T')) { label = `O40都${code.slice(1)}`; colorClass = "bg-purple-200 text-purple-900 border-purple-300"; }
                            else if (code.startsWith('S')) { label = `50シニア${code.slice(1)}`; colorClass = "bg-amber-900 text-amber-50 border-amber-950"; }
                            else if (code.startsWith('OTH-')) { label = `共${code.split('-')[1]}`; }
                            else if (code.startsWith('M')) { label = `球${code.slice(1)}`; }
                            else if (code.startsWith('U')) { label = `UP${code.slice(1)}`; }
                            return label ? <span className={clsx("px-2 py-0.5 rounded-md font-black text-[10px] border shadow-sm", colorClass)}>{label}</span> : null;
                          })()}
                        </div>
                        <div className="flex items-center gap-1">
                          {editingId !== item.id && !item.isPersonal && (
                            <button onClick={() => setEditingId(item.id)} className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-1 shadow-sm">
                              <Edit3 size={10} />変更
                            </button>
                          )}
                          {!item.isPersonal && (
                            <form action={deleteItemAction} onSubmit={(e) => { if (!confirm(`「${item.name}」を本当に削除しますか？`)) e.preventDefault(); }}>
                              <input type="hidden" name="id" value={item.id} />
                              <button type="submit" className="text-slate-300 hover:text-rose-500 transition-colors p-1 rounded-md hover:bg-rose-50"><Trash2 size={14} /></button>
                            </form>
                          )}
                        </div>
                      </div>

                      {editingId === item.id && (
                        <div className="mt-3 p-3 bg-blue-50/30 rounded-xl border border-blue-100">
                          <form action={async (formData) => {
                            const result = await updateItemHolderAction(formData);
                            if (result.success) { setEditingId(null); setBulkReferee(false); router.refresh(); }
                            else { alert(result.error); }
                          }} className="space-y-3">
                            <input type="hidden" name="id" value={item.id} />
                            {bulkReferee && <input type="hidden" name="bulk_referee" value="true" />}
                            <div className="grid grid-cols-1 gap-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase">新しい保有者</label>
                              <select name="current_holder_id" defaultValue={item.current_holder_id || ""} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-2 text-xs font-bold text-slate-700 outline-none" required>
                                <option value="">未設定</option>
                                {[...members].sort((a,b) => (parseInt(a.uniform_number||'999') - parseInt(b.uniform_number||'999'))).map(m => (
                                  <option key={m.id} value={m.id}>{m.uniform_number ? `${m.uniform_number} ` : ''}{m.name}</option>
                                ))}
                              </select>
                              <div className="flex items-center gap-2">
                                <label className="text-[10px] font-bold text-slate-400 shrink-0">受渡日:</label>
                                <input type="date" name="last_handoff_at" defaultValue={item.last_handoff_at || new Date().toISOString().split('T')[0]} className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 outline-none w-full" />
                              </div>
                              {item.name.startsWith('レフリー') && (
                                <label className="flex items-start gap-2 cursor-pointer mt-1">
                                  <input type="checkbox" checked={bulkReferee} onChange={(e) => setBulkReferee(e.target.checked)} className="mt-0.5 accent-blue-500" />
                                  <span className="text-[11px] text-slate-600 leading-tight">関連するレフリー用品も<br />まとめて同じ人に変更する</span>
                                </label>
                              )}
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button type="button" onClick={() => { setEditingId(null); setBulkReferee(false); }} className="text-[10px] font-bold text-slate-500 px-3 py-1.5">取消</button>
                              <button type="submit" className="text-[10px] font-bold text-white bg-slate-900 px-3 py-1.5 rounded-lg">保存</button>
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
            {renderSection('blue', '準備OK', groupedItems.blue, 'active', false, true, true)}
            {renderSection('yellow', '受け渡し前', groupedItems.yellow, 'active')}
            {renderSection('red', '未確定', groupedItems.red, 'active')}
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
