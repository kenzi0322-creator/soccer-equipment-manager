import { notFound } from 'next/navigation';
import { getMembers } from '@/lib/data/db';
import { updateMemberAction } from '@/app/actions/member';
import { ArrowLeft, User, MapPin, Car, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default async function EditMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const members = await getMembers();
  const member = members.find(m => m.id === id);
  
  if (!member) return notFound();

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center gap-2 mb-4">
        <Link href="/members" className="p-2 -ml-2 text-slate-500 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-colors">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold text-slate-800">メンバー情報の編集</h1>
      </div>

      <form action={updateMemberAction} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-5">
        <input type="hidden" name="id" value={member.id} />
        
        <div>
          <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mb-2">
            <User size={16} /> 名前 *
          </label>
          <input 
            type="text" 
            name="name" 
            defaultValue={member.name}
            required 
            className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mb-2">
            背番号
          </label>
          <input 
            type="text" 
            name="uniform_number" 
            defaultValue={member.uniform_number}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="例: 10, GK, - など"
          />
        </div>

        <div>
           <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mb-2">
            <MapPin size={16} /> 最寄駅
          </label>
          <input 
            type="text" 
            name="nearest_station" 
            defaultValue={member.nearest_station}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none" 
            placeholder="例: 新宿駅"
          />
        </div>

        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
           <label className="flex items-center gap-3 cursor-pointer">
             <input 
               type="checkbox" 
               name="has_car" 
               defaultChecked={member.has_car}
               className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
             />
             <div className="flex font-bold text-slate-700 items-center justify-center gap-1.5">
               <Car size={18} className="text-blue-600" />
               車出し可能 (車を保有しているか)
             </div>
           </label>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
           <label className="flex items-center gap-3 cursor-pointer">
             <input 
               type="checkbox" 
               name="has_black_pants" 
               defaultChecked={member.has_black_pants}
               className="w-5 h-5 text-slate-800 rounded border-slate-300 focus:ring-slate-800" 
             />
             <div className="flex font-bold text-slate-700 items-center justify-center gap-1.5">
               黒パンツ保持 (審判用)
             </div>
           </label>
           <label className="flex items-center gap-3 cursor-pointer">
             <input 
               type="checkbox" 
               name="has_black_socks" 
               defaultChecked={member.has_black_socks}
               className="w-5 h-5 text-slate-800 rounded border-slate-300 focus:ring-slate-800" 
             />
             <div className="flex font-bold text-slate-700 items-center justify-center gap-1.5">
               黒ソックス保持 (審判用)
             </div>
           </label>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700 mb-2">
            <BookOpen size={16} /> 備考・メモ
          </label>
          <textarea 
            name="note" 
            defaultValue={member.note}
            rows={3}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none resize-none" 
            placeholder="その他特記事項など"
          />
        </div>

        <button 
          type="submit" 
          className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition shadow-sm mt-4"
        >
          保存する
        </button>
      </form>
    </div>
  );
}
