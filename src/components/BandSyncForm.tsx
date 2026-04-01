'use client';

import { useState } from 'react';
import { getBandSyncPreview, commitBandSync, BandSyncPreviewItem } from '@/app/actions/band';
import { RefreshCw, AlertTriangle, Check, X, Calendar, MapPin, Clock } from 'lucide-react';
import { clsx } from 'clsx';

export default function BandSyncForm() {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<BandSyncPreviewItem[] | null>(null);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [selections, setSelections] = useState<Record<string, 'apply' | 'skip' | 'ignore'>>({});

  async function handlePreview(formData: FormData) {
    setLoading(true);
    setMessage(null);
    try {
      const result = await getBandSyncPreview(formData);
      if (result.error) {
        setMessage({ text: result.error, isError: true });
      } else if (result.preview) {
        setPreview(result.preview);
        const initialSels: Record<string, 'apply' | 'skip' | 'ignore'> = {};
        result.preview.forEach(item => {
          if (item.type === 'new') initialSels[item.eventData.id] = 'apply';
          else if (item.type === 'changed') initialSels[item.eventData.id] = item.isStarted ? 'skip' : 'apply';
          else if (item.type === 'deleted_in_source') initialSels[item.eventData.id] = 'skip';
        });
        setSelections(initialSels);
      }
    } catch (e: any) {
      setMessage({ text: e.message, isError: true });
    } finally {
      setLoading(false);
    }
  }

  async function handleCommit() {
    if (!preview) return;
    setLoading(true);
    try {
      const selList = preview.map(item => ({
        uid: item.eventData.id,
        type: item.type,
        action: selections[item.eventData.id] || 'skip'
      })).filter(s => s.action !== 'ignore');

      const bandEvents = preview.map(p => p.eventData);

      const result = await commitBandSync(selList as any, bandEvents);
      if (result.success) {
        setMessage({ text: result.message || '同期完了', isError: false });
        setPreview(null);
      } else {
        setMessage({ text: result.error || 'エラーが発生しました', isError: true });
      }
    } catch (e: any) {
      setMessage({ text: e.message, isError: true });
    } finally {
      setLoading(false);
    }
  }

  if (preview) {
    const news = preview.filter(p => p.type === 'new');
    const changes = preview.filter(p => p.type === 'changed');
    const deletes = preview.filter(p => p.type === 'deleted_in_source');

    return (
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-sm font-black text-slate-800 flex items-center gap-2">
          <RefreshCw size={18} className="text-green-600" /> 同期内容の確認
        </h2>

        <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
          {/* New Events */}
          {news.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">新規追加 ({news.length})</h3>
              {news.map(p => (
                <div key={p.eventData.id} className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                  <input 
                    type="checkbox" 
                    checked={selections[p.eventData.id] === 'apply'} 
                    onChange={e => setSelections(s => ({...s, [p.eventData.id]: e.target.checked ? 'apply' : 'skip'}))}
                    className="mt-1 w-4 h-4 rounded text-green-600 focus:ring-green-500"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-900">{p.eventData.title}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-[10px] text-slate-500 flex items-center gap-1"><Calendar size={10}/> {p.eventData.date}</span>
                      <span className="text-[10px] text-slate-500 flex items-center gap-1"><Clock size={10}/> {p.eventData.start_at || '--:--'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Changed Events */}
          {changes.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">変更あり ({changes.length})</h3>
              {changes.map(p => (
                <div key={p.eventData.id} className={clsx("p-3 rounded-xl border space-y-2", p.isStarted ? "bg-amber-50 border-amber-100" : "bg-blue-50 border-blue-100")}>
                  <div className="flex items-start gap-3">
                    <input 
                        type="checkbox" 
                        checked={selections[p.eventData.id] === 'apply'} 
                        onChange={e => setSelections(s => ({...s, [p.eventData.id]: e.target.checked ? 'apply' : 'skip'}))}
                        className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-slate-900">{p.eventData.title}</p>
                        {p.isStarted && (
                            <p className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-200/50 px-2 py-0.5 rounded-full mt-1">
                                <AlertTriangle size={10} /> 用具管理着手済み
                            </p>
                        )}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 p-2 bg-white/50 rounded-lg border border-slate-200/50">
                            <div className="text-[9px]">
                                <span className="text-slate-400 block uppercase">現在の予定</span>
                                <span className="text-slate-600 truncate block">{p.existingEvent?.date} {p.existingEvent?.start_at}</span>
                            </div>
                            <div className="text-[9px]">
                                <span className="text-slate-400 block uppercase">BANDの予定</span>
                                <span className="text-blue-600 font-bold truncate block">{p.eventData.date} {p.eventData.start_at}</span>
                            </div>
                        </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Deleted Events */}
          {deletes.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">BANDから削除済み ({deletes.length})</h3>
              {deletes.map(p => (
                <div key={p.eventData.id} className="flex items-start gap-3 p-3 bg-rose-50 rounded-xl border border-rose-100">
                  <input 
                    type="checkbox" 
                    checked={selections[p.eventData.id] === 'apply'} 
                    onChange={e => setSelections(s => ({...s, [p.eventData.id]: e.target.checked ? 'apply' : 'skip'}))}
                    className="mt-1 w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-slate-400 line-through decoration-slate-300">{p.eventData.title}</p>
                    <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                        <AlertTriangle size={10} /> アプリ上の予定を「中止・削除」扱いにします
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 flex gap-2">
          <button 
            onClick={() => setPreview(null)}
            className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            戻る
          </button>
          <button 
            onClick={handleCommit}
            disabled={loading}
            className="flex-[2] bg-slate-900 text-white text-xs font-black px-4 py-2.5 rounded-xl hover:bg-slate-800 transition shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
            選択した内容を反映する
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-green-50 rounded-2xl p-4 border border-green-200 shadow-sm transition-all hover:shadow-md">
      <h2 className="text-sm font-black text-green-800 flex items-center gap-1.5 mb-2">
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> BANDから予定を同期する
      </h2>
      <form action={handlePreview} className="flex gap-2">
        <input 
          type="text" 
          name="band_url"
          placeholder="webcal://api.band.us/ical?token=..." 
          className="flex-1 text-xs border border-green-200 rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-green-500 bg-white shadow-inner placeholder:text-slate-300"
          required
          defaultValue="webcal://api.band.us/ical?token=aAAxADNiODgwZjdmZGU0ODU2MGE3MDhhNjZhNGNlMzQxNTA5M2Y2MjJhODI"
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-green-600 text-white text-xs font-black px-5 py-2.5 rounded-xl hover:bg-green-700 transition shadow-lg whitespace-nowrap disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? <RefreshCw size={14} className="animate-spin" /> : '確認する'}
        </button>
      </form>
      <div className="flex items-start gap-1.5 mt-3">
        <AlertTriangle size={12} className="text-green-700 shrink-0 mt-0.5" />
        <p className="text-[10px] text-green-700 leading-relaxed opacity-90">
            用具管理を開始している試合は、自動で上書きされません。<br/>
            BAND側から消えた試合も、アプリ側では「中止候補」として残ります。
        </p>
      </div>
      {message && (
        <div className={clsx(
          "mt-4 p-3 rounded-xl border flex items-center gap-2 animate-in slide-in-from-top-2",
          message.isError ? "bg-rose-50 border-rose-100 text-rose-700" : "bg-green-100 border-green-200 text-green-800"
        )}>
          {message.isError ? <X size={16} /> : <Check size={16} />}
          <p className="text-xs font-bold">{message.text}</p>
        </div>
      )}
    </div>
  );
}
