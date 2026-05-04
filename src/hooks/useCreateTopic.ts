import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/querykey.constant';
import { insertTopic, updateTopic, uploadThumbnail } from '@/services/topicService';
import type { Topic } from '@/types/topic.type';
import { TOPIC_STATUS } from '@/types/topic.type';

type BuildPayload = (
  status: Topic['status'],
  thumbnailUrl: string | null
) => Omit<Topic, 'id' | 'created_at' | 'author' | 'views' | 'likes'>;

type Payload = {
  id?: number | string;
  userId: string;
  buildPayload: BuildPayload;
  thumbnail: File | string | null;
};

export const useSaveTopic = () => {
  const queryClient = useQueryClient();

  return useMutation<{ id: number | string }, Error, Payload>({
    mutationFn: async (data) => {
      const { id, userId, buildPayload, thumbnail } = data;
      const thumbnailUrl = await uploadThumbnail(thumbnail);
      const payload = buildPayload(TOPIC_STATUS.TEMP, thumbnailUrl);

      if (!id) {
        // 새 글 저장
        const result = await insertTopic(userId, payload);
        // Supabase insert는 보통 배열로 데이터를 주거나 id를 포함한 객체를 줍니다.
        // 만약 result가 숫자라면 객체로 감싸서 반환하세요.
        return typeof result === 'object' ? result : { id: result };
      } else {
        // 기존 글 수정
        await updateTopic(id as string, payload);
        return { id }; // 이미 id를 알고 있으니 그대로 반환
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.drafts(variables.userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.topics.all });
    },
  });
};

// 🔹 발행
export const usePublishTopic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId, buildPayload, thumbnail }: Payload) => {
      const thumbnailUrl = await uploadThumbnail(thumbnail);
      const payload = buildPayload(TOPIC_STATUS.PUBLISH, thumbnailUrl);

      if (!id) {
        await insertTopic(userId, payload);
      } else {
        await updateTopic(id as string, payload);
      }
    },

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.drafts(variables.userId),
      });

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.topics.all,
      });
    },
  });
};
