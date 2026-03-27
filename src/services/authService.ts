import supabase from '@/lib/supabase';

// 로그인
export const signInService = async (email: string, password: string) => {
  return await supabase.auth.signInWithPassword({
    email,
    password,
  });
};

// 회원가입
export const signUpService = async (email: string, password: string) => {
  return await supabase.auth.signUp({
    email,
    password,
  });
};

// 로그아웃
export const signOutService = async () => {
  return await supabase.auth.signOut();
};

// 구글 로그인
export const signInWithGoogleService = async () => {
  return await supabase.auth.signInWithOAuth({
    provider: 'google',
  });
};

// 약관 업데이트
export const updateUserAgreement = async (
  userId: string,
  serviceAgreed: boolean,
  privacyAgreed: boolean,
  marketingAgreed: boolean
) => {
  return await supabase
    .from('user')
    .update({
      service_agreed: serviceAgreed,
      privacy_agreed: privacyAgreed,
      marketing_agreed: marketingAgreed,
    })
    .eq('id', userId);
};
