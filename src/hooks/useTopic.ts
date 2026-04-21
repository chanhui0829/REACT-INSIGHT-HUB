import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/querykey.constant';
import {
  fetchTopicById,
  fetchTopicLikes,
  fetchTopics, // ✅ 추가
  increaseViews,
  toggleLike,
  deleteTopic,
} from '@/services/topicService';
import type { Topic } from '@/types/topic.type';

// ======================================================
// 🔹 타입
// ======================================================
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

// ======================================================
// 🔹 목록 조회 (추가된 부분)
// ======================================================
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

// 🔹 다음 페이지 prefetch (추가된 부분)
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

// ======================================================
// 🔹 상세 조회
// ======================================================
export const useTopicDetail = (topicId: number) => {
  return useQuery<Topic | null>({
    queryKey: QUERY_KEYS.topics.detail(topicId),
    queryFn: () => fetchTopicById(String(topicId)),
    enabled: !!topicId,
  });
};

// ======================================================
// 🔹 좋아요 목록
// ======================================================
export const useTopicLikes = (topicId: number) => {
  return useQuery<TopicLike[]>({
    queryKey: QUERY_KEYS.likes.list(topicId),
    queryFn: () => fetchTopicLikes(topicId),
    enabled: !!topicId,
  });
};

// ======================================================
// 🔹 조회수 증가
// ======================================================
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

// ======================================================
// 🔹 좋아요 토글
// ======================================================
export const useToggleLike = (topicId: number, userId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => toggleLike(topicId),

    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.topics.detail(topicId),
      });

      const prevTopic = queryClient.getQueryData<Topic>(QUERY_KEYS.topics.detail(topicId));

      const prevLikes = queryClient.getQueryData<TopicLike[]>(QUERY_KEYS.likes.list(topicId));

      const isLiked = prevLikes?.some((l) => l.user_id === userId);

      if (prevTopic) {
        queryClient.setQueryData(QUERY_KEYS.topics.detail(topicId), {
          ...prevTopic,
          likes: isLiked ? prevTopic.likes - 1 : prevTopic.likes + 1,
        });
      }

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

// ======================================================
// 🔹 삭제
// ======================================================
export const useDeleteTopic = (topicId: number) => {
  return useMutation({
    mutationFn: () => deleteTopic(topicId),
  });
};
