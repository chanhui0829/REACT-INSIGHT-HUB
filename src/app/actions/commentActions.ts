/**
 * @file commentActions.ts
 * @description 댓글 작성 및 삭제 액션입니다.
 */
'use server';

import { createServerSupabaseClient } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// 댓글 추가
export const addComment = async (topicId: number, text: string) => {
  const supabase = await createServerSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;

  if (!user) throw new Error('로그인 필요');

  const { data, error } = await supabase
    .from('comment')
    .insert({
      content: text,
      topic_id: topicId,
      user_id: user.id,
    })
    .select('*')
    .single();

  if (error) throw error;

  revalidatePath(`/topics/${topicId}`);
  return { ...data, email: user.email };
};

// 삭제
export const deleteComment = async (commentId: number, topicId: number) => {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('comment').delete().eq('id', commentId);
  if (error) throw error;

  revalidatePath(`/topics/${topicId}`);
};
