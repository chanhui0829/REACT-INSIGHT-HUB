/**
 * @file useTopic.ts
 * @description 토픽 관련 훅입니다.
 * TanStack Query를 사용하여 토픽 데이터를 관리합니다.
 */

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useCallback } from 'react';

import { QUERY_KEYS } from '@/constants/querykey.constant';

import { fetchTopicById, fetchTopicLikes, fetchTopics } from '@/services/topicService';

import { increaseViews, toggleLike, deleteTopic } from '@/app/actions/topicActions';

import type { Topic } from '@/types/topic.type';

import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

import type { TopicLikeRow } from '@/services/realtimeService';

// 좋아요 데이터 타입
type TopicLike = {
  user_id: string;
};

// 토픽 필터 타입
type Filters = {
  category: string;
  searchQuery: string;
  sortOption: string;
  startIndex: number;
  endIndex: number;
};

/**
 * 토픽 목록 조회
 */
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

/**
 * 다음 페이지 프리패치
 */
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

/**
 * 토픽 상세 조회
 */
export const useTopicDetail = (topicId: number) => {
  return useQuery<Topic | null>({
    queryKey: QUERY_KEYS.topics.detail(topicId),

    queryFn: () => fetchTopicById(String(topicId)),

    enabled: !!topicId,
  });
};

/**
 * 좋아요 목록 조회
 */
export const useTopicLikes = (topicId: number) => {
  return useQuery<TopicLike[]>({
    queryKey: QUERY_KEYS.likes.list(topicId),

    queryFn: () => fetchTopicLikes(topicId),

    enabled: !!topicId,

    staleTime: 1000 * 60,

    gcTime: 1000 * 60 * 5,
  });
};

/**
 * 조회수 증가
 */
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

/**
 * 좋아요 토글
 */
export const useToggleLike = (topicId: number, userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => toggleLike(topicId),

    onMutate: async () => {
      // 진행 중인 요청 취소
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.topics.detail(topicId),
      });

      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.likes.list(topicId),
      });

      // 이전 데이터 백업
      const prevTopic = queryClient.getQueryData<Topic>(QUERY_KEYS.topics.detail(topicId));

      const prevLikes = queryClient.getQueryData<TopicLike[]>(QUERY_KEYS.likes.list(topicId));

      // 현재 좋아요 상태 확인
      const isLiked = prevLikes?.some((like) => String(like.user_id) === String(userId)) ?? false;

      // 좋아요 수 즉시 반영
      if (prevTopic) {
        queryClient.setQueryData(QUERY_KEYS.topics.detail(topicId), {
          ...prevTopic,
          likes: isLiked ? prevTopic.likes - 1 : prevTopic.likes + 1,
        });
      }

      // 좋아요 목록 즉시 반영
      if (userId) {
        queryClient.setQueryData<TopicLike[]>(
          QUERY_KEYS.likes.list(topicId),

          isLiked
            ? (prevLikes ?? []).filter((like) => String(like.user_id) !== String(userId))
            : [
                ...(prevLikes ?? []),

                {
                  user_id: userId,
                },
              ]
        );
      }

      return {
        prevTopic,
        prevLikes,
      };
    },

    onError: (_err, _vars, ctx) => {
      // 실패 시 롤백
      if (ctx?.prevTopic) {
        queryClient.setQueryData(QUERY_KEYS.topics.detail(topicId), ctx.prevTopic);
      }

      if (ctx?.prevLikes) {
        queryClient.setQueryData(QUERY_KEYS.likes.list(topicId), ctx.prevLikes);
      }
    },

    onSettled: () => {
      // 서버 데이터 재동기화
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.topics.detail(topicId),
      });

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.likes.list(topicId),
      });
    },
  });
};

/**
 * 토픽 삭제
 */
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

        body: JSON.stringify({
          tag: 'posts',
        }),
      });

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.topics.all,
      });
    },
  });
};

/**
 * realtime 좋아요 핸들러
 * 현재 좋아요는 optimistic update + invalidate 방식으로 처리하기 때문에
 * UI 충돌 방지를 위해 카운트 동기화만 유지합니다.
 */
export const useTopicRealtimeHandlers = (topicId: number) => {
  const queryClient = useQueryClient();

  const patchLikes = useCallback(
    (delta: 1 | -1) => {
      queryClient.setQueryData<Topic | null>(QUERY_KEYS.topics.detail(topicId), (prev) => {
        if (!prev) {
          return prev;
        }

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

      if (!inserted?.user_id) {
        return;
      }

      patchLikes(1);
    },
    [patchLikes]
  );

  const handleLikeDelete = useCallback(
    (payload: RealtimePostgresChangesPayload<TopicLikeRow>) => {
      const deleted = payload.old as Partial<TopicLikeRow> | null;

      if (!deleted?.user_id) {
        return;
      }

      patchLikes(-1);
    },
    [patchLikes]
  );

  return {
    handleLikeInsert,
    handleLikeDelete,
  };
};
