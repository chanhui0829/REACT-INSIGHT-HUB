/**
 * @file querykey.constant.ts
 * @description TanStack Query의 쿼리 키를 관리하는 상수입니다.
 */

export const QUERY_KEYS = {
  topics: {
    all: ['topics'] as const,
    list: (filters: { category: string; searchQuery: string; sortOption: string; currentPage: number }) => 
      ['topics', 'list', filters] as const,
    detail: (id: number) => ['topics', 'detail', id] as const,
  },
  likes: {
    list: (topicId: number) => ['likes', topicId] as const,
  },
  drafts: (userId: string | undefined) => ['drafts', userId] as const,
  comments: {
    list: (topicId: number) => ['comments', topicId] as const,
    count: (topicId: number) => ['comments', 'count', topicId] as const,
  },
  user: {
    me: ['user', 'me'] as const,
  },
} as const;
