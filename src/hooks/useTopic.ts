/**
 * @file useTopic.ts
 * @description 토픽 관련 훅입니다.
 * TanStack Query를 사용하여 토픽 데이터를 관리합니다.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { QUERY_KEYS } from '@/constants/querykey.constant';
import {
  fetchTopicById,
  fetchTopicLikes,
  fetchTopics,
  increaseViews,
  toggleLike,
  deleteTopic,
} from '@/services/topicService';
import type { Topic } from '@/types/topic.type';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { TopicLikeRow } from '@/services/realtimeService';

type TopicLike = {
  user_id: string;
};

type Filters = {
  category: string;
  searchQuery: string;
  sortOption: string;
  startIndex: number;
  endIndex: number;
};

export const useTopicList = (filters: Filters, currentPage: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.topics.list({
      category: filters.category,
      searchQuery: filters.searchQuery,
      sortOption: filters.sortOption,
      currentPage,
    }),
    queryFn: () => fetchTopics(filters),
    staleTime: 1000 * 60 * 5,
    placeholderData: (prev) => prev,
  });
};

export const usePrefetchTopics = (filters: Filters, currentPage: number) => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.topics.list({
        category: filters.category,
        searchQuery: filters.searchQuery,
        sortOption: filters.sortOption,
        currentPage: currentPage + 1,
      }),
      queryFn: () =>
        fetchTopics({
          ...filters,
          startIndex: currentPage * 8,
          endIndex: currentPage * 8 + 7,
        }),
    });
  };
};

export const useTopicDetail = (topicId: number) => {
  return useQuery<Topic | null>({
    queryKey: QUERY_KEYS.topics.detail(topicId),
    queryFn: () => fetchTopicById(String(topicId)),
    enabled: !!topicId,
  });
};

export const useTopicLikes = (topicId: number) => {
  return useQuery<TopicLike[]>({
    queryKey: QUERY_KEYS.likes.list(topicId),
    queryFn: () => fetchTopicLikes(topicId),
    enabled: !!topicId,
  });
};

export const useIncreaseViews = (topicId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => increaseViews(topicId),

    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.topics.detail(topicId),
      });

      const prev = queryClient.getQueryData<Topic | null>(QUERY_KEYS.topics.detail(topicId));

      if (prev) {
        queryClient.setQueryData(QUERY_KEYS.topics.detail(topicId), {
          ...prev,
          views: prev.views + 1,
        });
      }

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(QUERY_KEYS.topics.detail(topicId), ctx.prev);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.topics.detail(topicId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.topics.all,
      });
    },
  });
};

export const useToggleLike = (topicId: number, userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => toggleLike(topicId),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.topics.detail(topicId) });

      const prevTopic = queryClient.getQueryData<Topic>(QUERY_KEYS.topics.detail(topicId));
      const prevLikes = queryClient.getQueryData<TopicLike[]>(QUERY_KEYS.likes.list(topicId));
      const isLiked = prevLikes?.some((l) => l.user_id === userId);

      // 상세 페이지 캐시 업데이트
      if (prevTopic) {
        queryClient.setQueryData(QUERY_KEYS.topics.detail(topicId), {
          ...prevTopic,
          likes: isLiked ? prevTopic.likes - 1 : prevTopic.likes + 1,
        });
      }

      // 목록 캐시도 업데이트 (모든 topics 목록 쿼리에서 해당 id 찾아 업데이트)
      queryClient.setQueriesData({ queryKey: QUERY_KEYS.topics.all }, (old: any) => {
        if (!old?.topics) return old;
        return {
          ...old,
          topics: old.topics.map((t: Topic) =>
            t.id === topicId ? { ...t, likes: isLiked ? t.likes - 1 : t.likes + 1 } : t
          ),
        };
      });

      if (prevLikes && userId) {
        queryClient.setQueryData(
          QUERY_KEYS.likes.list(topicId),
          isLiked
            ? prevLikes.filter((l) => l.user_id !== userId)
            : [...prevLikes, { user_id: userId }]
        );
      }

      return { prevTopic, prevLikes };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prevTopic) {
        queryClient.setQueryData(QUERY_KEYS.topics.detail(topicId), ctx.prevTopic);
      }
      if (ctx?.prevLikes) {
        queryClient.setQueryData(QUERY_KEYS.likes.list(topicId), ctx.prevLikes);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.topics.detail(topicId),
      });
    },
  });
};

export const useDeleteTopic = (topicId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => deleteTopic(topicId),
    onSuccess: async () => {
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_REVALIDATION_SECRET}`,
        },
        body: JSON.stringify({ tag: 'posts' }),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.topics.all });
    },
  });
};

export const useTopicRealtimeHandlers = (topicId: number) => {
  const queryClient = useQueryClient();

  const patchLikes = useCallback(
    (delta: 1 | -1) => {
      queryClient.setQueryData<Topic | null>(QUERY_KEYS.topics.detail(topicId), (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          likes: Math.max(0, prev.likes + delta),
        };
      });
    },
    [queryClient, topicId]
  );

  const handleLikeInsert = useCallback(
    (payload: RealtimePostgresChangesPayload<TopicLikeRow>) => {
      const inserted = payload.new as TopicLikeRow | null;
      const userId = inserted?.user_id;
      if (!userId) return;

      patchLikes(1);
      queryClient.setQueryData<TopicLike[]>(QUERY_KEYS.likes.list(topicId), (prev = []) => {
        if (prev.some((like) => like.user_id === userId)) return prev;
        return [...prev, { user_id: userId }];
      });
    },
    [patchLikes, queryClient, topicId]
  );

  const handleLikeDelete = useCallback(
    (payload: RealtimePostgresChangesPayload<TopicLikeRow>) => {
      const deleted = payload.old as Partial<TopicLikeRow> | null;
      const userId = deleted?.user_id;
      if (!userId) return;

      patchLikes(-1);
      queryClient.setQueryData<TopicLike[]>(QUERY_KEYS.likes.list(topicId), (prev = []) =>
        prev.filter((like) => like.user_id !== userId)
      );
    },
    [patchLikes, queryClient, topicId]
  );

  return { handleLikeInsert, handleLikeDelete };
};
