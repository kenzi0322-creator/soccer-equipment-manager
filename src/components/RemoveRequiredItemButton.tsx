'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { removeRequiredItemAction } from '@/app/actions/event';

export default function RemoveRequiredItemButton({ 
  id, 
  eventId 
}: { 
  id: string, 
  eventId: string 
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!confirm('この備品をリストから削除しますか？')) return;
    
    setLoading(true);
    try {
      const res = await removeRequiredItemAction(new FormData()); // We might need to adjust this since the action expects FormData
      // Actually, my updated action expects FormData but we can just pass it manually
      const formData = new FormData();
      formData.append('id', id);
      formData.append('event_id', eventId);
      
      const result = await removeRequiredItemAction(formData);
      if (result?.error) {
        alert(result.error);
      }
    } catch (e: any) {
      alert(e.message || '予期せぬエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleClick} 
      disabled={loading}
      className="text-slate-400 hover:text-red-500 transition-colors p-1 disabled:opacity-50" 
      title="削除"
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
    </button>
  );
}
