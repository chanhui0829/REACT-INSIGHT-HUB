/**
 * @file App.tsx
 * @description Insight Hub 메인 피드 컴포넌트.
 * URL 기반의 상태 관리(Source of Truth)를 통해 뒤로가기/새로고침 대응 및
 * TanStack Query의 Prefetching을 활용한 고성능 페이지네이션을 구현했습니다.
 */

import { useMemo, useCallback, useEffect, useState, useRef, useTransition } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Funnel, NotebookPen, PencilLine, Search, Sparkles, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// —————————————————————————————————————————————————————————————————————————————
// Stores & Hooks
// —————————————————————————————————————————————————————————————————————————————
import { useAuthStore } from '@/stores';
import { useTopicList } from '@/hooks/useTopic';
import { SORT_CATEGORY } from '@/constants/sort.constant';
import { getUserNicknames } from '@/services/useService';
import type { Topic } from '@/types/topic.type';

// —————————————————————————————————————————————————————————————————————————————
// UI Components
// —————————————————————————————————————————————————————————————————————————————
import { AppDraftsDialog } from '@/components/common';
import { TopicCard } from '@/components/topics';
import { CLASS_CATEGORY } from '@/constants/category.constant';
import {
  Button,
  Input,
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
  const searchQuery = searchParams.get('q') ?? '';
  const [searchInput, setSearchInput] = useState(searchQuery);

  // Infinite scroll state
  const [displayedTopics, setDisplayedTopics] = useState<Topic[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  // 페이지당 아이템 수 및 데이터 범위 계산
  const ITEMS_PER_PAGE = 12;
  const MAX_DISPLAYED_ITEMS = 60; // 메모리 최적화를 위해 최대 60개만 유지
  const { startIndex, endIndex } = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return { startIndex: start, endIndex: start + ITEMS_PER_PAGE - 1 };
  }, [page]);

  // 데이터 fetch를 위한 필터 객체 memoization
  const filters = useMemo(
    () => ({ category, searchQuery, sortOption, startIndex, endIndex }),
    [category, searchQuery, sortOption, startIndex, endIndex]
  );

  // 데이터 fetching
  const { data, isLoading, isFetching } = useTopicList(filters, page);

  // 새 데이터가 로드되면 displayedTopics에 추가 (useTransition으로 비차단적 업데이트)
  useEffect(() => {
    if (data?.topics) {
      startTransition(() => {
        setDisplayedTopics((prev) => {
          const newTopics = page === 1 ? data.topics : [...prev, ...data.topics];
          // 메모리 최적화: 최대 60개만 유지, 오래된 데이터 제거
          return newTopics.length > MAX_DISPLAYED_ITEMS
            ? newTopics.slice(-MAX_DISPLAYED_ITEMS)
            : newTopics;
        });
        // 더 이상 불러올 데이터가 있는지 확인
        const totalLoaded = page * ITEMS_PER_PAGE;
        setHasMore(totalLoaded < (data?.total ?? 0));
      });
    }
  }, [data, page]);

  // 필터가 변경되면 페이지 초기화
  useEffect(() => {
    setPage(1);
    setDisplayedTopics([]);
    setHasMore(true);
  }, [category, searchQuery, sortOption]);

  // Intersection Observer for infinite scroll (with debounce)
  useEffect(() => {
    let debounceTimer: NodeJS.Timeout;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetching) {
          // 디바운스: 빠른 스크롤 시 너무 자주 페이지 증가 방지
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            setPage((prev) => prev + 1);
          }, 200);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      clearTimeout(debounceTimer);
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [hasMore, isFetching]);

  const topics = displayedTopics;
  // 메모이제이션 최적화: authorIds가 변경될 때만 재계산
  const authorIds = useMemo(() => {
    const ids = topics.map((topic) => topic.author);
    // 중복 제거하여 불필요한 쿼리 방지
    return [...new Set(ids)];
  }, [topics]);

  const { data: nicknameMap = {} } = useQuery({
    queryKey: ['user', 'nicknames', authorIds.sort().join(',')],
    queryFn: () => getUserNicknames(authorIds),
    enabled: authorIds.length > 0,
    staleTime: 1000 * 60 * 30, // 30분 캐싱으로 쿼리 빈도 감소
    gcTime: 1000 * 60 * 60, // 1시간 가비지 컬렉션
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
      setSearchParams({ category: value || 'all', sort: 'latest' });
    },
    [setSearchParams]
  );

  const handleRoute = useCallback(() => {
    if (!user) {
      toast.warning('토픽 작성은 로그인 후 가능합니다.');
      return;
    }
    navigate('/topics/create');
  }, [user, navigate]);

  return (
    <main className="w-full flex flex-col items-start mt-28 px-4 md:px-6 max-w-[1400px] mx-auto mb-32">
      {/* 🚀 Sticky Action Group */}
      <div className="fixed left-1/2 bottom-8 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 p-2.5 rounded-full bg-slate-950/90 backdrop-blur-3xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <Button
            onClick={handleRoute}
            className="rounded-full h-11 px-6 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs uppercase tracking-widest flex gap-2 transition-all active:scale-95"
          >
            <PencilLine size={14} />새 토픽 작성
          </Button>
          <div className="w-px h-5 bg-slate-800 mx-1" />
          <AppDraftsDialog>
            <Button
              variant="outline"
              size="icon"
              aria-label="임시 저장 토픽 열기"
              className="rounded-full w-11 h-11 hover:bg-white/10 transition-colors border-white/10"
            >
              <NotebookPen className="w-4 h-4 text-slate-400" />
            </Button>
          </AppDraftsDialog>
        </div>
      </div>

      <section className="w-full flex flex-col gap-10">
        <header className="w-full flex flex-col items-center text-center gap-5 py-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black tracking-[0.2em] uppercase">
            <Sparkles size={12} className="animate-pulse" />
            Knowledge Platform
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-white">
            Connect the Dots,
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Create your Insight
            </span>
          </h1>
          <p className="text-slate-300 text-base md:text-lg max-w-2xl leading-relaxed font-medium">
            지식의 조각을 연결하고, 당신만의 깊이 있는 인사이트를 만들어보세요.
          </p>
        </header>

        <div className="w-full flex flex-col gap-8">
          <div className="relative group w-full max-w-2xl mx-auto transition-all duration-500">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition duration-700" />
            <div className="relative flex items-center h-14 px-5 gap-3 rounded-full border border-white/10 bg-slate-900/50 backdrop-blur-2xl focus-within:border-indigo-500/40 transition-all">
              <Search className="w-5 h-5 text-slate-400" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="지식과 코드를 검색하세요."
                aria-label="토픽 검색어 입력"
                className="flex-1 h-10 border-none! bg-transparent! text-slate-100 placeholder:text-slate-500 focus-visible:ring-0 text-sm"
              />
              <Button
                onClick={handleSearch}
                aria-label="검색 실행"
                className="h-9 px-5 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs tracking-tight transition-all active:scale-95"
              >
                검색
              </Button>
            </div>
          </div>

          {/* Horizontal Pill Style Category Tabs */}
          <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
            <div className="flex items-center gap-2 min-w-max md:justify-center">
              {CLASS_CATEGORY.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.category)}
                  className={`
                    px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all duration-300
                    ${
                      category === cat.category
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                        : 'bg-slate-900/50 text-slate-400 border border-white/10 hover:border-white/20 hover:text-slate-200'
                    }
                  `}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end items-center gap-3 w-full">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
              <Funnel size={14} className="text-indigo-400" />
              정렬
            </div>
            <Select value={sortOption} onValueChange={(value) => updateParams({ sort: value })}>
              <SelectTrigger className="w-[150px] h-10 bg-slate-900/50 border border-white/10 text-xs font-black text-slate-200 rounded-full hover:border-indigo-500/30 transition-all focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 pl-4">
                <SelectValue placeholder="정렬 선택" />
              </SelectTrigger>
              <SelectContent className="bg-slate-950 border border-white/10 rounded-2xl p-2 shadow-2xl">
                <SelectGroup>
                  {SORT_CATEGORY.map((sort) => (
                    <SelectItem
                      key={sort.sortOption}
                      value={sort.sortOption}
                      className="text-xs font-bold text-slate-300 hover:bg-indigo-500/10 hover:text-indigo-400 rounded-xl transition-all cursor-pointer"
                    >
                      {sort.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="min-h-[600px]">
          {isLoading && topics.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="aspect-[4/5] rounded-[32px] bg-slate-900/40 border border-white/5 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="group transition-all duration-300 will-change-transform"
                  >
                    <TopicCard props={topic} authorNickname={nicknameMap[topic.author]} />
                  </div>
                ))}
              </div>

              {/* Infinite scroll loader */}
              <div ref={loaderRef} className="py-8 flex justify-center">
                {(isFetching || isPending) && hasMore && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Loading more...
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export default App;
