'use client';

import { useState } from 'react';
import { syncBandSchedule } from '@/app/actions/band';
import { RefreshCw } from 'lucide-react';

export default function BandSyncForm() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  async function handleAction(formData: FormData) {
    setLoading(true);
    setMessage(null);
    try {
      const result = await syncBandSchedule(formData);
      if (result?.error) {
        setMessage({ text: result.error, isError: true });
      } else if (result?.success) {
        setMessage({ text: result.message || '同期完了', isError: false });
      }
    } catch (e: any) {
      setMessage({ text: e.message, isError: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-green-50 rounded-2xl p-4 border border-green-200 shadow-sm">
      <h2 className="text-sm font-bold text-green-800 flex items-center gap-1.5 mb-2">
        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> BANDから予定を同期する
      </h2>
      <form action={handleAction} className="flex gap-2">
        <input 
          type="text" 
          name="band_url"
          placeholder="webcal://api.band.us/ical?token=..." 
          className="flex-1 text-xs border border-green-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-green-500 bg-white shadow-inner placeholder:text-slate-300"
          required
          defaultValue="webcal://api.band.us/ical?token=aAAxADNiODgwZjdmZGU0ODU2MGE3MDhhNjZhNGNlMzQxNTA5M2Y2MjJhODI"
          disabled={loading}
        />
        <button 
          type="submit" 
          disabled={loading}
          className="bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-green-700 transition shadow-sm whitespace-nowrap disabled:opacity-50"
        >
          {loading ? '同期中...' : '取り込む'}
        </button>
      </form>
      <p className="text-[10px] text-green-700 mt-2 opacity-80">
        ※BANDアプリ内の「設定 &gt; スケジュールを出力」で取得できるURLを貼り付けてください。
      </p>
      {message && (
        <p className={`text-xs mt-2 font-bold ${message.isError ? 'text-red-600' : 'text-green-700'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
