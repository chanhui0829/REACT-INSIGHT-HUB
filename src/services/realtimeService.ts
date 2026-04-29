import type { RealtimePostgresChangesPayload, RealtimeChannel } from '@supabase/supabase-js';
import supabase from '@/lib/supabase';

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
  const channel = supabase.channel(`topic:${topicId}:realtime`);

  channel
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'comment', filter: `topic_id=eq.${topicId}` },
      (payload) => handlers.onCommentInsert?.(payload as RealtimePostgresChangesPayload<TopicCommentRow>)
    )
    .on(
      'postgres_changes',
      { event: 'DELETE', schema: 'public', table: 'comment', filter: `topic_id=eq.${topicId}` },
      (payload) => handlers.onCommentDelete?.(payload as RealtimePostgresChangesPayload<TopicCommentRow>)
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'topic_likes',
        filter: `topic_id=eq.${topicId}`,
      },
      (payload) => handlers.onLikeInsert?.(payload as RealtimePostgresChangesPayload<TopicLikeRow>)
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'topic_likes',
        filter: `topic_id=eq.${topicId}`,
      },
      (payload) => handlers.onLikeDelete?.(payload as RealtimePostgresChangesPayload<TopicLikeRow>)
    )
    .subscribe();

  return channel;
};
