/**
 * @file authActions.ts
 * @description 로그인, 회원가입 등 인증 처리 액션입니다.
 */
'use server';

import { createServerSupabaseClient } from '@/lib/supabase';
import { revalidateTag } from 'next/cache';

// 이메일 로그인
export const signInWithEmail = async (email: string, password: string) => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
};

// 이메일 회원가입
export const signUpWithEmail = async (email: string, password: string, nickname?: string) => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nickname } },
  });
  if (error) throw error;
  return data;
};

// 로그아웃
export const signOut = async () => {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  revalidateTag('/');
};

// 약관 동의 업데이트
export const updateUserAgreement = async (
  userId: string,
  serviceAgreed: boolean,
  privacyAgreed: boolean,
  marketingAgreed: boolean
) => {
  const supabase = await createServerSupabaseClient();
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
