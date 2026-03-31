import { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Funnel, NotebookPen, PencilLine, Search } from 'lucide-react';

// Store & Utils
import { useAuthStore } from '@/stores';
import { SORT_CATEGORY } from '@/constants/sort.constant';

// Components
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

// ✅ useTopic 하나로 통합 사용
import { useTopicList, usePrefetchTopics } from '@/hooks/useTopic';

function App() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();

  const category = searchParams.get('category') ?? 'all';
  const initialSort = searchParams.get('sort') ?? 'latest';
  const initialPage = Number(searchParams.get('page')) || 1;

  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState(initialSort);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentCategory = params.get('category') ?? 'all';
    const currentSort = params.get('sort') ?? 'latest';
    const currentPageStr = params.get('page') ?? '1';

    if (
      currentCategory !== category ||
      currentSort !== sortOption ||
      currentPageStr !== String(currentPage)
    ) {
      setSearchParams({ category, sort: sortOption, page: String(currentPage) }, { replace: true });
    }
  }, [category, sortOption, currentPage, setSearchParams]);

  const { startIndex, endIndex } = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return { startIndex: start, endIndex: start + ITEMS_PER_PAGE - 1 };
  }, [currentPage]);

  const filters = useMemo(
    () => ({
      category,
      searchQuery,
      sortOption,
      startIndex,
      endIndex,
    }),
    [category, searchQuery, sortOption, startIndex, endIndex]
  );

  // 🔥 hook 사용
  const { data, isLoading, isFetching } = useTopicList(filters, currentPage);

  const prefetchNext = usePrefetchTopics(filters, currentPage);

  useEffect(() => {
    prefetchNext();
  }, [prefetchNext]);

  const topics = data?.topics ?? [];
  const totalPages = Math.ceil((data?.total ?? 0) / ITEMS_PER_PAGE);

  const handleSearch = useCallback(() => {
    if (searchInput.trim().length < 2) {
      toast.warning('검색어를 두 글자 이상 입력해주세요.');
      return;
    }
    setSearchQuery(searchInput.trim());
    setCurrentPage(1);
  }, [searchInput]);

  const handleCategoryChange = useCallback(
    (value: string) => {
      setSortOption('latest');
      setCurrentPage(1);
      setSearchQuery('');
      setSearchInput('');
      setSearchParams({ category: value || 'all', sort: 'latest', page: '1' });
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

  const visiblePages = useMemo(() => {
    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, currentPage + 2);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [currentPage, totalPages]);
  return (
    <main className="w-full flex flex-col lg:flex-row gap-8 items-start mt-16 ">
      {/* 모바일 사이드바 */}
      <div className="lg:hidden w-full sticky top-20 z-30">
        <AppSidebar category={category} setCategory={handleCategoryChange} />
      </div>

      {/* 데스크탑 사이드바 */}
      <aside className="hidden lg:block w-64 shrink-0 sticky top-24">
        <AppSidebar category={category} setCategory={handleCategoryChange} />
      </aside>

      {/* 메인 영역 */}
      <section className="flex-1 min-w-0 flex flex-col gap-10">
        {/* Floating 버튼 */}
        <div className="fixed right-1/2 bottom-10 translate-x-1/2 z-40 flex gap-2 items-center">
          <Button
            variant="destructive"
            className="rounded-full px-4! py-4! shadow-lg hover:scale-105 transition"
            onClick={handleRoute}
          >
            <PencilLine />
            나만의 토픽 작성
          </Button>

          <AppDraftsDialog>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10 border bg-muted hover:scale-115 transition"
            >
              <NotebookPen className="w-5 h-5" />
            </Button>
          </AppDraftsDialog>
        </div>

        {/* header */}
        <header className="w-full flex justify-center py-2">
          <div className="flex flex-col items-center text-center gap-4 max-w-2xl">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <img src="/assets/gifs/gif-002.gif" className="w-10 h-10" alt="insight-gif" />
            </div>

            <h1 className="text-2xl md:text-3xl font-semibold leading-snug tracking-tight">
              지식과 인사이트를 모아
              <br />
              <span className="text-emerald-400">더 깊이 있는 토픽</span>으로 나누세요
            </h1>

            <p className="text-zinc-400 text-xs md:text-sm">
              생각을 기록하고, 경험을 공유하며 인사이트를 만들어보세요.
            </p>
          </div>
        </header>

        {/* 검색 */}
        <div className="w-full flex justify-center">
          <div className="w-full max-w-2xl">
            <div
              className="flex items-center h-14 px-5 gap-2 rounded-full border border-zinc-700 bg-black/40 backdrop-blur-md
                          transition-all focus-within:border-zinc-500"
            >
              <Search className="w-5 h-5 text-zinc-400 shrink-0" />

              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="관심 있는 클래스, 토픽 주제를 검색하세요."
                className="flex-1 h-full border-none bg-transparent
                text-lg! text-zinc-200  placeholder:text-zinc-500
        focus-visible:ring-0 mr-2"
              />

              <Button
                onClick={handleSearch}
                className="h-10 px-5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium shadow-inner"
              >
                검색
              </Button>
            </div>
          </div>
        </div>
        {/* 정렬 */}
        <div className="flex justify-end">
          <div className="flex items-center gap-2">
            <Funnel size={14} className="text-muted-foreground" />
            <p className="text-xs text-muted-foreground">정렬</p>

            <Select
              value={sortOption}
              onValueChange={(v) => {
                setSortOption(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectGroup>
                  {SORT_CATEGORY.map((item) => (
                    <SelectItem key={item.id} value={item.sortOption}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 리스트 */}
        <div className="w-full flex flex-col gap-6">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : topics.length > 0 ? (
            <>
              {isFetching && (
                <p className="text-center text-xs text-muted-foreground">업데이트 중...</p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {topics.map((topic) => (
                  <TopicCard key={topic.id} props={topic} />
                ))}
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground mt-10">
              {searchQuery
                ? `"${searchQuery}"에 대한 검색 결과가 없습니다.`
                : '조회 가능한 토픽이 없습니다.'}
            </p>
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <Pagination className="mt-6 mb-10">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(Math.max(1, currentPage - 1));
                  }}
                />
              </PaginationItem>

              {visiblePages.map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={page === currentPage}
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(page);
                    }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(Math.min(totalPages, currentPage + 1));
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </section>
    </main>
  );
}

export default App;
