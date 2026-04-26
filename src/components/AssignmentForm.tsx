'use client';

import { useTransition } from 'react';
import { Package, Users, Save, Loader2 } from 'lucide-react';
import { updateEriAssignmentAction } from '@/app/actions/event';
import { useRouter } from 'next/navigation';
import { Member, Item } from '@/types';
import { formatItemCode } from '@/lib/utils/format';

type AssignmentFormProps = {
  eventId: string;
  eriId: string;
  requirementName: string;
  members: Member[];
  filteredItems: Item[];
  initialMemberId?: string;
  initialItemId?: string;
  isRefereeItem?: boolean;
};

export default function AssignmentForm({ 
  eventId, 
  eriId, 
  requirementName, 
  members, 
  filteredItems,
  initialMemberId,
  initialItemId,
  isRefereeItem
}: AssignmentFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateEriAssignmentAction(formData);
      if (result.success) {
        router.push(`/events/${encodeURIComponent(eventId)}/assign/${eriId}/success`);
        router.refresh();
      } else {
        alert(result.error || '更新に失敗しました');
        console.error('Assignment Form Error:', result.error);
      }
    });
  };

  return (
    <form action={handleSubmit} className="p-6 space-y-8">
      <input type="hidden" name="eri_id" value={eriId} />
      <input type="hidden" name="event_id" value={eventId} />

      {/* Current Requirement Status */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-start gap-4">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
          <Package size={20} />
        </div>
        <div>
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">現在の指定内容</span>
          <h2 className="font-bold text-slate-800 text-lg">{requirementName}</h2>
          <p className="text-xs text-blue-600/70 font-medium italic mt-0.5">※以下の項目を実物に変更します</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Member Selection */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
            <Users size={16} className="text-slate-400" />
            担当者（持参者）
          </label>
          <select 
            name="member_id" 
            defaultValue={initialMemberId || ""}
            required
            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer disabled:opacity-50"
            disabled={isPending}
          >
            <option value="" disabled>担当者を選択してください</option>
            {members.map(m => (
              <option key={m.id} value={m.id}>
                {m.uniform_number ? `${m.uniform_number} ${m.name}` : m.name}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-slate-400 ml-1">※メンバーは背番号順に並んでいます</p>
        </div>

        {/* Item Selection */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700 ml-1">
            <Package size={16} className="text-slate-400" />
            実物備品の選択
          </label>
            <select 
              name="item_id" 
              defaultValue={initialItemId || ""}
              required
              className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-800 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer disabled:opacity-50"
              disabled={isPending}
            >
              <option value="" disabled>備品を選択してください</option>
              <option value="__personal__">── 個人所有のものを持参（共有在庫として管理しない）</option>
              {(() => {
                const categoryOrder = [
                  { key: 'shared',   label: '📦 合同共用備品（shared）' },
                  { key: 'referee',  label: '🟡 レフリー用品（referee）' },
                  { key: 'personal', label: '👤 個人管理備品（personal）' },
                ];
                const grouped: Record<string, typeof filteredItems> = {};
                const others: typeof filteredItems = [];
                for (const item of filteredItems) {
                  const cat = (item.category || '').toLowerCase();
                  if (cat === 'shared') { grouped['shared'] = [...(grouped['shared'] || []), item]; }
                  else if (cat === 'referee' || item.name?.includes('レフリー') || item.name?.includes('ワッペン')) { grouped['referee'] = [...(grouped['referee'] || []), item]; }
                  else if (cat === 'personal') { grouped['personal'] = [...(grouped['personal'] || []), item]; }
                  else { others.push(item); }
                }
                return (
                  <>
                    {categoryOrder.map(({ key, label }) =>
                      grouped[key]?.length ? (
                        <optgroup key={key} label={label}>
                          {grouped[key].map(i => (
                            <option key={i.id} value={i.id}>
                              {formatItemCode(i.code || '')} {i.name}
                            </option>
                          ))}
                        </optgroup>
                      ) : null
                    )}
                    {others.length > 0 && (
                      <optgroup label="📋 その他">
                        {others.map(i => (
                          <option key={i.id} value={i.id}>
                            {formatItemCode(i.code || '')} {i.name}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </>
                );
              })()}
            </select>
        </div>


        {/* Bulk Referee Assignment Checkbox */}
        {isRefereeItem && (
          <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl mt-4 cursor-pointer hover:bg-slate-100 transition-colors">
            <input 
              type="checkbox" 
              name="bulk_referee" 
              id="bulk_referee"
              value="true"
              defaultChecked={true}
              className="mt-0.5 shrink-0 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="bulk_referee" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
              他のレフリー用品もまとめて同じ人に割り当てる（自動で同サイズ品を選択）
            </label>
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl shadow-lg shadow-slate-200 hover:bg-slate-800 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group mt-10 disabled:opacity-70"
      >
        {isPending ? (
          <Loader2 className="animate-spin" size={20} />
        ) : (
          <>
            <Save size={20} className="group-hover:scale-110 transition-transform" />
            <span>割り当てを確定する</span>
          </>
        )}
      </button>
    </form>
  );
}
