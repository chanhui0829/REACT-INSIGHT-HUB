import supabase from '@/lib/supabase';
import { nanoid } from 'nanoid';
import type { Topic } from '@/types/topic.type';
import { TOPIC_STATUS } from '@/types/topic.type';

// ======================================================
// 🔹 타입
// ======================================================
export type TopicInsertWithoutAuthor = Omit<
  Topic,
  'id' | 'created_at' | 'author' | 'views' | 'likes'
>;

// ======================================================
// 🔹 목록 조회
// ======================================================
type FetchTopicsParams = {
  category: string;
  searchQuery: string;
  sortOption: string;
  startIndex: number;
  endIndex: number;
};

export const fetchTopics = async (filters: FetchTopicsParams) => {
  const { category, searchQuery, sortOption, startIndex, endIndex } = filters;

  let query = supabase
    .from('topic')
    .select('*', { count: 'exact' })
    .eq('status', TOPIC_STATUS.PUBLISH);

  if (category !== 'all') {
    query = query.eq('category', category);
  }

  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
  }

  const orderBy =
    sortOption === 'likes' ? 'likes' : sortOption === 'views' ? 'views' : 'created_at';

  const { data, error, count } = await query
    .order(orderBy, { ascending: false })
    .range(startIndex, endIndex);

  if (error) throw error;

  return {
    topics: data ?? [],
    total: count ?? 0,
  };
};

// ======================================================
// 🔹 단일 조회
// ======================================================
export const fetchTopicById = async (id?: string): Promise<Topic | null> => {
  if (!id) return null;

  const { data, error } = await supabase.from('topic').select('*').eq('id', id).single();

  if (error) throw error;
  return data;
};

// ======================================================
// 🔹 썸네일 업로드
// ======================================================
export const uploadThumbnail = async (file: File | string | null) => {
  if (!file) return null;

  if (file instanceof File) {
    const ext = file.name.split('.').pop();
    const fileName = `${nanoid()}.${ext}`;
    const filePath = `topics/${fileName}`;

    const { error } = await supabase.storage.from('files').upload(filePath, file);

    if (error) throw error;

    const { data } = supabase.storage.from('files').getPublicUrl(filePath);
    return data.publicUrl;
  }

  return typeof file === 'string' ? file : null;
};

// ======================================================
// 🔹 insert
// ======================================================
export const insertTopic = async (userId: string, payload: TopicInsertWithoutAuthor) => {
  const { data, error } = await supabase
    .from('topic')
    .insert([{ ...payload, author: userId }])
    .select('id')
    .single();

  if (error) throw error;
  return data.id as number;
};

// ======================================================
// 🔹 update
// ======================================================
export const updateTopic = async (id: string, payload: TopicInsertWithoutAuthor) => {
  const { error } = await supabase.from('topic').update(payload).eq('id', id);
  if (error) throw error;
};

// ======================================================
// 🔹 delete
// ======================================================
export const deleteTopic = async (id: number) => {
  const { error } = await supabase.from('topic').delete().eq('id', id);
  if (error) throw error;
};

// ======================================================
// 🔹 조회수 증가
// ======================================================
export const increaseViews = async (topicId: number) => {
  const { error } = await supabase.rpc('increment_topic_views', {
    topic_id: topicId,
  });

  if (error) throw error;
};

// ======================================================
// 🔹 좋아요 토글
// ======================================================
export const toggleLike = async (topicId: number) => {
  const { error } = await supabase.rpc('toggle_topic_like', {
    p_topic_id: topicId,
  });

  if (error) throw error;
};

// ======================================================
// 🔹 임시 저장 조회
// ======================================================
export const fetchDrafts = async (userId: string) => {
  const { data, error } = await supabase
    .from('topic')
    .select('*')
    .eq('author', userId)
    .eq('status', TOPIC_STATUS.TEMP)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
};

// topic.service.ts
export const fetchTopicLikes = async (topicId: number) => {
  const { data, error } = await supabase
    .from('topic_likes')
    .select('user_id')
    .eq('topic_id', topicId);

  if (error) throw error;
  return data ?? [];
};
