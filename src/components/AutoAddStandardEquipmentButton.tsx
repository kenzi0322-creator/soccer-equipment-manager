'use client';

import { useTransition } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { autoAddStandardEquipmentAction } from '@/app/actions/event';
import { useRouter } from 'next/navigation';

export default function AutoAddStandardEquipmentButton({ eventId }: { eventId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAdd = () => {
    startTransition(async () => {
      const result = await autoAddStandardEquipmentAction(eventId);
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
      className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 border border-blue-200 py-4 rounded-2xl font-bold hover:bg-blue-100 transition-colors active:scale-[0.98] shadow-sm group"
    >
      {isPending ? (
        <Loader2 className="animate-spin" size={20} />
      ) : (
        <>
          <Sparkles className="text-blue-400 group-hover:scale-110 transition-transform" size={20} />
          <span>標準備品を自動登録</span>
        </>
      )}
    </button>
  );
}
