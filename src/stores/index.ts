import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  signInService,
  signUpService,
  signOutService,
  updateUserAgreement,
} from '@/services/authService';

// ------------------------------
export interface User {
  id: string;
  email: string;
  role: string;
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
    marketingAgreed: boolean
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
          await signOutService();
        } catch {
          console.warn('signOut 실패');
        }
        set({ user: null });
      },

      login: async (email, password) => {
        set({ loading: true, error: null });

        const { data, error } = await signInService(email, password);

        if (error || !data.user) {
          set({ error: error?.message || '로그인 실패', loading: false });
          return false;
        }

        set({
          user: {
            id: data.user.id,
            email: data.user.email ?? '',
            role: 'user',
          },
          loading: false,
        });

        return true;
      },

      signUp: async (email, password, serviceAgreed, privacyAgreed, marketingAgreed) => {
        set({ loading: true, error: null });

        const { data, error } = await signUpService(email, password);

        if (error || !data.user) {
          set({ error: error?.message || '회원가입 실패', loading: false });
          return false;
        }

        const { error: updateError } = await updateUserAgreement(
          data.user.id,
          serviceAgreed,
          privacyAgreed,
          marketingAgreed
        );

        if (updateError) {
          set({ loading: false });
          return false;
        }

        await signOutService();

        set({ loading: false });
        return true;
      },

      logout: async () => {
        await signOutService();
        set({ user: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }),
    }
  )
);
