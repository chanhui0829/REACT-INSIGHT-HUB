import supabase from '@/lib/supabase';

// 🔹 댓글 목록
export const fetchComments = async (topicId: number, from: number, to: number) => {
  const { data, error } = await supabase
    .from('comment_user_view')
    .select('*')
    .eq('topic_id', topicId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return data;
};

// 🔹 댓글 개수 조회
export const fetchCommentsCount = async (topicId: number): Promise<number> => {
  const { count, error } = await supabase
    .from('comment')
    .select('*', { count: 'exact', head: true })
    .eq('topic_id', topicId);

  if (error) throw error;

  return count ?? 0;
};

// 🔹 댓글 추가
export const addComment = async (topicId: number, text: string) => {
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

  return { ...data, email: user.email };
};

// 🔹 삭제
export const deleteComment = async (commentId: number) => {
  const { error } = await supabase.from('comment').delete().eq('id', commentId);
  if (error) throw error;
};
