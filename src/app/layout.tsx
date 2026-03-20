import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';
import Header from '@/components/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TUN用具管理',
  description: 'サッカーチーム向け備品管理アプリ',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${inter.className} bg-slate-50 text-slate-900 pb-20 antialiased`}>
        <div className="max-w-md mx-auto min-h-screen relative shadow-sm bg-white">
          <Header />
          <main className="p-4">
            {children}
          </main>
        </div>
        <Navigation />
      </body>
    </html>
  );
}
