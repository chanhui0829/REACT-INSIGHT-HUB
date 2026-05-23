/**
 * @file topicService.ts
 * @description 토픽 목록 및 상세 정보를 조회하는 서비스입니다.
 * 서버 컴포넌트에서 직접 호출하여 성능을 최적화합니다.
 */

import { supabase } from '@/lib/supabase';
import type { Topic } from '@/types/topic.type';
import { TOPIC_STATUS } from '@/types/topic.type';
import { unstable_cache } from 'next/cache';

// 데이터 조회 파라미터 타입 정의
type FetchTopicsParams = {
  category: string;
  searchQuery: string;
  sortOption: string;
  startIndex: number;
  endIndex: number;
};

// 모든 토픽 데이터를 DB에서 조회
export const fetchTopics = async (filters: FetchTopicsParams) => {
  const { category, searchQuery, sortOption, startIndex, endIndex } = filters;
  try {
    let query = supabase
      .from('topic')
      .select('*', { count: 'exact' })
      .eq('status', TOPIC_STATUS.PUBLISH);

    if (category !== 'all') query = query.eq('category', category);
    if (searchQuery)
      query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);

    const orderBy =
      sortOption === 'likes' ? 'likes' : sortOption === 'views' ? 'views' : 'created_at';

    const { data, error, count } = await query
      .order(orderBy, { ascending: false })
      .range(startIndex, endIndex);

    if (error) throw error;

    // 안전하게 데이터 가공 (여기에만 방어 로직 추가)
    const safeData = (data || []).map((item) => {
      try {
        if (item.content && typeof item.content === 'string') {
          JSON.parse(item.content);
        }
        return item; // 정상 데이터 반환
      } catch (e) {
        return { ...item, content: '[]' }; // 파싱 에러 시 빈 배열로 반환
      }
    });

    return { topics: safeData ?? [], total: count ?? 0 };
  } catch (error) {
    console.error('--- fetchTopics 에러 상세 분석 ---');
    console.error('Params:', { category, searchQuery, sortOption, startIndex, endIndex });
    console.error('Error Details:', error);
    return { topics: [], total: 0 };
  }
};

// 캐싱된 토픽 목록 반환
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

// 토픽 상세 조회
export const fetchTopicById = async (id?: string): Promise<Topic | null> => {
  if (!id) return null;
  const { data, error } = await supabase.from('topic').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
};

// 내 임시 저장 글 목록 조회
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

// 특정 토픽의 좋아요 목록 조회
export const fetchTopicLikes = async (topicId: number) => {
  const { data, error } = await supabase
    .from('topic_likes')
    .select('user_id')
    .eq('topic_id', topicId);

  if (error) {
    console.error('Supabase 에러 발생:', error);
    throw error;
  }

  return data ?? [];
};

// 모든 토픽 ID 조회 (SEO용)
export const getAllTopicIds = async () => {
  const { data, error } = await supabase
    .from('topic')
    .select('id')
    .eq('status', TOPIC_STATUS.PUBLISH);
  if (error) throw error;
  return data?.map((t) => t.id.toString()) ?? [];
};
