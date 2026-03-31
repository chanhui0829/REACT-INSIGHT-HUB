import { NavLink, useNavigate } from 'react-router';
import { CircleUserRound } from 'lucide-react';
import { toast } from 'sonner';
import { useCallback } from 'react';

// Zustand
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';
import { useAuthStore } from '@/stores';

// UI
import { Separator } from '../ui';

// ==========================================
// 🔥 Zustand selector (user + reset만 구독)
// - 가장 안전한 shallow 비교
// - TS 오류 없음
// ==========================================
const useAuthSelector = () =>
  useStoreWithEqualityFn(
    useAuthStore,
    (state) => ({
      user: state.user,
      reset: state.reset,
    }),
    shallow
  );

// ==========================================
// 🔥 AppHeader Component
// ==========================================
function AppHeader() {
  const navigate = useNavigate();

  // shallow 최적화된 selector 사용
  const { user, reset } = useAuthSelector();

  // 로그아웃 콜백 메모이징
  const handleLogout = useCallback(async () => {
    try {
      await reset(); // Zustand + Supabase 로그아웃
      toast.success('로그아웃 되었습니다.');
      navigate('/sign-in');
    } catch (err) {
      console.error(err);
      toast.error('로그아웃 중 오류가 발생했습니다.');
    }
  }, [reset, navigate]);

  // ==========================================
  // 🔥 UI 렌더링
  // ==========================================
  return (
    <header
      className="fixed top-0 z-50 w-full flex items-center justify-center bg-black/70 backdrop-blur-md border-b border-white/10 
shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
    >
      <div className="w-full max-w-[1328px] flex items-center justify-between px-4 py-2">
        {/* 로고 + 네비 */}
        <div className="flex items-center gap-3">
          <img
            src="/assets/icons/insight-hub.svg"
            alt="Insight Hub"
            className="h-12 object-contain"
          />

          <NavLink
            to="/"
            className="font-semibold text-base text-zinc-300 hover:text-emerald-300 transition "
          >
            토픽 탐색
          </NavLink>
        </div>

        {/* 우측 사용자 메뉴 */}
        {user ? (
          <div className="flex items-center gap-5 font-semibold text-md">
            <div className="flex items-center gap-1">
              <CircleUserRound size={16} className="m-0.5" />
              <span>{user.email}님</span>
            </div>
            <Separator orientation="vertical" className="!h-4" />

            <button
              type="button"
              onClick={handleLogout}
              className="hover:scale-110 transition-all duration-150 cursor-pointer"
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4 font-semibold text-md">
            <NavLink to="/sign-in" className="hover:scale-110 transition-all duration-150">
              로그인
            </NavLink>
            <NavLink to="/sign-up" className="hover:scale-110 transition-all duration-150">
              회원가입
            </NavLink>
          </div>
        )}
      </div>
    </header>
  );
}

export { AppHeader };
