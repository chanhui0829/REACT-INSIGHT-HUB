/**
 * @file page.tsx
 * @description 메인 대시보드 페이지입니다.
 * Next.js 16의 RSC(Server Component) 아키텍처를 활용하여
 * 서버 사이드에서 데이터를 가져오고 렌더링합니다.
 * 캐싱 태그 기반의 데이터 가져오기를 사용하여 성능을 최적화합니다.
 */

import { Sparkles, Search, NotebookPen, PencilLine } from 'lucide-react';
import Link from 'next/link';
import { getCachedTopics } from '@/services/topicService';
import { CLASS_CATEGORY } from '@/constants/category.constant';
import { TopicList, SortSelect } from '@/components/topics';
import { AppDraftsDialog } from '@/components/common';
import { Button, Input } from '@/components/ui';

// 메인 페이지 컴포넌트 (Server Component)
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    q?: string;
  }>;
}) {
  // URL 파라미터 추출 (Next.js 16: searchParams는 Promise)
  const params = await searchParams;
  const category = params.category === 'all' || !params.category ? 'all' : params.category;
  const sortOption = params.sort ?? 'latest';
  const searchQuery = params.q ?? '';

  // 서버 사이드에서 데이터 가져오기 (캐싱 태그 기반)
  const { topics, total } = await getCachedTopics({
    category,
    searchQuery,
    sortOption,
    startIndex: 0,
    endIndex: 11, // 첫 페이지 12개
  });

  return (
    <main className="w-full flex flex-col items-start mt-28 px-4 md:px-6 max-w-[1400px] mx-auto mb-32">
      {/* Sticky Action Group */}
      <div className="fixed left-1/2 bottom-8 -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 p-2.5 rounded-full bg-slate-950/90 backdrop-blur-md border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <Link href="/topics/create">
            <Button className="rounded-full h-11 px-6 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs uppercase tracking-widest flex gap-2 transition-all active:scale-95">
              <PencilLine size={14} />새 토픽 작성
            </Button>
          </Link>
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
        {/* Header Section */}
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

        {/* Search and Filter Section */}
        <div className="w-full flex flex-col gap-8">
          {/* Search Bar */}
          <div className="relative group w-full max-w-2xl mx-auto transition-all duration-500">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition duration-700" />
            <form className="relative flex items-center h-14 px-5 gap-3 rounded-full border border-white/10 bg-slate-900/50 backdrop-blur-2xl focus-within:border-indigo-500/40 transition-all">
              <Search className="w-5 h-5 text-slate-400" />
              <Input
                name="q"
                defaultValue={searchQuery}
                placeholder="지식과 코드를 검색하세요."
                className="flex-1 h-10 border-none! bg-transparent! text-slate-100 placeholder:text-slate-500 focus-visible:ring-0 text-sm"
              />
              <Button
                type="submit"
                className="rounded-full h-9 px-6 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold"
              >
                검색
              </Button>
            </form>
          </div>

          {/* Category Tabs */}
          <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
            <div className="flex items-center gap-2 min-w-max md:justify-center">
              {CLASS_CATEGORY.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/?category=${cat.category}&sort=${sortOption}`}
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
                </Link>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex justify-end items-center gap-3 w-full">
            <SortSelect />
          </div>
        </div>

        {/* Topics Grid */}
        {topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-slate-400 text-lg font-medium">검색 결과가 없습니다.</p>
            <p className="text-slate-500 text-sm mt-2">다른 검색어나 카테고리를 시도해보세요.</p>
          </div>
        ) : (
          <TopicList
            initialTopics={topics}
            initialTotal={total}
            category={category}
            searchQuery={searchQuery}
            sortOption={sortOption}
          />
        )}

      </section>
    </main>
  );
}
