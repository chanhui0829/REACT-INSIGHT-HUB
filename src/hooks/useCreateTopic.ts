/**
 * @file useCreateTopic.ts
 * @description 토픽 생성/수정 훅입니다.
 * TanStack Query를 사용하여 토픽 저장 및 발행을 관리합니다.
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/querykey.constant';
import { insertTopic, updateTopic } from '@/app/actions/topicActions';
import { uploadThumbnail } from '@/services/clientService';
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

      // [Fix] insertTopic/updateTopic 서버 액션이 내부에서 이미 revalidateTag('posts')를
      // 호출해 캐시를 무효화하므로, 여기서 /api/revalidate를 한 번 더 호출하는 건 같은
      // 무효화를 중복 수행하는 것이었음. 게다가 그 호출에 쓰던 인증 시크릿이
      // NEXT_PUBLIC_ 접두사로 클라이언트 번들에 노출되어 있어 검증 의미가 없었음
      // (누구나 devtools로 꺼내 /api/revalidate를 직접 호출 가능) — 중복 호출을 제거한다.
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
