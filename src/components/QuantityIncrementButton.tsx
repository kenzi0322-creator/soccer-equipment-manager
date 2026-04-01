'use client';

import { useTransition } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { incrementItemQuantityAction } from '@/app/actions/quantity';
import { useRouter } from 'next/navigation';

export default function QuantityIncrementButton({ eventId, itemId }: { eventId: string, itemId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      const result = await incrementItemQuantityAction(eventId, itemId);
      if (result.success) {
        router.refresh();
      } else if (result.error) {
        alert(result.error);
      }
    });
  };

  return (
    <button
      onClick={handleIncrement}
      disabled={isPending}
      title="個数を増やす"
      className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-blue-100 hover:text-blue-600 transition-colors flex items-center gap-1 text-xs font-bold"
    >
      {isPending ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
      <span>追加</span>
    </button>
  );
}
