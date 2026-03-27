import supabase from '@/lib/supabase';

export const getUserNickname = async (id: string): Promise<string> => {
  const { data, error } = await supabase.from('user').select('email').eq('id', id).single();

  if (error || !data) return '알 수 없는 사용자';

  return data.email.split('@')[0] + '님';
};
