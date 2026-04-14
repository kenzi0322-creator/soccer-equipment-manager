import { getEventsSupabase, getEventRequiredItemsSupabase, getItemsSupabase } from '@/lib/data/supabaseDb';
import { CheckCircle, ArrowLeft, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function AssignmentSuccessPage({ params }: { params: Promise<{ id: string, eriId: string }> }) {
  const { id: rawId, eriId } = await params;
  const eventId = decodeURIComponent(rawId);

  const [events, allItems, eris] = await Promise.all([
    getEventsSupabase(),
    getItemsSupabase(),
    getEventRequiredItemsSupabase()
  ]);

  const event = events.find(e => e.id === eventId);
  const eri = eris.find(e => e.id === eriId);
  
  if (!event || !eri) {
    notFound();
  }

  const currentItem = eri.item_id ? allItems.find(i => i.id === eri.item_id) : undefined;
  const displayLabel = currentItem?.name || eri.display_name || '備品';

  return (
    <div className="max-w-xl mx-auto min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white rounded-3xl p-10 shadow-xl border border-slate-100 w-full space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner">
            <CheckCircle size={40} />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">割り当て登録しました</h1>
          <p className="text-slate-500 text-sm font-medium">
            {event.title}<br/>
            <span className="text-slate-900 font-bold">{displayLabel}</span> の割り当てを完了しました
          </p>
        </div>

        <div className="grid gap-4 mt-8">
          <Link 
            href={`/events/${rawId}`}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 active:scale-[0.98]"
          >
            <ArrowLeft size={20} />
            前の画面に戻る
          </Link>
          
          <Link 
            href="/"
            className="flex items-center justify-center gap-2 bg-white text-slate-600 font-bold py-4 rounded-2xl border border-slate-200 hover:bg-slate-50 transition-all active:scale-[0.98]"
          >
            <LayoutDashboard size={20} />
            TOP画面（用具画面）にもどる
          </Link>
        </div>
      </div>
    </div>
  );
}
