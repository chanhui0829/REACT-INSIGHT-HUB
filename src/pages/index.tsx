/**
 * @file App.tsx
 * @description Insight Hub 메인 피드 컴포넌트.
 * URL 기반의 상태 관리(Source of Truth)를 통해 뒤로가기/새로고침 대응 및
 * TanStack Query의 Prefetching을 활용한 고성능 페이지네이션을 구현했습니다.
 */

import { useMemo, useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Funnel, NotebookPen, PencilLine, Search, Sparkles, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// —————————————————————————————————————————————————————————————————————————————
// Stores & Hooks
// —————————————————————————————————————————————————————————————————————————————
import { useAuthStore } from '@/stores';
import { useTopicList, usePrefetchTopics } from '@/hooks/useTopic';
import { SORT_CATEGORY } from '@/constants/sort.constant';
import { getUserNicknames } from '@/services/useService';

// —————————————————————————————————————————————————————————————————————————————
// UI Components
// —————————————————————————————————————————————————————————————————————————————
import { AppDraftsDialog, AppSidebar } from '@/components/common';
import { TopicCard } from '@/components/topics';
import {
  Button,
  Input,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';

function App() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();

  /**
   * [개선 사항] URL SearchParams를 단일 원천(Single Source of Truth)으로 사용
   * 별도의 useState 없이 URL의 변화가 직접 UI 상태를 결정하도록 설계되었습니다.
   */
  const category = searchParams.get('category') ?? 'all';
  const sortOption = searchParams.get('sort') ?? 'latest';
  const currentPage = Number(searchParams.get('page')) || 1;
  const searchQuery = searchParams.get('q') ?? '';
  const [searchInput, setSearchInput] = useState(searchQuery);

  // 페이지당 아이템 수 및 데이터 범위 계산
  const ITEMS_PER_PAGE = 8;
  const { startIndex, endIndex } = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return { startIndex: start, endIndex: start + ITEMS_PER_PAGE - 1 };
  }, [currentPage]);

  // 데이터 fetch를 위한 필터 객체 memoization
  const filters = useMemo(
    () => ({ category, searchQuery, sortOption, startIndex, endIndex }),
    [category, searchQuery, sortOption, startIndex, endIndex]
  );

  // 데이터 fetching 및 프리페칭
  const { data, isLoading, isFetching } = useTopicList(filters, currentPage);
  const prefetchNext = usePrefetchTopics(filters, currentPage);

  useEffect(() => {
    prefetchNext();
  }, [prefetchNext]);

  const topics = data?.topics ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / ITEMS_PER_PAGE);
  const authorIds = useMemo(() => topics.map((topic) => topic.author), [topics]);

  const { data: nicknameMap = {} } = useQuery({
    queryKey: ['user', 'nicknames', [...authorIds].sort().join(',')],
    queryFn: () => getUserNicknames(authorIds),
    enabled: authorIds.length > 0,
    staleTime: 1000 * 60 * 10,
  });

  // —————————————————————————————————————————————————————————————————————————————
  // Handlers
  // —————————————————————————————————————————————————————————————————————————————

  /**
   * 공통 URL 상태 업데이트 함수
   */
  const updateParams = useCallback(
    (newParams: Record<string, string>) => {
      setSearchParams(
        (prev) => {
          Object.entries(newParams).forEach(([key, value]) => {
            if (value) prev.set(key, value);
            else prev.delete(key);
          });
          return prev;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const debounced = window.setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed.length > 0 && trimmed.length < 2) return;
      if (trimmed === searchQuery) return;
      updateParams({ q: trimmed, page: '1' });
    }, 300);

    return () => window.clearTimeout(debounced);
  }, [searchInput, searchQuery, updateParams]);

  const handleSearch = useCallback(() => {
    const trimmed = searchInput.trim();
    if (trimmed.length > 0 && trimmed.length < 2) {
      toast.warning('검색어를 두 글자 이상 입력해주세요.');
      return;
    }
    if (trimmed === searchQuery) return;
    updateParams({ q: trimmed, page: '1' });
  }, [searchInput, searchQuery, updateParams]);

  const handleCategoryChange = useCallback(
    (value: string) => {
      setSearchParams({ category: value || 'all', sort: 'latest', page: '1' });
    },
    [setSearchParams]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;
      updateParams({ page: String(page) });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [updateParams, totalPages]
  );

  const handleRoute = useCallback(() => {
    if (!user) {
      toast.warning('토픽 작성은 로그인 후 가능합니다.');
      return;
    }
    navigate('/topics/create');
  }, [user, navigate]);

  const visiblePages = useMemo(() => {
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  return (
    <main className="w-full flex lg:flex-row gap-16 items-start mt-18 px-6 max-w-[1240px] mx-auto mb-32">
      {/* 🚀 Sticky Action Group */}
      <div className="fixed left-1/2 bottom-10 -translate-x-1/2 z-50 ">
        <div className="flex items-center gap-2 p-3 rounded-full bg-zinc-900/90 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <Button
            onClick={handleRoute}
            className="rounded-full h-12 px-7! bg-amber-300 hover:bg-amber-200 text-zinc-800 font-black text-xs uppercase tracking-widest flex gap-2 transition-all active:scale-95 shadow-[0_0_20px_rgba(255,235,59,0.4)]"
          >
            <PencilLine size={16} />새 토픽 작성
          </Button>
          <div className="w-px h-6 bg-zinc-800 mx-1" />
          <AppDraftsDialog>
            <Button
              variant="outline"
              size="icon"
              aria-label="임시 저장 토픽 열기"
              className="rounded-full w-12 h-12 hover:bg-white/10 transition-colors"
            >
              <NotebookPen className="w-5 h-5 text-zinc-400" />
            </Button>
          </AppDraftsDialog>
        </div>
      </div>

      <aside className="hidden lg:block w-52 shrink-0 self-stretch">
        <div className="sticky top-16 flex flex-col gap-6">
          <div className="px-3 pb-2 border-b border-white/5"></div>
          <AppSidebar category={category} setCategory={handleCategoryChange} />
        </div>
      </aside>

      <section className="flex-1 min-w-0 flex flex-col gap-12 mt-4">
        <header className="w-full flex flex-col items-center text-center gap-6 py-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-[0.2em] uppercase">
            <Sparkles size={12} className="animate-pulse" />
            Knowledge & Insight
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tighter leading-[1.1] text-white ">
            지식의 조각을 모아
            <br />
            <span className="bg-linear-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent italic pr-2">
              인사이트를 연결하세요
            </span>
          </h1>
          <p className="text-zinc-500 text-[15px] max-w-md leading-relaxed font-medium opacity-90">
            생각을 기록하고 경험을 공유하며
            <br />
            당신만의 깊이 있는 인사이트를 만들어보세요.
          </p>
        </header>

        <div className="w-full flex flex-col gap-10">
          <div className="relative group w-full max-w-xl mx-auto transition-all duration-500">
            <div className="absolute -inset-1 bg-linear-to-r from-emerald-400/20 to-blue-500/20 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition duration-700 " />
            <div className="relative flex items-center h-15 px-6 gap-3 rounded-full border border-white/10 bg-zinc-900/50 backdrop-blur-2xl focus-within:border-emerald-500/40 transition-all ">
              <Search className="w-6 h-6 text-zinc-600" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="지식과 코드를 검색하세요."
                aria-label="토픽 검색어 입력"
                className="flex-1 h-10 border-none! bg-transparent! text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-0"
              />
              <Button
                onClick={handleSearch}
                aria-label="검색 실행"
                className="h-9 px-6 rounded-full bg-gray-300 hover:bg-gray-200 text-zinc-950 font-black text-xs tracking-tight shadow-xl transition-all active:scale-95"
              >
                검색
              </Button>
            </div>
          </div>

          <div className="flex justify-end items-center gap-4 w-full px-2">
            {isFetching && !isLoading && (
              <div className="flex items-center gap-2 text-zinc-600 animate-in fade-in slide-in-from-right-2 duration-500">
                <Loader2 size={13} className="animate-spin" />
                <span className="text-[10px] font-black tracking-widest uppercase opacity-60">
                  Updating
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 bg-zinc-900/50 px-4 py-1.5 rounded-2xl border border-white/5 transition-colors hover:border-white/10">
              <Funnel size={12} className="text-zinc-500" />
              <Select
                value={sortOption}
                onValueChange={(v) => updateParams({ sort: v, page: '1' })}
              >
                <SelectTrigger className="h-5 w-24 bg-transparent border-none px-2 text-[11px] text-zinc-400 font-bold uppercase tracking-wider focus:ring-0 shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0c0c0e] border-white/10 rounded-2xl shadow-2xl">
                  <SelectGroup>
                    {SORT_CATEGORY.map((item) => (
                      <SelectItem
                        key={item.id}
                        value={item.sortOption}
                        className="text-[11px] font-bold focus:bg-emerald-500/10 focus:text-emerald-400 rounded-xl m-1"
                      >
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="min-h-[600px]">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-64 rounded-4xl bg-zinc-900/40 border border-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-8">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className="group transition-all duration-500 hover:translate-y-1"
                >
                  <TopicCard props={topic} authorNickname={nicknameMap[topic.author]} />
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center pt-16 ">
            <Pagination className="bg-zinc-900/40 backdrop-blur-xl border border-white/5 p-1.5 rounded-3xl w-fit shadow-2xl">
              <PaginationContent className="gap-1">
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-label="이전 페이지"
                    role="button"
                    className="hover:bg-white/5 rounded-2xl px-4 text-xs font-bold text-zinc-500"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage - 1);
                    }}
                  />
                </PaginationItem>
                {visiblePages.map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      aria-label={`${page}페이지로 이동`}
                      role="button"
                      isActive={page === currentPage}
                      className={`rounded-2xl w-10 h-10 text-xs font-black transition-all ${
                        page === currentPage
                          ? 'bg-emerald-500 text-zinc-700 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                          : 'hover:bg-white/5 text-zinc-600'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(page);
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-label="다음 페이지"
                    role="button"
                    className="hover:bg-white/5 rounded-2xl px-4 text-xs font-bold text-zinc-500"
                    onClick={(e) => {
                      e.preventDefault();
                      handlePageChange(currentPage + 1);
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
