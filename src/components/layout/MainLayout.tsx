import Navbar from './Navbar';

/**
 * メインレイアウトコンポーネント
 * アプリの各ページを包み、共通のナビゲーションを提供します。
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="pb-20 min-h-screen">
      <main className="max-w-lg mx-auto p-4">
        {children}
      </main>
      <Navbar />
    </div>
  );
}
