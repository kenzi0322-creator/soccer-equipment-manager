'use client';

import { useState } from 'react';
import { Event, Team, Member } from '@/types';

export default function EventForm({ 
  initialData, 
  action,
  teams,
  members
}: { 
  initialData?: Event, 
  action: (formData: FormData) => Promise<{error?: string} | void>,
  teams: Team[],
  members: Member[]
}) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await action(formData);
      if (res?.error) setErrorMsg(res.error);
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-5 bg-white p-5 border border-slate-200 rounded-3xl shadow-sm">
      {errorMsg && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">
          {errorMsg}
        </div>
      )}

      {initialData && <input type="hidden" name="id" value={initialData.id} />}

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">試合タイトル *</label>
        <input 
          type="text" 
          name="title" 
          defaultValue={initialData?.title}
          required 
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">日付 *</label>
          <input 
            type="date" 
            name="date" 
            defaultValue={initialData?.date}
            required 
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-sm font-bold text-slate-700 mb-1">開始時間</label>
            <input 
              type="time" 
              name="start_at" 
              defaultValue={initialData?.start_at}
              className="w-full border border-slate-200 rounded-xl px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-bold text-slate-700 mb-1">終了時間</label>
            <input 
              type="time" 
              name="end_at" 
              defaultValue={initialData?.end_at}
              className="w-full border border-slate-200 rounded-xl px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">対象チーム *</label>
          <select 
            name="primary_team_id" 
            defaultValue={initialData?.primary_team_id || (teams[0]?.id || '')}
            required
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1">会場</label>
          <input 
            type="text" 
            name="venue_id"
            defaultValue={initialData?.venue_id || ''}
            placeholder="例：駒沢公園第一球場"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
        <input 
          type="checkbox" 
          name="is_joint_match" 
          defaultChecked={initialData?.is_joint_match}
          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" 
        />
        <span>合同チームでの試合</span>
      </label>

      {/* 審判情報セクション */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
        <h3 className="text-sm font-bold text-slate-700">審判担当情報</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">担当時間</label>
            <input 
              type="time" 
              name="referee_time" 
              defaultValue={initialData?.referee_time}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">主審</label>
            <select 
              name="main_referee_id" 
              defaultValue={initialData?.main_referee_id || ''}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">未設定</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.uniform_number ? `${m.uniform_number} ` : ''}{m.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">副審①</label>
            <select 
              name="sub_referee_id" 
              defaultValue={initialData?.sub_referee_id || ''}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">未設定</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.uniform_number ? `${m.uniform_number} ` : ''}{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">副審②</label>
            <select 
              name="sub_referee_id_2" 
              defaultValue={initialData?.sub_referee_id_2 || ''}
              className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">未設定</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.uniform_number ? `${m.uniform_number} ` : ''}{m.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1">詳細メモ</label>
        <textarea 
          name="note" 
          defaultValue={initialData?.note}
          rows={4}
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-sm disabled:opacity-50"
      >
        {loading ? '保存中...' : '保存する'}
      </button>
    </form>
  );
}
