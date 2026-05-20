/**
 * @file useService.ts
 * @description 사용자 관련 유틸리티 서비스입니다.
 * 사용자 닉네임 등 추가 정보를 가져오는 기능을 제공합니다.
 */

import { createClient } from '@/lib/supabase';

export async function getUserNicknames(userIds: string[]) {
  const supabase = createClient();

  if (userIds.length === 0) return {};

  const { data, error } = await supabase
    .from('user')
    .select('id, nickname')
    .in('id', userIds);

  if (error) {
    console.error('Error fetching user nicknames:', error);
    return {};
  }

  const nicknameMap: Record<string, string> = {};
  data?.forEach((profile: { id: string; nickname: string | null }) => {
    nicknameMap[profile.id] = profile.nickname || '알 수 없는 사용자';
  });

  return nicknameMap;
}

export async function getUserNickname(userId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('user')
    .select('nickname')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user nickname:', error);
    return '알 수 없는 사용자';
  }

  return data?.nickname || '알 수 없는 사용자';
}
