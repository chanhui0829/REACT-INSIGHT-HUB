/**
 * @file commentService.ts
 * @description 댓글 조회 전용 서비스입니다.
 */

import { supabase } from '@/lib/supabase';

export type CommentItem = {
  id: number;
  topic_id: number;
  user_id: string;
  content: string;
  created_at: string;
  email?: string;
};

// 댓글 목록
export const fetchComments = async (topicId: number, from: number, to: number) => {
  const { data, error } = await supabase
    .from('comment_user_view')
    .select('*')
    .eq('topic_id', topicId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return (data ?? []) as CommentItem[];
};

// 댓글 개수 조회
export const fetchCommentsCount = async (topicId: number): Promise<number> => {
  const { count, error } = await supabase
    .from('comment')
    .select('*', { count: 'exact', head: true })
    .eq('topic_id', topicId);

  if (error) throw error;
  return count ?? 0;
};

// 댓글 단건 조회
export const fetchCommentById = async (commentId: number): Promise<CommentItem | null> => {
  const { data, error } = await supabase
    .from('comment_user_view')
    .select('*')
    .eq('id', commentId)
    .single();

  if (error) throw error;
  return (data as CommentItem) ?? null;
};
