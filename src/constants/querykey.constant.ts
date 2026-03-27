type TopicListFilters = {
  category: string;
  searchQuery: string;
  sortOption: string;
  currentPage: number;
};

export const QUERY_KEYS = {
  topics: {
    all: ['topics'] as const,

    list: (filters: TopicListFilters) => ['topics', 'list', filters] as const,

    detail: (id: number) => ['topics', 'detail', id] as const,
  },

  likes: {
    list: (topicId: number) => ['topics', 'likes', topicId] as const,
  },

  comments: {
    list: (topicId: number) => ['topics', 'comments', topicId] as const,

    count: (topicId: number) => ['topics', 'comments', 'count', topicId] as const,
  },

  drafts: (userId: string | undefined) => ['topics', 'drafts', userId] as const,

  user: {
    me: ['user', 'me'] as const,

    profile: (id: string) => ['user', 'profile', id] as const,
  },
};
