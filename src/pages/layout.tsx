import { Outlet } from 'react-router';
import { AppHeader, AppFooter } from '@/components/common';
import useAuthListener from '@/hooks/useAuth';

export default function RootLayout() {
  // Supabase 세션 변화 감지 → Zustand 동기화
  useAuthListener();

  return (
    <div className="min-h-screen flex flex-col bg-background ">
      {/* 헤더 */}
      <AppHeader />

      {/* 본문 */}
      <main className="flex-1 w-full">
        <Outlet />
      </main>

      {/* 푸터 */}
      <AppFooter />
    </div>
  );
}
