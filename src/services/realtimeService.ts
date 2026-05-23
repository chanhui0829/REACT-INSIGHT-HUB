/**
 * @file realtimeService.ts
 * @description Supabase Realtime 서비스입니다.
 * 토픽의 댓글과 좋아요 실시간 업데이트를 구독합니다.
 */

import type { RealtimePostgresChangesPayload, RealtimeChannel } from '@supabase/supabase-js';
import { createClientComponentClient } from '@/lib/supabase';

export type TopicLikeRow = {
  topic_id: number;
  user_id: string;
};

export type TopicCommentRow = {
  id: number;
  topic_id: number;
};

type TopicRealtimeHandlers = {
  onCommentInsert?: (payload: RealtimePostgresChangesPayload<TopicCommentRow>) => void;
  onCommentDelete?: (payload: RealtimePostgresChangesPayload<TopicCommentRow>) => void;
  onLikeInsert?: (payload: RealtimePostgresChangesPayload<TopicLikeRow>) => void;
  onLikeDelete?: (payload: RealtimePostgresChangesPayload<TopicLikeRow>) => void;
};

export const subscribeTopicRealtime = (
  topicId: number,
  handlers: TopicRealtimeHandlers
): RealtimeChannel => {
  const supabase = createClientComponentClient();
  const channel = supabase.channel(`topic:${topicId}:realtime`);

  channel
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'comment', filter: `topic_id=eq.${topicId}` },
      (payload: RealtimePostgresChangesPayload<TopicCommentRow>) =>
        handlers.onCommentInsert?.(payload)
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'comment', filter: `topic_id=eq.${topicId}` },
      (payload: RealtimePostgresChangesPayload<TopicCommentRow>) =>
        handlers.onCommentDelete?.(payload)
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'topic_likes',
        filter: `topic_id=eq.${topicId}`,
      },
      (payload: RealtimePostgresChangesPayload<TopicLikeRow>) => handlers.onLikeInsert?.(payload)
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'topic_likes',
        filter: `topic_id=eq.${topicId}`,
      },
      (payload: RealtimePostgresChangesPayload<TopicLikeRow>) => handlers.onLikeDelete?.(payload)
    );

  channel.subscribe();

  return channel;
};
