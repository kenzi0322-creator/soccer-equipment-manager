'use client';

import { useTransition } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import { addRefereeSetAction } from '@/app/actions/event';
import { useRouter } from 'next/navigation';

export default function AddRefereeSetButton({ eventId }: { eventId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAdd = () => {
    startTransition(async () => {
      const result = await addRefereeSetAction(eventId);
      if (result.success) {
        router.refresh();
      } else if (result.error) {
        alert(result.error);
      } else {
        alert(result.message);
      }
    });
  };

  return (
    <button
      onClick={handleAdd}
      disabled={isPending}
      className="flex items-center justify-center gap-2 bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl font-bold hover:bg-slate-100 transition-colors active:scale-[0.98] shadow-sm text-xs"
    >
      {isPending ? (
        <Loader2 className="animate-spin" size={14} />
      ) : (
        <>
          <UserPlus size={14} className="text-slate-400" />
          <span>レフリーセットを追加</span>
        </>
      )}
    </button>
  );
}
