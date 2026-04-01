'use client';

import { Edit3, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { deleteEventAction } from '@/app/actions/event';

export default function EventActions({ eventId }: { eventId: string }) {
  const handleDelete = async () => {
    if (confirm('この予定を削除しますか？\n※BANDから再度取り込むと復元されます。')) {
      const res = await deleteEventAction(eventId);
      if (res?.error) {
        alert(res.error);
      }
    }
  };

  return (
    <div className="flex items-center gap-1 -mr-2">
      <Link href={`/events/${encodeURIComponent(eventId)}/edit`} className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50 transition-colors">
        <Edit3 size={20} />
      </Link>
      <button onClick={handleDelete} className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 transition-colors">
        <Trash2 size={20} />
      </button>
    </div>
  );
}
