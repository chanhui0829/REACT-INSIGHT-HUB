import { Outlet } from 'react-router';
import { AppHeader, AppFooter } from '@/components/common';
import useAuthListener from '@/hooks/useAuth';

export default function RootLayout() {
  // ✅ Supabase 세션 변화 감지 → Zustand 동기화
  useAuthListener();

  return (
    <div className="page">
      {/* 헤더 */}
      <AppHeader />

      {/* 본문 컨테이너 */}
      <div className="container">
        <Outlet />
      </div>

      {/* 푸터 */}
      <AppFooter />
    </div>
  );
}
