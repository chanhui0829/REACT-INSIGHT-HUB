/**
 * @file AppHeader.tsx
 * @description 전역 내비게이션 및 모바일 사이드 메뉴를 담당하는 헤더 컴포넌트입니다.
 * URL Search Params를 통한 카테고리 필터링 기능을 포함하며,
 * 모바일에서는 FlowChat 스타일의 슬라이딩 메뉴를 제공합니다.
 */

import { useCallback, useState, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { Menu, X, LogOut, LayoutGrid, BookText, ChevronDown, User, Settings } from 'lucide-react';
import { toast } from 'sonner';

// Stores & UI Components
import { useStoreWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui';

import { useAuthStore } from '@/stores';

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
  const [isOpen, setIsOpen] = useState(false);
  const { user, reset } = useAuthSelector();

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
      <header className="fixed top-6 left-1/2 -translate-x-1/2 z-100 w-full max-w-[1400px] px-6">
        <div className="mx-auto flex h-14 items-center justify-between rounded-full bg-slate-950/70 backdrop-blur-xl border border-white/10 shadow-2xl px-6">
          {/* ——— 로고 ——— */}
          <NavLink
            to="/"
            onClick={closeMenu}
            className="flex items-center transition-opacity hover:opacity-80 font-sans"
          >
            <span className="text-xl font-extrabold tracking-tight text-white">
              Insight<span className="text-indigo-400">Hub</span>
            </span>
          </NavLink>

          {/* ——— PC 메뉴 ——— */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => `
          flex items-center gap-2 text-[13px] font-black transition-all duration-200 tracking-tight
          ${isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}
        `}
              >
                {link.icon}
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* ——— PC 사용자 메뉴 ——— */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 h-11 px-4 rounded-full bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 hover:border-indigo-500/30 transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                      {user.nickname?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="text-xs font-bold text-slate-300">
                      {user.nickname || user.email?.split('@')[0]}
                    </span>
                    <ChevronDown size={14} className="text-slate-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 bg-slate-950 border border-white/10 rounded-2xl p-2 shadow-2xl"
                >
                  <DropdownMenuLabel className="text-xs font-bold text-slate-500 px-3 py-2">
                    계정
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem className="flex items-center gap-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-xl cursor-pointer">
                    <User size={14} className="text-slate-500" />
                    프로필
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex items-center gap-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-xl cursor-pointer">
                    <Settings size={14} className="text-slate-500" />
                    설정
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/5" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl cursor-pointer"
                  >
                    <LogOut size={14} />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <NavLink
                  to="/sign-in"
                  className="text-xs font-bold text-slate-400 hover:text-white px-4 py-2 transition-all"
                >
                  로그인
                </NavLink>
                <NavLink
                  to="/sign-up"
                  className="rounded-full bg-indigo-500 px-4 py-2 text-xs font-black text-white transition-transform active:scale-95"
                >
                  회원가입
                </NavLink>
              </div>
            )}
          </div>

          {/* ——— 모바일 토글 버튼 ——— */}
          <button
            onClick={toggleMenu}
            aria-label={isOpen ? '모바일 메뉴 닫기' : '모바일 메뉴 열기'}
            aria-controls="mobile-nav-drawer"
            aria-expanded={isOpen}
            className="flex md:hidden p-2 text-slate-400 hover:text-white transition-colors min-w-10 min-h-10 items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 rounded-full"
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
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
          className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={closeMenu}
        />

        <div
          id="mobile-nav-drawer"
          className={`
          absolute right-0 top-0 h-full w-[80%] max-w-[340px] bg-slate-950 border-l border-white/10 p-6 shadow-2xl transition-transform duration-500 ease-out flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        >
          <div className="flex justify-end mb-8">
            <button
              onClick={closeMenu}
              aria-label="모바일 메뉴 닫기"
              className="p-2 text-slate-500 hover:text-white min-w-11 min-h-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70 rounded-full"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide">
            {/* 1. 퀵 링크 */}
            <div className="flex flex-col gap-2 mb-8">
              {navLinks.map((link) => (
                <button
                  key={link.to}
                  onClick={() => {
                    navigate(link.to);
                    closeMenu();
                  }}
                  className="flex items-center gap-3 w-full p-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-bold hover:bg-white/10 hover:text-white transition-all text-sm"
                >
                  {link.icon}
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. 하단 사용자 계정 정보 */}
          <div className="mt-auto pt-6 border-t border-white/10">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-indigo-500/20">
                    {user.nickname?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white truncate max-w-[160px]">
                      {user.nickname || user.email?.split('@')[0]}
                    </span>
                    <span className="text-xs text-slate-500 truncate max-w-[160px]">
                      {user.email}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      closeMenu();
                    }}
                    className="flex items-center gap-3 w-full p-3.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold hover:bg-white/10 hover:text-white transition-all text-sm"
                  >
                    <User size={16} className="text-slate-500" />
                    프로필
                  </button>
                  <button
                    onClick={() => {
                      closeMenu();
                    }}
                    className="flex items-center gap-3 w-full p-3.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-bold hover:bg-white/10 hover:text-white transition-all text-sm"
                  >
                    <Settings size={16} className="text-slate-500" />
                    설정
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 w-full p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold hover:bg-rose-500/20 hover:text-rose-300 transition-all text-sm"
                  >
                    <LogOut size={16} />
                    로그아웃
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    navigate('/sign-in');
                    closeMenu();
                  }}
                  className="w-full py-3.5 text-slate-400 font-bold text-sm hover:text-white transition-colors"
                >
                  로그인
                </button>
                <button
                  onClick={() => {
                    navigate('/sign-up');
                    closeMenu();
                  }}
                  className="w-full py-3.5 bg-indigo-500 text-white rounded-full font-black text-sm active:scale-95 transition-all"
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
