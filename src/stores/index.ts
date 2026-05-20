/**
 * @file index.ts
 * @description Zustand 스토어입니다.
 * 인증 상태를 관리합니다.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  signInWithEmail,
  signUpWithEmail,
  signOut,
  updateUserAgreement,
} from '@/services/authService';
import { createClient } from '@/lib/supabase';

export interface User {
  id: string;
  email: string;
  role: string;
  nickname: string;
}

interface AuthStore {
  user: User | null;
  loading: boolean;
  error: string | null;

  setUser: (newUser: User | null) => void;
  reset: () => Promise<void>;

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    serviceAgreed: boolean,
    privacyAgreed: boolean,
    marketingAgreed: boolean,
    nickname?: string
  ) => Promise<boolean>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      loading: false,
      error: null,

      setUser: (newUser: User | null) => set({ user: newUser }),

      reset: async () => {
        try {
          await signOut();
        } catch {
          console.warn('signOut 실패');
        }
        set({ user: null });
      },

      login: async (email, password) => {
        set({ loading: true, error: null });

        try {
          const result = await signInWithEmail(email, password);

          if (!result.user) {
            set({ error: '로그인 실패', loading: false });
            return false;
          }

          const supabase = createClient();
          const { data: userData } = await supabase
            .from('user')
            .select('nickname')
            .eq('id', result.user.id)
            .single();

          set({
            user: {
              id: result.user.id,
              email: result.user.email ?? '',
              role: 'user',
              nickname: userData?.nickname ?? '',
            },
            loading: false,
          });

          return true;
        } catch (error: any) {
          set({ error: error.message || '로그인 실패', loading: false });
          return false;
        }
      },

   signUp: async (email, password, serviceAgreed, privacyAgreed, marketingAgreed, nickname) => {
  set({ loading: true, error: null });

  try {
    const result = await signUpWithEmail(email, password, nickname);

    if (!result.user) {
      set({ error: '회원가입 실패', loading: false });
      return false;
    }

    const supabase = createClient();

    // security definer 함수로 RLS 우회
    const { error: rpcError } = await supabase.rpc('update_user_on_signup', {
      user_id: result.user.id,
      user_nickname: nickname ?? '',
      user_service_agreed: serviceAgreed,
      user_privacy_agreed: privacyAgreed,
      user_marketing_agreed: marketingAgreed,
    });

    if (rpcError) {
      console.error('회원가입 정보 저장 실패:', rpcError);
      set({ loading: false });
      return false;
    }

    await signOut();

    set({ loading: false });
    return true;
  } catch (error: any) {
    set({ error: error.message || '회원가입 실패', loading: false });
    return false;
  }
},

      logout: async () => {
        await signOut();
        set({ user: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);