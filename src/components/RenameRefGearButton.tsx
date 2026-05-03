'use client';

import { useState } from 'react';
import { Pencil, Loader2, CheckCircle } from 'lucide-react';
import { renameRefGearItemsAction } from '@/app/actions/item';

export default function RenameRefGearButton() {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');
  const [count, setCount] = useState(0);

  const handle = async () => {
    setState('loading');
    const res = await renameRefGearItemsAction();
    setCount(res.renamed);
    setState('done');
    // 2秒後に戻す
    setTimeout(() => setState('idle'), 3000);
  };

  if (state === 'done') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl font-bold">
        <CheckCircle size={14} />
        {count}件リネーム完了
      </div>
    );
  }

  return (
    <button
      onClick={handle}
      disabled={state === 'loading'}
      className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl font-bold hover:bg-amber-100 transition-colors disabled:opacity-50"
    >
      {state === 'loading' ? (
        <Loader2 size={13} className="animate-spin" />
      ) : (
        <Pencil size={13} />
      )}
      「レフリーセット」→「レフリー道具セット」一括リネーム
    </button>
  );
}
