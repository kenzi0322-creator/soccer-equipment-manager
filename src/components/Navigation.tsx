'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PackageSearch, CalendarDays, MapPin, Users } from 'lucide-react';
import { clsx } from 'clsx';

export default function Navigation() {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  const navItems = [
    { name: '備品', href: '/', icon: PackageSearch },
    { name: '試合予定', href: '/events', icon: CalendarDays },
    { name: 'メンバー', href: '/members', icon: Users },
    { name: '会場', href: '/venues', icon: MapPin },
  ];

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 pb-safe z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200",
                isActive ? "text-blue-600" : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
