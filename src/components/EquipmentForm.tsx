'use client';

import { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Item, Team } from '@/types';

interface EquipmentFormProps {
  initialData?: Item;
  action: (formData: FormData) => void;
  submitLabel: string;
  teams: Team[];
}

export default function EquipmentForm({ initialData, action, submitLabel, teams }: EquipmentFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.photo_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    setIsPending(true);
    // Let the form default submission behavior (action prop) take over
  };

  return (
    <form action={action} onSubmit={handleSubmit} className="space-y-4" encType="multipart/form-data">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
        
        {/* Photo */}
        <div className="mb-4">
          <label className="block text-sm font-bold text-slate-700 mb-1.5">写真</label>
          <div 
            className="w-full aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors overflow-hidden relative"
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <Camera size={32} className="mb-2" />
                <span className="text-sm font-medium">タップして写真を追加</span>
              </div>
            )}
          </div>
          <input 
            type="file" 
            name="image" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageChange}
          />
        </div>

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
            defaultValue={initialData?.code}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400"
            placeholder="例: T-01"
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
              defaultValue={initialData?.owner_team_id || (teams[0]?.id || '')}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
            >
              {teams.map(team => (
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
