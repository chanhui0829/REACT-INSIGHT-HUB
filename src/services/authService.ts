/**
 * @file authService.ts
 * @description 인증 관련 서비스입니다.
 * Supabase Auth를 활용한 로그인, 회원가입, 로그아웃 기능을 제공합니다.
 */

import { supabase } from '@/lib/supabase';
import type { User } from '@/types/auth.type';

// 이메일 로그인
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

// 이메일 회원가입
export const signUpWithEmail = async (email: string, password: string, nickname?: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nickname,
      },
    },
  });

  if (error) throw error;
  return data;
};

// 로그아웃
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

// 현재 사용자 정보 가져오기 (서버 전용)
export async function getCurrentUser(): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('user')
    .select('id, email, nickname')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return { id: user.id, email: user.email ?? '', nickname: '' };
  }

  return profile;
}

// 세션 상태 확인 (서버 전용)
export const getSession = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

// Google OAuth 로그인 (클라이언트 전용)
export const signInWithGoogleService = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
};

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

// 약관 동의 업데이트
export const updateUserAgreement = async (
  userId: string,
  serviceAgreed: boolean,
  privacyAgreed: boolean,
  marketingAgreed: boolean
) => {
  const { error } = await supabase
    .from('user')
    .update({
      service_agreed: serviceAgreed,
      privacy_agreed: privacyAgreed,
      marketing_agreed: marketingAgreed,
    })
    .eq('id', userId);

  return { error };
};
