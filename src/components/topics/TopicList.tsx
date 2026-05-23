/**
 * @file TopicList.tsx
 * @description 토픽 목록을 무한 스크롤로 렌더링하는 컴포넌트입니다.
 */

'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TopicCard } from '@/components/topics';
import { fetchTopics } from '@/services/topicService';
import type { Topic } from '@/types/topic.type';

const ITEMS_PER_PAGE = 12;

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
  const [page, setPage] = useState(1);
  const [allTopics, setAllTopics] = useState<Topic[]>(initialTopics); // 상태로 관리
  const [hasMore, setHasMore] = useState(true); // 더 가져올 데이터가 있는지 판단
  const loaderRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // 1. 카테고리나 정렬이 바뀌면 페이지와 목록 초기화
  useEffect(() => {
    setPage(1);
    setAllTopics(initialTopics);
    setHasMore(initialTotal > initialTopics.length);
  }, [category, searchQuery, sortOption, initialTopics, initialTotal]);

  // 2. 2페이지 이상 데이터 받아오기
  const { data, isFetching } = useQuery({
    queryKey: ['topics', category, searchQuery, sortOption, page],
    queryFn: () =>
      fetchTopics({
        category,
        searchQuery,
        sortOption,
        startIndex: (page - 1) * ITEMS_PER_PAGE,
        endIndex: page * ITEMS_PER_PAGE - 1,
      }),
    enabled: page > 1 && hasMore, // 데이터가 있을 때만 요청
  });

  // 3. 페이지 바뀔 때마다 데이터 누적
  useEffect(() => {
    if (data?.topics) {
      setAllTopics((prev) => [...prev, ...data.topics]);
      // 받아온 데이터가 페이지 사이즈보다 작으면 마지막 페이지로 간주
      if (data.topics.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }
    }
  }, [data?.topics]);

  // 4. 무한 스크롤 감지
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetching && hasMore) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [isFetching, hasMore]);

  return (
    <div className="min-h-[600px]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {allTopics.map((topic, index) => (
          <TopicCard key={`${topic.id}-${index}`} topic={topic} />
        ))}
      </div>

      {hasMore && (
        <div ref={loaderRef} className="h-20 flex items-center justify-center mt-10">
          {isFetching && <div className="text-zinc-500 font-bold animate-pulse">로딩 중...</div>}
        </div>
      )}
    </div>
  );
}
