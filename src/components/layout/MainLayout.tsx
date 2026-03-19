import Navbar from './Navbar';

/**
 * メインレイアウトコンポーネント
 * アプリの各ページを包み、共通のナビゲーションを提供します。
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden">
      <main className="flex-1 overflow-y-auto w-full max-w-lg mx-auto p-4 pb-6 overscroll-y-contain">
        {children}
      </main>
      <Navbar />
    </div>
  );
}
