/**
 * @file useComment.ts
 * @description 댓글 관련 훅입니다.
 * TanStack Query를 사용하여 댓글 데이터를 관리합니다.
 */

'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { QUERY_KEYS } from '@/constants/querykey.constant';
import {
  fetchComments,
  fetchCommentsCount,
  fetchCommentById,
  type CommentItem,
} from '@/services/commentService';
import { addComment, deleteComment } from '@/app/actions/commentActions';
import type { InfiniteData } from '@tanstack/react-query';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { TopicCommentRow } from '@/services/realtimeService';

type CommentPage = {
  comments: CommentItem[];
  nextOffset: number | null;
};

const upsertCommentToPages = (
  prev: InfiniteData<CommentPage> | undefined,
  comment: CommentItem
): InfiniteData<CommentPage> | undefined => {
  if (!prev) return prev;

  const exists = prev.pages.some((page) => page.comments.some((item) => item.id === comment.id));
  if (exists) return prev;

  return {
    ...prev,
    pages: prev.pages.map((page, index) =>
      index === 0
        ? {
            ...page,
            comments: [comment, ...page.comments].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            ),
          }
        : page
    ),
  };
};

const removeCommentFromPages = (
  prev: InfiniteData<CommentPage> | undefined,
  commentId: number
): InfiniteData<CommentPage> | undefined => {
  if (!prev) return prev;

  return {
    ...prev,
    pages: prev.pages.map((page) => ({
      ...page,
      comments: page.comments.filter((item) => item.id !== commentId),
    })),
  };
};

// 댓글 목록 (infinite)
export const useComments = (topicId: number) => {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.comments.list(topicId),
    queryFn: async ({ pageParam }) => {
      const from = pageParam;
      const to = from + 5;

      const comments = await fetchComments(topicId, from, to);

      return {
        comments,
        nextOffset: comments.length === 6 ? to + 1 : null,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
    initialPageParam: 0,
    staleTime: 0,
  });
};

// 댓글 개수
export const useCommentsCount = (topicId: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.comments.count(topicId),
    queryFn: () => fetchCommentsCount(topicId),
    staleTime: 2000,
  });
};

// 댓글 작성
export const useAddComment = (topicId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (text: string) => addComment(topicId, text),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.comments.list(topicId),
      });
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.comments.count(topicId),
      });

      const previousList = queryClient.getQueryData<InfiniteData<CommentPage>>(
        QUERY_KEYS.comments.list(topicId)
      );
      const previousCount = queryClient.getQueryData<number>(QUERY_KEYS.comments.count(topicId));

      if (typeof previousCount === 'number') {
        queryClient.setQueryData(QUERY_KEYS.comments.count(topicId), previousCount + 1);
      }

      return { previousList, previousCount };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(QUERY_KEYS.comments.list(topicId), context.previousList);
      }
      if (typeof context?.previousCount === 'number') {
        queryClient.setQueryData(QUERY_KEYS.comments.count(topicId), context.previousCount);
      }
    },
    onSuccess: (createdComment) => {
      queryClient.setQueryData<InfiniteData<CommentPage> | undefined>(
        QUERY_KEYS.comments.list(topicId),
        (prev) => upsertCommentToPages(prev, createdComment as CommentItem)
      );
    },

    // [Fix] useComments는 offset 기반(from/to range) useInfiniteQuery라, 여기서
    // comments.list를 invalidate하면 이미 로드된 모든 페이지를 "원래의 고정 offset"으로
    // 그대로 재요청함. 그런데 방금 onSuccess에서 새 댓글을 1페이지 맨 앞에 직접
    // 삽입해서(또는 realtime의 handleCommentInsert가 동일하게) 목록이 이미 한 칸씩
    // 밀린 상태 — 같은 offset으로 다시 조회하면 페이지 경계에서 항목이 중복되거나
    // 누락되는 전형적인 offset-pagination 문제가 있었음. list 캐시는 이미 위
    // upsertCommentToPages(성공 시) / realtime 구독(다른 사용자 작성분)으로 정확하게
    // 유지되므로 list invalidate는 불필요 + 유해함 — 제거하고 count만 서버 값으로 재동기화.
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.comments.count(topicId),
      });
    },
  });
};

// 댓글 삭제
export const useDeleteComment = (topicId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: number) => deleteComment(commentId, topicId),
    onMutate: async (commentId) => {
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.comments.list(topicId),
      });
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.comments.count(topicId),
      });

      const previousList = queryClient.getQueryData<InfiniteData<CommentPage>>(
        QUERY_KEYS.comments.list(topicId)
      );
      const previousCount = queryClient.getQueryData<number>(QUERY_KEYS.comments.count(topicId));

      queryClient.setQueryData<InfiniteData<CommentPage> | undefined>(
        QUERY_KEYS.comments.list(topicId),
        (prev) => removeCommentFromPages(prev, commentId)
      );

      if (typeof previousCount === 'number') {
        queryClient.setQueryData(
          QUERY_KEYS.comments.count(topicId),
          Math.max(0, previousCount - 1)
        );
      }

      return { previousList, previousCount };
    },
    onError: (_error, _commentId, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(QUERY_KEYS.comments.list(topicId), context.previousList);
      }
      if (typeof context?.previousCount === 'number') {
        queryClient.setQueryData(QUERY_KEYS.comments.count(topicId), context.previousCount);
      }
    },

    // [Fix] useAddComment와 동일한 이유로 list invalidate를 제거함 — onMutate에서 이미
    // removeCommentFromPages로 해당 댓글을 낙관적으로 제거했고, 실패 시엔 onError가
    // previousList로 정확히 롤백하므로 list를 다시 고정 offset으로 재조회할 필요가 없음
    // (offset 페이지네이션 상태에서 invalidate하면 경계에서 항목이 중복/누락될 수 있었음).
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.comments.count(topicId),
      });
    },
  });
};

export const useCommentRealtimeHandlers = (topicId: number) => {
  const queryClient = useQueryClient();

  const handleCommentInsert = useCallback(
    async (payload: RealtimePostgresChangesPayload<TopicCommentRow>) => {
      const inserted = payload.new as TopicCommentRow | null;
      const insertedId = inserted?.id;
      if (!insertedId) return;

      const comment = await fetchCommentById(insertedId);
      if (!comment) return;

      queryClient.setQueryData<InfiniteData<CommentPage> | undefined>(
        QUERY_KEYS.comments.list(topicId),
        (prev) => upsertCommentToPages(prev, comment)
      );
      queryClient.setQueryData<number | undefined>(QUERY_KEYS.comments.count(topicId), (prev) =>
        typeof prev === 'number' ? prev + 1 : prev
      );
    },
    [queryClient, topicId]
  );

  const handleCommentDelete = useCallback(
    (payload: RealtimePostgresChangesPayload<TopicCommentRow>) => {
      const deleted = payload.old as Partial<TopicCommentRow> | null;
      const deletedId = deleted?.id;
      if (!deletedId) return;

      queryClient.setQueryData<InfiniteData<CommentPage> | undefined>(
        QUERY_KEYS.comments.list(topicId),
        (prev) => removeCommentFromPages(prev, deletedId)
      );
      queryClient.setQueryData<number | undefined>(QUERY_KEYS.comments.count(topicId), (prev) =>
        typeof prev === 'number' ? Math.max(0, prev - 1) : prev
      );
    },
    [queryClient, topicId]
  );

  return { handleCommentInsert, handleCommentDelete };
};
