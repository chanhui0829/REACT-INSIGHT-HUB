/**
 * @file topicActions.ts
 * 토픽 생성, 수정, 삭제 및 좋아요/조회수 처리를 담당하는 서버 액션
 * CUD 작업은 여기서만 처리하고, 캐시 무효화도 함께 진행
 */
'use server';

import { createServerSupabaseClient } from '@/lib/supabase';
import { revalidateTag } from 'next/cache';
import { TopicInsertWithoutAuthor } from '@/types/topic.type';

export const insertTopic = async (userId: string, payload: TopicInsertWithoutAuthor) => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from('topic')
    .insert([{ ...payload, author: userId }])
    .select('id')
    .single();

  if (error) throw error;

  // 토픽 발행 후 캐시 즉시 무효화
  revalidateTag('posts');
  return data.id;
};

export const updateTopic = async (id: string, payload: TopicInsertWithoutAuthor) => {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('topic').update(payload).eq('id', id);
  if (error) throw error;

  // 수정 후 캐시 즉시 무효화
  revalidateTag('posts');
};

export const deleteTopic = async (id: number) => {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('topic').delete().eq('id', id);
  if (error) throw error;

  // 삭제 후 캐시 즉시 무효화
  revalidateTag('posts');
};

export const increaseViews = async (topicId: number) => {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc('increment_topic_views', { topic_id: topicId });
  if (error) throw error;
};

export const toggleLike = async (topicId: number) => {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.rpc('toggle_topic_like', { p_topic_id: topicId });
  if (error) throw error;
  revalidateTag('posts');
};
