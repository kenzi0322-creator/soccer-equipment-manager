'use client';

import { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

export default function CollapsibleNote({ note }: { note: string }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!note) return null;

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left group transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
            <Info size={18} />
          </div>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">詳細メモ</span>
            <span className="text-xs font-bold text-slate-600 group-hover:text-blue-600 transition-colors">
              {isOpen ? '詳細を閉じる' : '全文を表示する'}
            </span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-300 group-hover:text-blue-500 transition-colors">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>
      
      {isOpen && (
        <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
          <p className="text-slate-700 whitespace-pre-wrap leading-relaxed text-[13px] font-medium selection:bg-blue-100">
            {note}
          </p>
        </div>
      )}
    </div>
  );
}
