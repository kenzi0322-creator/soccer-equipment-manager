import { notFound } from 'next/navigation';
import { getEvents, getEventRequiredItems, getItems, getTeams, getVenues, getMembers, getEventParticipants, getHandoffs } from '@/lib/data/db';
import { Calendar, CheckCircle, RefreshCw, AlertCircle, ArrowLeft, Package } from 'lucide-react';
import { clsx } from 'clsx';
import Link from 'next/link';
import EventActions from '@/components/EventActions';
import ManualAddRequiredItem from '@/components/ManualAddRequiredItem';
import RemoveRequiredItemButton from '@/components/RemoveRequiredItemButton';
import AutoAddStandardEquipmentButton from '@/components/AutoAddStandardEquipmentButton';
import AddRefereeSetButton from '@/components/AddRefereeSetButton';
import QuantityIncrementButton from '@/components/QuantityIncrementButton';
import CollapsibleNote from '@/components/CollapsibleNote';

export default async function EventDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);
  
  try {
    const [events, allEris, allItems, teams, venues, members, participants, handoffs] = await Promise.all([
      getEvents(),
      getEventRequiredItems(),
      getItems(),
      getTeams(),
      getVenues(),
      getMembers(),
      getEventParticipants(),
      getHandoffs()
    ]);

    const event = events.find(e => e.id === id);

    if (!event) {
      return (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm mt-10">
          <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h1 className="text-xl font-bold text-slate-900 mb-2">試合が見つかりません</h1>
          <p className="text-sm text-slate-500 mb-6">指定された試合データが見つかりませんでした。</p>
          <Link href="/events" className="text-blue-600 font-bold hover:underline">
            試合一覧に戻る
          </Link>
        </div>
      );
    }
    
    const requiredItemLinks = (allEris || []).filter(eri => eri.event_id === event.id && eri.required_flag);
    const availableItems = (allItems || []).filter(i => !requiredItemLinks.some(eri => eri.item_id === i.id));

    // 未設定項目の抽出 (備品に関連するものに絞る)
    const unsetFields = [];
    if (requiredItemLinks.length === 0) unsetFields.push('必要備品');

    // Calculate statuses for required items
    const itemStatuses = requiredItemLinks.map(eri => {
      let item = allItems?.find(i => i.id === eri.item_id);
      
      // Virtual Template Handling: If item not found but it's a known template ID
      if (!item) {
        if (eri.item_id === 'i_gk_template') {
          item = { id: 'i_gk_template', name: 'GKユニフォーム (種類選択)', category: 'goalkeeper', shared_flag: true } as any;
        } else if (eri.item_id === 'i_match_ball_template') {
          item = { id: 'i_match_ball_template', name: '試合球 (種類選択)', category: 'shared', shared_flag: true } as any;
        } else if (eri.item_id === 'i_warmup_ball_template') {
          item = { id: 'i_warmup_ball_template', name: 'アップ用ボール (種類選択)', category: 'shared', shared_flag: true } as any;
        } else if (eri.item_id === 'i_ref_half_template') {
          item = { id: 'i_ref_half_template', name: 'レフリー半袖', category: 'shared', shared_flag: true } as any;
        } else if (eri.item_id === 'i_ref_long_template') {
          item = { id: 'i_ref_long_template', name: 'レフリー長袖', category: 'shared', shared_flag: true } as any;
        } else if (eri.item_id === 'i_ref_pants_template') {
          item = { id: 'i_ref_pants_template', name: 'レフリーパンツ', category: 'shared', shared_flag: true } as any;
        } else if (eri.item_id === 'i_ref_socks_template') {
          item = { id: 'i_ref_socks_template', name: 'レフリーソックス', category: 'shared', shared_flag: true } as any;
        } else if (eri.item_id === 'i_ref_flags_template') {
          item = { id: 'i_ref_flags_template', name: 'レフリーフラッグ', category: 'shared', shared_flag: true } as any;
        } else if (eri.item_id === 'i_ref_gear_template') {
          item = { id: 'i_ref_gear_template', name: 'レフリー機材（ホイッスル等）', category: 'shared', shared_flag: true } as any;
        }
      }

      if (!item) return null;
      
      const assignedMember = members?.find(m => m.id === eri.assigned_member_id);
      const holderMember = members?.find(m => m.id === item.current_holder_id);
      const participant = participants?.find(ep => ep.event_id === event.id && ep.member_id === (eri.assigned_member_id || item.current_holder_id));
      const isAttending = participant?.attendance_status === 'attending';

      const pendingHandoff = handoffs?.find(h => h.item_id === item.id && h.target_event_id === event.id && h.status !== 'completed');

      let statusColor: 'blue' | 'yellow' | 'red' = 'red';
      let statusLabel = '未定・問題あり';

      if (eri.is_personal_item) {
        statusColor = 'blue';
        statusLabel = '個人持参';
      } else if (!eri.assigned_member_id) {
        statusColor = 'red';
        statusLabel = '持参者未設定';
      } else if (item.current_holder_id === eri.assigned_member_id) {
        statusColor = 'blue';
        statusLabel = '準備OK';
      } else {
        // 現在の保有者が担当者ではない場合
        statusColor = 'yellow';
        statusLabel = pendingHandoff ? '受け渡し未完了' : '受け渡し待ち';
      }

      const isTemplate = item.id.includes('template');
      const isBall = item.name.includes('球') || item.name.includes('ボール');

      return { eri, item, assignedMember, holderMember, statusColor, statusLabel, isAttending, pendingHandoff, isTemplate, isBall };
    }).filter((s): s is NonNullable<typeof s> => s !== null);

    // Event overall status
    let overallColor: 'blue' | 'yellow' | 'red' = 'blue';
    let overallLabel = 'すべての備品の準備・受け渡しが完了しています。';

    if (requiredItemLinks.length === 0) {
      overallColor = 'yellow';
      overallLabel = '必要備品が1件も登録されていません。まずは備品を追加してください。';
    } else if (itemStatuses.some(i => i.statusColor === 'red')) {
      overallColor = 'red';
      overallLabel = '持参者が決まっていない備品があります！';
    } else if (itemStatuses.some(i => i.statusColor === 'yellow')) {
      overallColor = 'yellow';
      overallLabel = '当日までに受け渡しが必要な備品があります。';
    }

    const getEventOverallBg = () => {
      if (overallColor === 'blue') return 'bg-blue-50 border-blue-200 text-blue-800';
      if (overallColor === 'yellow') return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      return 'bg-red-50 border-red-200 text-red-800';
    };

    return (
      <div className="space-y-6 pb-6">
        <div className="flex items-center justify-between mb-4">
          <Link href="/events" className="p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <span className="font-medium text-slate-800">試合詳細</span>
          <EventActions eventId={event.id} />
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
          {unsetFields.length > 0 && (
            <div className="mb-4 bg-red-50 border border-red-100 rounded-xl p-3 flex items-start gap-3">
              <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <div className="flex-1">
                <p className="text-xs font-bold text-red-800">必要備品が未登録です</p>
                <Link href={`/events/${rawId}/edit`} className="inline-block mt-2 text-[10px] font-bold text-white bg-red-500 px-2 py-1 rounded-lg hover:bg-red-600 transition-colors">
                  備品を追加する
                </Link>
              </div>
            </div>
          )}

          <div className="flex items-center flex-wrap gap-2 mb-3">
            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
              <Calendar size={12}/>
              {new Date(event.date).toLocaleDateString('ja-JP')}
            </span>
            {(() => {
              const upper = event.title.toUpperCase();
              let category = null;
              if (upper.includes('一般')) category = { label: '一般', classes: 'bg-[#d9f99d] text-[#365314] border-[#a3e635]' };
              else if (upper.includes('O40') || upper.includes('40都')) category = { label: 'O40都', classes: 'bg-purple-200 text-purple-900 border-purple-300' };
              else if (upper.includes('シニア') || upper.includes('50')) category = { label: '50シニア', classes: 'bg-amber-900 text-amber-50 border-amber-950' };
              
              if (!category) return null;
              return (
                <span className={clsx("text-xs font-black px-2 py-0.5 rounded-md border shadow-sm", category.classes)}>
                  {category.label}
                </span>
              );
            })()}
            {event.is_joint_match && <span className="bg-purple-100 text-purple-700 text-xs font-bold px-2 py-0.5 rounded-md border border-purple-200">合同試合</span>}
          </div>
          
          <h1 className="text-xl font-bold text-slate-900 mb-2">{event.title}</h1>
          
          <CollapsibleNote note={event.note || ''} />
        </div>

        <div className={clsx("rounded-xl p-4 border flex items-center gap-3 shadow-sm", getEventOverallBg())}>
          {overallColor === 'blue' && <CheckCircle size={28} className="text-blue-500" />}
          {overallColor === 'yellow' && <RefreshCw size={28} className="text-yellow-500" />}
          {overallColor === 'red' && <AlertCircle size={28} className="text-red-500" />}
          <div>
            <h2 className="font-bold text-sm">必要備品の準備状況</h2>
            <p className="text-xs opacity-90 mt-0.5">
              {overallLabel}
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-2 mb-3">Required Items</h2>
          
          <div className="flex flex-col gap-3 mb-4">
            <AutoAddStandardEquipmentButton eventId={event.id} />
            <AddRefereeSetButton eventId={event.id} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {itemStatuses.map((ist, idx) => (
              <div key={ist.eri.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 relative overflow-hidden group hover:border-blue-200 transition-all">
                <div className={clsx(
                  "absolute top-0 left-0 w-1 h-full",
                  ist.statusColor === 'blue' && "bg-blue-500",
                  ist.statusColor === 'yellow' && "bg-yellow-400",
                  ist.statusColor === 'red' && "bg-red-500",
                )} />
                
                <div className="flex justify-between items-start mb-2">
                  {ist.isTemplate ? (
                    <div className="font-bold text-slate-800 flex items-center gap-1.5 flex-wrap">
                      <Package size={16} className="text-blue-400" />
                      <span>{ist.item.name}</span>
                      <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded uppercase">実物未設定</span>
                    </div>
                  ) : (
                    <Link href={`/items/${ist.item.id}`} className="font-bold text-slate-800 hover:underline flex items-center gap-1.5 flex-wrap">
                      <Package size={16} className="text-slate-400" />
                      <span>{ist.item.name}</span>
                      {ist.eri.is_personal_item && (
                        <span className="text-xs text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">私物</span>
                      )}
                    </Link>
                  )}
                  <div className="flex items-center gap-2">
                    <span className={clsx(
                      "text-[10px] font-bold px-2 py-0.5 rounded border",
                      ist.statusColor === 'blue' && "bg-blue-50 text-blue-700 border-blue-200",
                      ist.statusColor === 'yellow' && "bg-yellow-50 text-yellow-700 border-yellow-200",
                      ist.statusColor === 'red' && "bg-red-50 text-red-700 border-red-200",
                    )}>
                      {ist.statusLabel}
                    </span>
                    {ist.isTemplate && ist.isBall && (
                      <QuantityIncrementButton eventId={event.id} itemId={ist.item.id} />
                    )}
                    <RemoveRequiredItemButton id={ist.eri.id} eventId={event.id} />
                  </div>
                </div>

                <div className="text-sm text-slate-600 space-y-1.5 mt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-xs">担当者:</span>
                    <span className={clsx("font-medium", !ist.assignedMember && "text-red-500 italic")}>
                      {ist.assignedMember?.name || '未設定'}
                    </span>
                  </div>
                    {ist.isTemplate ? (
                      <div className="flex justify-between items-center pt-2 border-t border-blue-100/50 mt-2">
                        <span className="text-blue-500 text-[10px] font-bold">実物が未確定です</span>
                        <Link 
                          href={`/events/${rawId}/assign/${ist.eri.id}`}
                          className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors uppercase border border-blue-100"
                        >
                          割り当て
                        </Link>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center pt-2 border-t border-slate-100 mt-2">
                        <div className="text-xs">
                          <span className="text-slate-400">現在の保有:</span>
                          <span className="font-medium ml-1">{ist.holderMember?.name || (ist.eri.is_personal_item ? ist.assignedMember?.name : '不明・倉庫')}</span>
                        </div>
                        <Link 
                          href={`/events/${rawId}/assign/${ist.eri.id}`}
                          className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors uppercase border border-slate-100"
                        >
                          修正
                        </Link>
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>

          <ManualAddRequiredItem eventId={event.id} availableItems={availableItems} />
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in EventDetail:', error);
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-red-200 shadow-sm mt-10">
        <AlertCircle className="text-red-500 mx-auto mb-4" size={48} />
        <h1 className="text-xl font-bold text-slate-900 mb-2">エラーが発生しました</h1>
        <p className="text-sm text-slate-500">
          データの読み込み中にエラーが発生しました。
        </p>
      </div>
    );
  }
}
