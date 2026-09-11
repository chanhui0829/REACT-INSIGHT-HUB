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

    // [Fix] "좋아요를 누르면 하트가 잠깐 채워졌다가 몇 초 뒤 다시 비워짐 / 연속으로
    // 누르면 34→35→36(반대 방향)→34로 튐" 버그의 원인.
    // - 하트 채움 여부(isLiked)는 likes.list 캐시에서 계산되는데, onMutate가 이미
    //   본인의 좋아요를 정확히 add/remove로 반영해둔 상태임 — RPC(toggle_topic_like)는
    //   서버가 실제 DB 행 존재 여부로 토글하므로 이 낙관적 반영은 항상 정답임.
    // - 그런데 바로 다음 줄의 likes.list invalidate가 fetchTopicLikes()를 다시 실행시켜
    //   방금 낙관적으로 넣은 본인 행을 "서버에서 다시 읽어온 값"으로 덮어씀. 이 재조회가
    //   (fetchTopicLikes가 세션 없는 익명 supabase 클라이언트를 쓰고 있어 RLS 등의 영향을
    //   받을 수 있음) 본인 행을 누락한 채로 돌아오면 isLiked가 다시 false로 리셋됨 →
    //   하트가 꺼짐. 그 상태에서 또 클릭하면 isLiked=false로 잘못 계산돼 "취소" 대신
    //   "추가"를 한 번 더 낙관적으로 반영(34→35에서 다시 +1 → 36)하는 반대 방향 버그가
    //   발생 — 실제 서버는 진짜 DB 상태를 보고 정확히 토글하므로 이후 count invalidate로
    //   34로 정정되며 "36에서 잠깐 멈췄다 34로 돌아가는" 현상으로 보였던 것.
    // - likes.list는 오직 이 mutation의 onMutate/onError만 건드리므로(다른 곳에서 절대
    //   수정 안 함) invalidate로 재조회할 필요가 없음 — 실패 시엔 onError가 이미 정확히
    //   롤백함. count(topics.detail)만 서버 값으로 재동기화하면 충분하고, count는 실제로도
    //   항상 정확한 값으로 정착했으므로 그대로 둔다.
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.topics.detail(topicId),
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

    // [Fix] 서버 액션 deleteTopic()이 이미 내부에서 revalidateTag('posts')를 호출해
    // Next.js 캐시를 무효화함 — 클라이언트에서 /api/revalidate를 한 번 더 호출하는 건
    // 완전히 같은 일을 중복 수행할 뿐이었음. 게다가 이 호출에 쓰던 인증 시크릿이
    // NEXT_PUBLIC_ 접두사로 클라이언트 번들에 그대로 노출되어 있어서(누구나 devtools로
    // 꺼내 /api/revalidate를 직접 호출 가능), 시크릿 검증 자체가 사실상 의미가 없었음.
    // 서버 액션의 revalidateTag만으로 캐시 무효화는 충분하므로 중복 호출을 제거한다.
    onSuccess: async () => {
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
 *
 * [Fix] Realtime의 postgres_changes 구독은 이벤트를 발생시킨 당사자에게도 그대로
 * 브로드캐스트된다(자기 자신을 걸러주지 않음). 그런데 본인이 좋아요를 누른 경우엔
 * 이미 useToggleLike의 onMutate가 낙관적으로 +1/-1을 반영해둔 상태라, 그 직후 도착하는
 * 본인 이벤트에 여기서 또 patchLikes를 호출하면 이중 카운트가 됨(다중 탭에서는 탭마다
 * 다른 값으로 어긋날 수도 있음). currentUserId와 payload의 user_id를 비교해 본인이
 * 발생시킨 이벤트는 조기 리턴하고, 다른 사용자가 발생시킨 이벤트만 반영한다 — 어차피
 * 본인 쪽은 onSettled의 invalidateQueries가 최종적으로 서버 정확값을 다시 맞춰준다.
 */
export const useTopicRealtimeHandlers = (topicId: number, currentUserId?: string) => {
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

      // 본인이 발생시킨 이벤트는 이미 낙관적 업데이트로 반영되어 있으므로 무시
      if (currentUserId && String(inserted.user_id) === String(currentUserId)) {
        return;
      }

      patchLikes(1);
    },
    [patchLikes, currentUserId]
  );

  const handleLikeDelete = useCallback(
    (payload: RealtimePostgresChangesPayload<TopicLikeRow>) => {
      const deleted = payload.old as Partial<TopicLikeRow> | null;

      if (!deleted?.user_id) {
        return;
      }

      // 본인이 발생시킨 이벤트는 이미 낙관적 업데이트로 반영되어 있으므로 무시
      if (currentUserId && String(deleted.user_id) === String(currentUserId)) {
        return;
      }

      patchLikes(-1);
    },
    [patchLikes, currentUserId]
  );

  return {
    handleLikeInsert,
    handleLikeDelete,
  };
};
