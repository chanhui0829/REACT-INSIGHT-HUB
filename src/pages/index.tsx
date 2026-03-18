import { useMemo, useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Funnel, NotebookPen, PencilLine, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

// Store & Utils
import { useAuthStore } from '@/stores';
import supabase from '@/lib/supabase';
import { TOPIC_STATUS, type Topic } from '@/types/topic.type';
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

type TopicsResponse = {
  topics: Topic[];
  total: number;
};

// =============================================================
// 🔥 API - 쿼리 최적화
// =============================================================

async function fetchTopics(filters: {
  category: string;
  searchQuery: string;
  sortOption: string;
  startIndex: number;
  endIndex: number;
}): Promise<TopicsResponse> {
  const { category, searchQuery, sortOption, startIndex, endIndex } = filters;

  let query = supabase
    .from('topic')
    .select('*', { count: 'exact' })
    .eq('status', TOPIC_STATUS.PUBLISH);

  if (category !== 'all') query = query.eq('category', category);
  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
  }

  const orderBy =
    sortOption === 'likes' ? 'likes' : sortOption === 'views' ? 'views' : 'created_at';

  const { data, error, count } = await query
    .order(orderBy, { ascending: false })
    .range(startIndex, endIndex);

  if (error) throw new Error(error.message);
  return { topics: data ?? [], total: count ?? 0 };
}

function App() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();

  // URL에서 초기값 파싱
  const category = searchParams.get('category') ?? 'all';
  const initialSort = searchParams.get('sort') ?? 'latest';
  const initialPage = Number(searchParams.get('page')) || 1;

  const ITEMS_PER_PAGE = 8;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState(initialSort);

  // ✅ URL 동기화 로직 최적화 (무한 리렌더링 방지)
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

  const { data, isLoading } = useQuery({
    queryKey: ['topics', filters],
    queryFn: () => fetchTopics(filters),
    staleTime: 1000 * 30,
  });

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
    <main className="w-full min-h-screen flex flex-col lg:flex-row p-6 gap-6 mt-2 items-start">
      <div className="lg:hidden w-full mb-2 sticky z-30">
        <AppSidebar category={category} setCategory={handleCategoryChange} />
      </div>

      <aside className="hidden lg:block lg:w-64 lg:shrink-0 sticky top-24">
        <AppSidebar category={category} setCategory={handleCategoryChange} />
      </aside>

      <section className="w-full flex-1 min-w-0 flex flex-col gap-12 lg:mr-2">
        {/* Floating Action Buttons */}
        <div className="fixed flex gap-2 right-1/2 bottom-10 translate-x-1/2 z-40 items-center">
          <Button
            variant="destructive"
            className="!py-5 !px-6 rounded-full hover:scale-110 transition shadow-lg"
            onClick={handleRoute}
          >
            <PencilLine />
            나만의 토픽 작성
          </Button>

          {/* ✅ AppDraftsDialog가 빨간 점을 직접 관리함 */}
          <AppDraftsDialog>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full w-10 h-10 p-0 border-2 border-zinc-700 bg-zinc-800"
            >
              <NotebookPen className="w-6 h-6" />
            </Button>
          </AppDraftsDialog>
        </div>

        <header className="flex flex-col gap-1 justify-center items-center">
          <div className="flex items-center gap-4">
            <img src="/assets/gifs/gif-002.gif" className="w-14 h-14" alt="insight-gif" />
            <h1 className="text-2xl md:text-3xl font-semibold text-center mt-4">
              지식과 인사이트를 모아, <br />
              토픽으로 깊이 있게 나누세요!
            </h1>
          </div>
        </header>

        <div className="flex justify-center w-full mb-10 px-2">
          <div className="relative w-full max-w-2xl">
            <div className="flex items-center rounded-full border border-zinc-700 bg-black overflow-hidden focus-within:ring-2 focus-within:ring-zinc-500">
              <Search className="ml-5 text-zinc-400 shrink-0" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="토픽 제목 또는 내용을 입력하세요."
                className="flex-1 h-14 border-none text-zinc-100 focus-visible:ring-0"
              />
              <Button
                onClick={handleSearch}
                className="h-14 bg-zinc-800 hover:bg-zinc-700 text-white rounded-none px-6 shrink-0"
              >
                검색
              </Button>
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col gap-6">
          <div className="flex w-full justify-end px-2">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5 items-center">
                <Funnel size={15} className="text-zinc-400" />
                <p className="text-xs text-zinc-400">정렬 기준</p>
              </div>
              <Select
                value={sortOption}
                onValueChange={(v) => {
                  setSortOption(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-40 border-zinc-700">
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

          {isLoading ? (
            <p className="text-center text-muted-foreground mt-10">불러오는 중입니다...</p>
          ) : topics.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
              {topics.map((topic) => (
                <TopicCard key={topic.id} props={topic} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground mt-10">
              {searchQuery
                ? `"${searchQuery}"에 대한 검색 결과가 없습니다.`
                : '조회 가능한 토픽이 없습니다.'}
            </p>
          )}
        </div>

        {totalPages > 1 && (
          <Pagination className="mb-20">
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
