import { NavLink, useNavigate } from 'react-router';
import { CircleUserRound, Menu, X } from 'lucide-react';
import { toast } from 'sonner';
import { useCallback, useState } from 'react';

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

  // 🔥 모바일 메뉴 상태
  const [isOpen, setIsOpen] = useState(false);

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

          {/* 🔥 PC 네비 */}
          <div className="hidden md:flex items-center gap-8">
            <NavLink
              to="/"
              className="font-semibold text-base text-zinc-300 hover:text-emerald-300 transition"
            >
              토픽 탐색
            </NavLink>

            <button
              onClick={() => navigate('/case-study')}
              className="text-sm text-zinc-300 hover:text-white transition relative after:absolute after:-bottom-1 after:left-0 after:w-0 after:h-px after:bg-white after:transition-all hover:after:w-full "
            >
              📘 Case Study
            </button>
          </div>
        </div>

        {/* 🔥 PC 우측 사용자 메뉴 */}
        <div className="hidden md:flex">
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

        {/* 🔥 햄버거 버튼 (모바일) */}
        <button className="md:hidden text-zinc-300" onClick={() => setIsOpen((prev) => !prev)}>
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* 🔥 모바일 메뉴 */}
      {isOpen && (
        <div className="md:hidden w-full border-t border-white/10 bg-black/90 backdrop-blur-md px-4 py-4 flex flex-col gap-4">
          <button
            onClick={() => {
              navigate('/');
              setIsOpen(false);
            }}
            className="text-left text-sm text-zinc-300 hover:text-white"
          >
            토픽 탐색
          </button>

          <button
            onClick={() => {
              navigate('/case-study');
              setIsOpen(false);
            }}
            className="text-left text-sm text-zinc-300 hover:text-white"
          >
            Case Study
          </button>

          <div className="border-t border-zinc-700 pt-3 mt-2">
            {user ? (
              <>
                <p className="text-xs text-zinc-500">{user.email}</p>
                <button
                  onClick={handleLogout}
                  className="text-sm text-zinc-300 hover:text-white mt-2"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <NavLink to="/sign-in" className="text-sm text-zinc-300">
                  로그인
                </NavLink>
                <NavLink to="/sign-up" className="text-sm text-zinc-300">
                  회원가입
                </NavLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export { AppHeader };
