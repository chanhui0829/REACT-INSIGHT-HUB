/**
 * @file topicService.ts
 */

import { supabase, createClientComponentClient } from '@/lib/supabase';
import { nanoid } from 'nanoid';
import type { Topic } from '@/types/topic.type';
import { TOPIC_STATUS } from '@/types/topic.type';
import { unstable_cache } from 'next/cache';

export type TopicInsertWithoutAuthor = Omit<
  Topic,
  'id' | 'created_at' | 'author' | 'views' | 'likes'
>;

type FetchTopicsParams = {
  category: string;
  searchQuery: string;
  sortOption: string;
  startIndex: number;
  endIndex: number;
};

// unstable_cache 안에서 사용 — cookies 없는 supabase
export const fetchTopics = async (filters: FetchTopicsParams) => {
  const { category, searchQuery, sortOption, startIndex, endIndex } = filters;

  let query = supabase
    .from('topic')
    .select('*', { count: 'exact' })
    .eq('status', TOPIC_STATUS.PUBLISH);

  if (category !== 'all') query = query.eq('category', category);
  if (searchQuery) query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);

  const orderBy =
    sortOption === 'likes' ? 'likes' : sortOption === 'views' ? 'views' : 'created_at';

  const { data, error, count } = await query
    .order(orderBy, { ascending: false })
    .range(startIndex, endIndex);

  if (error) throw error;
  return { topics: data ?? [], total: count ?? 0 };
};

export const getCachedTopics = (filters: FetchTopicsParams) =>
  unstable_cache(
    async () => fetchTopics(filters),
    [
      'topics',
      filters.category,
      filters.searchQuery,
      filters.sortOption,
      String(filters.startIndex),
      String(filters.endIndex),
    ],
    { tags: ['posts'], revalidate: 3600 }
  )();

// 단일 조회 — cookies 없는 supabase (캐시용)
export const fetchTopicById = async (id?: string): Promise<Topic | null> => {
  if (!id) return null;
  const { data, error } = await supabase.from('topic').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
};

// 썸네일 업로드 — 클라이언트에서 호출
export const uploadThumbnail = async (file: File | string | null) => {
  if (!file) return null;
  const client = createClientComponentClient();

  if (file instanceof File) {
    const ext = file.name.split('.').pop();
    const fileName = `${nanoid()}.${ext}`;
    const filePath = `topics/${fileName}`;
    const { error } = await client.storage.from('files').upload(filePath, file);
    if (error) throw error;
    const { data } = client.storage.from('files').getPublicUrl(filePath);
    return data.publicUrl;
  }
  return typeof file === 'string' ? file : null;
};

// 인증 필요 함수들 — 클라이언트에서 호출되므로 createClientComponentClient 사용
export const insertTopic = async (userId: string, payload: TopicInsertWithoutAuthor) => {
  const client = createClientComponentClient();
  const { data, error } = await client
    .from('topic')
    .insert([{ ...payload, author: userId }])
    .select('id')
    .single();
  if (error) throw error;
  return data.id as number;
};

export const updateTopic = async (id: string, payload: TopicInsertWithoutAuthor) => {
  const client = createClientComponentClient();
  const { error } = await client.from('topic').update(payload).eq('id', id);
  if (error) throw error;
};

export const deleteTopic = async (id: number) => {
  const client = createClientComponentClient();
  const { error } = await client.from('topic').delete().eq('id', id);
  if (error) throw error;
};

export const increaseViews = async (topicId: number) => {
  const client = createClientComponentClient();
  const { error } = await client.rpc('increment_topic_views', { topic_id: topicId });
  if (error) throw error;
};

export const toggleLike = async (topicId: number) => {
  const client = createClientComponentClient();
  const { error } = await client.rpc('toggle_topic_like', { p_topic_id: topicId });
  if (error) throw error;
};

export const fetchDrafts = async (userId: string) => {
  const client = createClientComponentClient();
  const { data, error } = await client
    .from('topic')
    .select('*')
    .eq('author', userId)
    .eq('status', TOPIC_STATUS.TEMP)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const fetchTopicLikes = async (topicId: number) => {
  const client = createClientComponentClient();
  const { data, error } = await client
    .from('topic_likes')
    .select('user_id')
    .eq('topic_id', topicId);
  if (error) throw error;
  return data ?? [];
};

export const getAllTopicIds = async () => {
  const { data, error } = await supabase
    .from('topic')
    .select('id')
    .eq('status', TOPIC_STATUS.PUBLISH);
  if (error) throw error;
  return data?.map((t) => t.id.toString()) ?? [];
};
