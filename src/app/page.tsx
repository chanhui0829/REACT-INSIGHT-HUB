/**
 * @file page.tsx
 * @description 메인 대시보드 페이지입니다.
 */

import { Sparkles, Search, NotebookPen, PencilLine } from 'lucide-react';
import Link from 'next/link';
import { getCachedTopics } from '@/services/topicService';
import { TopicList } from '@/components/topics';
import { AppDraftsDialog } from '@/components/common';
import { Button, Input } from '@/components/ui';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    q?: string;
  }>;
}) {
  const params = await searchParams;
  const category = params.category === 'all' || !params.category ? 'all' : params.category;
  const sortOption = params.sort ?? 'latest';
  const searchQuery = params.q ?? '';

  const { topics, total } = await getCachedTopics({
    category,
    searchQuery,
    sortOption,
    startIndex: 0,
    endIndex: 11,
  });

  return (
    <main className="w-full flex flex-col items-start mt-28 px-4 md:px-6 max-w-[1400px] mx-auto mb-32">
      {/* ... 기존 로직 그대로 ... */}
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
        </header>

        <div className="w-full flex flex-col gap-8">
          <div className="relative group w-full max-w-2xl mx-auto">
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
        </div>

        {topics.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-slate-400">검색 결과가 없습니다.</p>
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
