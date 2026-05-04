import supabase from '@/lib/supabase';

export const getUserNickname = async (id: string): Promise<string> => {
  const { data, error } = await supabase.from('user').select('nickname').eq('id', id).single();

  if (error || !data) return '알 수 없는 사용자';

  return data.nickname || '알 수 없는 사용자';
};

export const getUserNicknames = async (ids: string[]): Promise<Record<string, string>> => {
  if (ids.length === 0) return {};

  const uniqueIds = [...new Set(ids)];
  const { data, error } = await supabase.from('user').select('id, nickname').in('id', uniqueIds);

  if (error || !data) return {};

  return data.reduce<Record<string, string>>((acc, row) => {
    acc[row.id] = row.nickname || '알 수 없는 사용자';
    return acc;
  }, {});
};
