'use client';

import { useState } from 'react';
import { Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { MOCK_TEAMS } from '@/lib/data/mock';
import { Item } from '@/types';

interface EquipmentFormProps {
  initialData?: Item;
  action: (formData: FormData) => void;
  submitLabel: string;
}

export default function EquipmentForm({ initialData, action, submitLabel }: EquipmentFormProps) {
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setIsPending(true);
    // Let the form default submission behavior (action prop) take over
  };

  return (
    <form action={action} onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        
        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-1.5">備品名 <span className="text-red-500 text-xs font-normal">必須</span></label>
          <input 
            type="text" 
            name="name" 
            required 
            defaultValue={initialData?.name}
            placeholder="例: レフェリースターターセットC" 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-sm"
          />
        </div>

        {/* Code */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-1.5">個体識別コード <span className="text-red-500 text-xs font-normal">必須</span></label>
          <input 
            type="text" 
            name="item_code" 
            required 
            defaultValue={initialData?.item_code}
            placeholder="例: SS-C-01" 
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-sm"
          />
        </div>

        {/* Category & Team */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">カテゴリー</label>
            <input 
              type="text" 
              name="category" 
              defaultValue={initialData?.category}
              placeholder="例: セット" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">所属チーム <span className="text-red-500 text-xs font-normal">必須</span></label>
            <select 
              name="owner_team_id" 
              required
              defaultValue={initialData?.owner_team_id || MOCK_TEAMS[0].id}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
            >
              {MOCK_TEAMS.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Size & Color */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">サイズ</label>
            <input 
              type="text" 
              name="size" 
              defaultValue={initialData?.size}
              placeholder="例: M" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5">色</label>
            <input 
              type="text" 
              name="color" 
              defaultValue={initialData?.color}
              placeholder="例: オレンジ" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400 text-sm"
            />
          </div>
        </div>

        {/* Shared Flag */}
        <div className="mb-2 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
          <input 
            type="checkbox" 
            id="shared_flag" 
            name="shared_flag" 
            defaultChecked={initialData?.shared_flag}
            className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500" 
          />
          <label htmlFor="shared_flag" className="text-sm font-bold text-slate-700">共用備品にする</label>
        </div>
        <p className="text-xs text-slate-500 ml-1 mb-4">チェックを入れると合同チーム等で他カテゴリでも利用可能なフラグが立ちます。</p>

      </div>

      {/* Button */}
      <button 
        type="submit" 
        disabled={isPending}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl transition-colors shadow-sm disabled:opacity-70 flex justify-center items-center mt-6"
      >
        {isPending ? <Loader2 size={20} className="animate-spin" /> : submitLabel}
      </button>

    </form>
  );
}
