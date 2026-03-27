import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/querykey.constant';
import { insertTopic, updateTopic, uploadThumbnail } from '@/services/topic.service';
import type { Topic } from '@/types/topic.type';
import { TOPIC_STATUS } from '@/types/topic.type';

type BuildPayload = (
  status: Topic['status'],
  thumbnailUrl: string | null
) => Omit<Topic, 'id' | 'created_at' | 'author' | 'views' | 'likes'>;

type Payload = {
  id?: string;
  userId: string;
  buildPayload: BuildPayload;
  thumbnail: File | string | null;
};

// 🔹 저장
export const useSaveTopic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId, buildPayload, thumbnail }: Payload) => {
      const thumbnailUrl = await uploadThumbnail(thumbnail);
      const payload = buildPayload(TOPIC_STATUS.TEMP, thumbnailUrl);

      if (!id) {
        await insertTopic(userId, payload);
      } else {
        await updateTopic(id, payload);
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
        await updateTopic(id, payload);
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
