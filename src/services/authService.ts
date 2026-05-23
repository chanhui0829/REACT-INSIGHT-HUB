/**
 * @file authService.ts
 * @description 인증 관련 조회 및 상태 확인 서비스입니다.
 */

import { supabase, createServerSupabaseClient, createClientComponentClient } from '@/lib/supabase';
import type { User } from '@/types/auth.type';

// 현재 사용자 정보 가져오기 (서버 전용)
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('user')
    .select('id, email, nickname, role')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return { id: user.id, email: user.email ?? '', nickname: '', role: 'user' };
  }

  return profile;
}

// 닉네임 중복 확인
export const checkNickname = async (nickname: string) => {
  const { data, error } = await supabase
    .from('user')
    .select('nickname')
    .eq('nickname', nickname)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return !!data;
};

// Google OAuth 로그인 (클라이언트 전용)
export const signInWithGoogleService = async () => {
  const supabase = createClientComponentClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
};

// 세션 상태 확인 (클라이언트 전용)
export const getSession = async () => {
  const supabase = createClientComponentClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};
