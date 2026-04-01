'use client';

import { useState } from 'react';
import { Plus, User, Loader2 } from 'lucide-react';
import { addRequiredItemAction } from '@/app/actions/event';

export default function SuggestedItemsList({ 
  eventId, 
  suggestedItems,
  members
}: { 
  eventId: string, 
  suggestedItems: any[],
  members: any[]
}) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleAdd = async (itemId: string, assignToId?: string) => {
    setLoadingId(itemId);
    const formData = new FormData();
    formData.append('event_id', eventId);
    formData.append('item_id', itemId);
    if (assignToId) formData.append('force_assign_to', assignToId);

    try {
      const res = await addRequiredItemAction(formData);
      if (res?.error) {
        alert(res.error);
      }
    } catch (e: any) {
      alert(e.message || '予期せぬエラーが発生しました');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {suggestedItems.map(si => {
        let assignToId = undefined; // We'll let the user decide or use whatever logic was there
        // Re-implementing simplified logic for demo:
        // (The parent server component can pass the pre-calculated assignToId)
        const holder = members.find(m => m.id === si.current_holder_id);

        return (
          <button 
            key={si.id}
            onClick={() => handleAdd(si.id, si.suggestedAssigneeId)}
            disabled={loadingId === si.id}
            className="bg-white border border-orange-300 hover:border-orange-500 hover:bg-orange-100 text-orange-800 rounded-lg px-3 py-1.5 text-xs font-medium transition shadow-sm flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50"
          >
            {loadingId === si.id ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} className="shrink-0" />}
            <span>{si.name}</span>
            {holder && (
              <span className="text-[10px] bg-orange-100 px-1 rounded text-orange-600 font-normal">
                 持:{holder.name.split(' ').pop()}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
