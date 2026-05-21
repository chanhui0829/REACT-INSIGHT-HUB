/**
 * @file useCreateTopic.ts
 * @description 토픽 생성/수정 훅입니다.
 * TanStack Query를 사용하여 토픽 저장 및 발행을 관리합니다.
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/querykey.constant';
import { insertTopic, updateTopic, uploadThumbnail } from '@/services/topicService';
import type { Topic } from '@/types/topic.type';
import { TOPIC_STATUS } from '@/types/topic.type';

type BuildPayload = (
  status: Topic['status'],
  thumbnailUrl: string | null
) => Omit<Topic, 'id' | 'created_at' | 'author' | 'views' | 'likes' | 'updated_at'>;

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
        const result = await insertTopic(userId, payload);
        return typeof result === 'object' ? result : { id: result };
      } else {
        await updateTopic(id as string, payload);
        return { id };
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.drafts(variables.userId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.topics.all });
    },
  });
};

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

      // 발행 후 서버 캐시 즉시 무효화
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_REVALIDATION_SECRET}`,
        },
        body: JSON.stringify({ tag: 'posts' }),
      });
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
