'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/app/actions/auth';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setIsPending(true);
    setError(null);
    const result = await login(formData);
    
    if (result.error) {
      setError(result.error);
      setIsPending(false);
    } else {
      router.push('/');
      router.refresh(); // Ensure middleware state is refreshed
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 -mt-16">
      
      <div className="max-w-sm w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-50 p-4 rounded-full text-blue-600">
            <ShieldCheck size={40} />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-center text-slate-800 mb-2">
          サッカー備品管理アプリ
        </h1>
        <p className="text-sm text-center text-slate-500 mb-8">
          このアプリは用具管理係のみ利用できます
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-6 text-center font-medium border border-red-100">
            {error}
          </div>
        )}

        <form action={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">共通パスワード</label>
            <input
              type="password"
              name="password"
              required
              placeholder="パスワードを入力"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm disabled:opacity-70 flex justify-center items-center"
          >
            {isPending ? <Loader2 size={20} className="animate-spin" /> : 'ログイン'}
          </button>
        </form>
      </div>
      
    </div>
  );
}
