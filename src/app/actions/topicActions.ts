/**
 * @file topicActions.ts
 * @description 서버 액션을 통해 데이터를 처리하고 캐시를 재검증합니다.
 */
'use server';

import { createServerSupabaseClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { TopicInsertWithoutAuthor } from '@/types/topic.type';

export const insertTopic = async (userId: string, payload: TopicInsertWithoutAuthor) => {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('topic')
    .insert([{ ...payload, author: userId }])
    .select('id')
    .single();

  if (error) throw error;

  revalidatePath('/', 'layout');
  return data.id;
};

export const updateTopic = async (id: string, payload: TopicInsertWithoutAuthor) => {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('topic').update(payload).eq('id', id);
  if (error) throw error;
  revalidatePath(`/topics/${id}`);
};

export const deleteTopic = async (id: number) => {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('topic').delete().eq('id', id);
  if (error) throw error;
  revalidatePath('/');
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
  revalidatePath(`/topics/${topicId}`);
};
