import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/querykey.constant';
import {
  fetchComments,
  addComment,
  deleteComment,
  fetchCommentsCount,
} from '@/services/commentService';

// 🔹 댓글 목록 (infinite)
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

// 🔹 댓글 개수
export const useCommentsCount = (topicId: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.comments.count(topicId),
    queryFn: () => fetchCommentsCount(topicId),
    staleTime: 2000,
  });
};

// 🔹 댓글 작성
export const useAddComment = (topicId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (text: string) => addComment(topicId, text),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.comments.list(topicId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.comments.count(topicId),
      });
    },
  });
};

// 🔹 댓글 삭제
export const useDeleteComment = (topicId: number) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: number) => deleteComment(commentId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.comments.list(topicId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.comments.count(topicId),
      });
    },
  });
};
