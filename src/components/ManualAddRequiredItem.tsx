'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { addRequiredItemAction } from '@/app/actions/event';

export default function ManualAddRequiredItem({ 
  eventId, 
  availableItems 
}: { 
  eventId: string, 
  availableItems: any[] 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setError(null);
    try {
      const res = await addRequiredItemAction(formData);
      if (res?.error) {
        setError(res.error);
      }
    } catch (e: any) {
      setError(e.message || '予期せぬエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
      <h3 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Plus size={16}/> 備品を追加登録</h3>
      
      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-medium">
          {error}
        </div>
      )}

      <form action={handleSubmit} className="flex flex-col gap-2">
        <input type="hidden" name="event_id" value={eventId} />
        <div className="flex gap-2">
          <select 
            name="item_id" 
            className="flex-1 border border-slate-200 bg-white rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500" 
            required
            disabled={loading}
          >
             <option value="">備品を選択...</option>
             {(() => {
               // レフリーセットボタンで管理するアイテムはドロップダウンから除外
               const REF_EXCLUDE = [
                 'レフリー袋', 'レフリー半袖', 'レフリー長袖', 'レフリーパンツ', 'レフリーソックス',
                 'ワッペンガード', 'リスペクトワッペン', 'ホイッスル', '審判カード', 'レフリー機材', 'トスコイン',
                 'レフリーフラッグ',
               ];
               const dropdownItems = availableItems.filter(i =>
                 !REF_EXCLUDE.some(n => i.name.includes(n))
               );

               const groups: Record<string, any[]> = { '一般': [], 'O40都': [], 'シニア': [], '共通': [] };
               dropdownItems.forEach(i => {
                 let group = '共通';
                 if ((i.code || '').startsWith('B')) group = '一般';
                 else if ((i.code || '').startsWith('T')) group = 'O40都';
                 else if ((i.code || '').startsWith('S')) group = 'シニア';
                 groups[group].push(i);
               });

               return ['一般', 'O40都', 'シニア', '共通'].map(groupName => (
                 groups[groupName].length > 0 && (
                   <optgroup key={groupName} label={groupName}>
                     {groups[groupName].map(i => (
                       <option key={i.id} value={i.id}>
                         {groupName} {i.name}
                       </option>
                     ))}
                   </optgroup>
                 )
               ));
             })()}
          </select>
          <button 
            type="submit" 
            disabled={loading || availableItems.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-1.5 text-sm font-bold shadow-sm transition whitespace-nowrap disabled:opacity-50"
          >
            {loading ? '中...' : '追加'}
          </button>
        </div>
        <label className="flex items-center gap-1.5 text-sm text-slate-600 mt-1 cursor-pointer w-max pl-1">
          <input 
            type="checkbox" 
            name="is_personal_item" 
            value="true" 
            disabled={loading}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
          />
          個人で持参する (共有在庫として管理しません)
        </label>
      </form>
    </div>
  );
}
