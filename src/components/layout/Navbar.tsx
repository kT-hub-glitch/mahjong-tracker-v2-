'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, History, Users, User, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/', label: 'ホーム', icon: LayoutDashboard },
  { href: '/input', label: '入力', icon: PlusCircle },
  { href: '/history', label: '履歴', icon: History },
  { href: '/players', label: '選手', icon: Users },
];

/**
 * 下部ナビゲーションコンポーネント
 * スマホでの操作性を考慮したタブバー形式のナビゲーションです。
 */
export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass border-t border-white/10 z-50">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center space-y-1 transition-colors ${
                  isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
          
          <button
            onClick={handleSignOut}
            className="flex flex-col items-center justify-center space-y-1 text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="text-[10px]">ログアウト</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
