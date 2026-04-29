'use client';

import { useState, useTransition } from 'react';
import { Edit3, Trash2, AlertTriangle, X } from 'lucide-react';
import Link from 'next/link';
import { deleteEventAction } from '@/app/actions/event';

export default function EventActions({ eventId }: { eventId: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await deleteEventAction(eventId);
      if (res?.error) {
        alert(res.error);
        setShowConfirm(false);
      }
      // 成功時は deleteEventAction 内の redirect() が実行される
    });
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-1 -mr-2 animate-in fade-in duration-150">
        <span className="text-xs text-red-600 font-bold flex items-center gap-1">
          <AlertTriangle size={12} />
          削除する？
        </span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-[11px] font-black text-white bg-red-500 hover:bg-red-600 px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50"
        >
          {isPending ? '削除中…' : 'はい'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isPending}
          className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 -mr-2">
      <Link href={`/events/${encodeURIComponent(eventId)}/edit`} className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50 transition-colors">
        <Edit3 size={20} />
      </Link>
      <button
        onClick={() => setShowConfirm(true)}
        className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 transition-colors"
      >
        <Trash2 size={20} />
      </button>
    </div>
  );
}
