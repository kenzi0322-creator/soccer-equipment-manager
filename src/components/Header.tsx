'use client';

import { usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { logout } from '@/app/actions/auth';

export default function Header() {
  const pathname = usePathname();
  
  // Hide on login page
  if (pathname === '/login') return null;

  return (
    <header className="bg-white px-4 py-3 sticky top-0 z-40 border-b border-slate-100/50 backdrop-blur-md flex justify-between items-center">
      <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600">
        TUN用具管理
      </h1>
      <form action={logout}>
        <button type="submit" className="text-slate-400 hover:text-red-500 transition-colors p-1" title="ログアウト">
          <LogOut size={20} />
        </button>
      </form>
    </header>
  );
}
