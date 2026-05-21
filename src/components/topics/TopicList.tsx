/**
 * @file TopicList.tsx
 * @description 토픽 목록 컴포넌트입니다.
 * 무한 스크롤 기능을 구현합니다.
 */

'use client';

import { useMemo, useEffect, useState, useRef, useTransition, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { TopicCard } from '@/components/topics';
import { getUserNicknames } from '@/services/useService';
import { fetchTopics } from '@/services/topicService';
import type { Topic } from '@/types/topic.type';

const ITEMS_PER_PAGE = 12;
const MAX_DISPLAYED_ITEMS = 60;

interface Props {
  initialTopics: Topic[];
  initialTotal: number;
  category: string;
  searchQuery: string;
  sortOption: string;
}

export function TopicList({
  initialTopics,
  initialTotal,
  category,
  searchQuery,
  sortOption,
}: Props) {
  // 인피니트 스크롤 상태
  const [displayedTopics, setDisplayedTopics] = useState<Topic[]>(initialTopics);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialTotal > ITEMS_PER_PAGE);
  const loaderRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();

  // 페이지당 아이템 수 및 데이터 범위
  const { startIndex, endIndex } = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return { startIndex: start, endIndex: start + ITEMS_PER_PAGE - 1 };
  }, [page]);

  // 데이터 fetching
  const { data, isFetching } = useQuery({
    queryKey: ['topics', category, searchQuery, sortOption, startIndex, endIndex],
    queryFn: () =>
      fetchTopics({
        category,
        searchQuery,
        sortOption,
        startIndex,
        endIndex,
      }),
    enabled: page > 1,
    staleTime: 1000 * 60 * 5,
  });

  // 새 데이터 로드 시 displayedTopics에 추가
  useEffect(() => {
    if (data?.topics) {
      startTransition(() => {
        setDisplayedTopics((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const uniqueNewTopics = data.topics.filter((t) => !existingIds.has(t.id));

          const newTopics = page === 1 ? data.topics : [...prev, ...uniqueNewTopics];

          return newTopics.length > MAX_DISPLAYED_ITEMS
            ? newTopics.slice(-MAX_DISPLAYED_ITEMS)
            : newTopics;
        });
        setHasMore(page * ITEMS_PER_PAGE < (data?.total ?? 0));
      });
    }
  }, [data, page]);

  // 필터 변경 시 페이지 초기화
  useEffect(() => {
    setPage(1);
    setDisplayedTopics(initialTopics);
    setHasMore(initialTotal > ITEMS_PER_PAGE);
  }, [category, searchQuery, sortOption, initialTopics, initialTotal]);

  // 인피니트 스크롤을 위한 Intersection Observer
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasMore && !isFetching) {
        setPage((prev) => prev + 1);
      }
    },
    [hasMore, isFetching]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersect, { threshold: 0.5 });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [handleIntersect]);

  const authorIds = useMemo(() => {
    const ids = displayedTopics.map((topic) => topic.author);
    return [...new Set(ids)];
  }, [displayedTopics]);

  const { data: nicknameMap = {} } = useQuery({
    queryKey: ['user', 'nicknames', [...authorIds].sort().join(',')],
    queryFn: () => getUserNicknames(authorIds),
    enabled: authorIds.length > 0,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
  });

  return (
    <div className="min-h-[600px]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {displayedTopics.map((topic) => (
          <TopicCard key={topic.id} topic={topic} authorNickname={nicknameMap[topic.author]} />
        ))}
      </div>

      {/* Infinite scroll loader */}
      {hasMore && (
        <div ref={loaderRef} className="py-8 flex justify-center">
          {(isFetching || isPending) && (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-xs font-bold uppercase tracking-wider">Loading more...</span>
            </div>
          )}
        </div>
      )}
      {!hasMore && <div className="py-8" />}
    </div>
  );
}
