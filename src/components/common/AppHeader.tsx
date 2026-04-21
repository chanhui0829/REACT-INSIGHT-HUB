/**
 * @file AppHeader.tsx
 * @description 전역 내비게이션 및 모바일 사이드 메뉴를 담당하는 헤더 컴포넌트입니다.
 * URL Search Params를 통한 카테고리 필터링 기능을 포함하며,
 * 모바일에서는 FlowChat 스타일의 슬라이딩 메뉴를 제공합니다.
 */

import { useCallback, useState, useMemo } from 'react';
import { NavLink, useNavigate, useSearchParams } from 'react-router';
import { CircleUserRound, Menu, X, LogOut, ChevronRight, LayoutGrid, BookText } from 'lucide-react';
import { toast } from 'sonner';

// Stores & UI Components
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';
import { useAuthStore } from '@/stores';
import { AppSidebar } from '@/components/common';

const useAuthSelector = () =>
  useStoreWithEqualityFn(
    useAuthStore,
    (state) => ({
      user: state.user,
      reset: state.reset,
    }),
    shallow
  );

function AppHeader() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const { user, reset } = useAuthSelector();

  // 현재 URL에서 카테고리 값 추출 (기본값: all)
  const currentCategory = searchParams.get('category') || 'all';

  // —————————————————————————————————————————————————————————————————————————————
  // Handlers
  // —————————————————————————————————————————————————————————————————————————————

  /**
   * 1. 로그아웃 핸들러
   */
  const handleLogout = useCallback(async () => {
    try {
      await reset();
      toast.success('로그아웃 되었습니다.');
      setIsOpen(false);
      navigate('/sign-in');
    } catch (_err) {
      toast.error('로그아웃 처리 중 오류가 발생했습니다.');
    }
  }, [reset, navigate]);

  /**
   * 2. 카테고리 선택 핸들러 (재사용 가능 로직)
   * 클릭 시 URL 파라미터를 변경하고 모바일 메뉴를 닫습니다.
   */
  const handleCategoryChange = useCallback(
    (categoryValue: string) => {
      // URL 파라미터 업데이트 (모든 페이지에서 '토픽 탐색'으로 이동하며 필터 적용)
      setSearchParams({ category: categoryValue });

      // 만약 메인 페이지가 아닌 곳에 있다면 메인으로 이동하며 파라미터 전달
      if (window.location.pathname !== '/') {
        navigate(`/?category=${categoryValue}`);
      }

      // 모바일 메뉴 닫기
      setIsOpen(false);
    },
    [setSearchParams, navigate]
  );

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  // 네비게이션 메뉴 (Case-Study 영문 적용)
  const navLinks = useMemo(
    () => [
      { label: '토픽 탐색', to: '/', icon: <LayoutGrid size={18} /> },
      { label: 'Case-Study', to: '/case-study', icon: <BookText size={18} /> },
    ],
    []
  );

  return (
    <>
      <header className="fixed top-0 left-0 z-100 w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl shadow-lg">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-6">
          {/* ——— 로고 & PC 메뉴 ——— */}
          <div className="flex items-center gap-18">
            <NavLink
              to="/"
              onClick={closeMenu}
              className="flex items-center transition-opacity hover:opacity-80 pt-2 "
            >
              <img src="/assets/icons/insight-hub.svg" alt="Insight Hub" className="h-10 w-auto" />
            </NavLink>

            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <div key={link.to} className="relative group">
                  <NavLink
                    to={link.to}
                    className={({ isActive }) => `
          flex items-center gap-2.5 text-[14px] font-black transition-all duration-200 tracking-tight
          ${isActive ? 'text-emerald-400' : 'text-zinc-500 hover:text-white'}
        `}
                  >
                    {link.icon}
                    {link.label}
                  </NavLink>

                  {/* "이 프로젝트가 궁금하다면?" 툴팁 효과 (Case-Study에만 적용) */}
                  {link.label === 'Case-Study' && (
                    <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-emerald-500 px-3 py-1.5 text-[11px] font-bold text-zinc-950 opacity-0 transition-all duration-300 group-hover:bottom-[-45px] group-hover:opacity-100 pointer-events-none">
                      이 프로젝트가 궁금하다면? ✨{/* 말풍선 꼬리 */}
                      <span className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-2 rotate-45 bg-emerald-500" />
                    </span>
                  )}
                </div>
              ))}
            </nav>
          </div>
          {/* ——— PC 사용자 메뉴 (로그아웃 아이콘 추가) ——— */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300 px-3 py-1.5 rounded-full bg-white/3 border border-white/5">
                  <CircleUserRound size={16} className="text-emerald-500" />
                  <span>{user.email?.split('@')[0]}님</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="group flex items-center gap-1.5 text-sm font-bold text-zinc-500 hover:text-rose-400 transition-colors"
                >
                  <LogOut size={16} className="transition-transform group-hover:translate-x-1" />
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <NavLink
                  to="/sign-in"
                  className="text-sm font-bold text-zinc-400 hover:text-white px-3 py-2 transition-all"
                >
                  로그인
                </NavLink>
                <NavLink
                  to="/sign-up"
                  className="rounded-full bg-emerald-500 px-5 py-2 text-sm font-black text-zinc-950 shadow-[0_8px_20px_rgba(16,185,129,0.2)] transition-transform active:scale-95"
                >
                  회원가입
                </NavLink>
              </div>
            )}
          </div>

          {/* ——— 모바일 토글 버튼 ——— */}
          <button
            onClick={toggleMenu}
            className="flex md:hidden p-2 text-zinc-400 hover:text-white transition-colors"
          >
            {isOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </header>

      {/* ——— 모바일 슬라이딩 메뉴 ——— */}
      <div
        className={`fixed inset-0 z-110 md:hidden transition-all duration-300 ${
          isOpen ? 'visible' : 'invisible'
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeMenu}
        />

        <div
          className={`
          absolute right-0 top-0 h-full w-[75%] max-w-[320px] bg-zinc-950 border-l border-white/5 p-6 shadow-2xl transition-transform duration-500 ease-out flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        >
          <div className="flex justify-end mb-8">
            <button onClick={closeMenu} className="p-2 text-zinc-500 hover:text-white">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* 1. 카테고리 (AppSidebar 재사용 및 로직 주입) */}
            <div className="mb-8 px-1">
              <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-600 mb-5">
                Category
              </h3>
              <div className="rounded-4xl bg-white/2 p-2 border border-white/5">
                <AppSidebar category={currentCategory} setCategory={handleCategoryChange} />
              </div>
            </div>

            {/* 2. 퀵 링크 */}
            <div className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <button
                  key={link.to}
                  onClick={() => {
                    navigate(link.to);
                    closeMenu();
                  }}
                  className="flex items-center justify-between w-full p-5 rounded-2xl bg-white/3 border border-white/5 text-zinc-300 font-bold active:bg-emerald-500/10 active:text-emerald-400 transition-all text-[15px]"
                >
                  <div className="flex items-center gap-3">
                    {link.icon}
                    {link.label}
                  </div>
                  <ChevronRight size={14} className="opacity-30" />
                </button>
              ))}
            </div>
          </div>

          {/* 3. 하단 사용자 계정 정보 */}
          <div className="mt-auto pt-6 border-t border-white/5">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <CircleUserRound size={22} className="text-emerald-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[14px] font-bold text-white truncate max-w-[140px]">
                      {user.email?.split('@')[0]}님
                    </span>
                    <span className="text-[11px] text-zinc-500 truncate max-w-[140px]">
                      {user.email}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-zinc-900 border border-white/5 text-rose-400 font-bold text-sm active:scale-95 transition-all"
                >
                  <LogOut size={16} />
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    navigate('/sign-in');
                    closeMenu();
                  }}
                  className="w-full py-4 text-zinc-400 font-bold text-sm"
                >
                  로그인
                </button>
                <button
                  onClick={() => {
                    navigate('/sign-up');
                    closeMenu();
                  }}
                  className="w-full py-4 bg-emerald-500 text-zinc-950 rounded-2xl font-black text-sm active:scale-95 transition-all"
                >
                  회원가입
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export { AppHeader };
