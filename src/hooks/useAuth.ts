/**
 * @file useAuth.ts
 * @description 인증 리스너 훅입니다.
 * Supabase 인증 상태 변화를 감지하여 Zustand 스토어를 업데이트합니다.
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores';
import { createClientComponentClient } from '@/lib/supabase';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

// Zustand User 타입 변환 함수
async function mapUser(sessionUser: SupabaseUser | null) {
  if (!sessionUser) return null;

  const supabase = createClientComponentClient();
  const { data: userData } = await supabase
    .from('user')
    .select('nickname')
    .eq('id', sessionUser.id)
    .single();

  return {
    id: sessionUser.id,
    email: sessionUser.email ?? '',
    role: sessionUser.role ?? '',
    nickname: userData?.nickname ?? '',
  };
}

// Auth Listener Hook
export default function useAuthListener() {
  const setUser = useAuthStore((state) => state.setUser);

  const applyUser = useCallback(
    async (sessionUser: SupabaseUser | null) => {
      const formatted = await mapUser(sessionUser);
      setUser(formatted);
    },
    [setUser]
  );

  useEffect(() => {
    let mounted = true;

    // 초기 세션 확인 — persist로 이미 user가 있으면 스킵
    const initSession = async () => {
      const currentUser = useAuthStore.getState().user;
      if (currentUser) return; // 이미 로그인 상태면 덮어쓰지 않음

      const supabase = createClientComponentClient();
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;

      if (mounted) {
        await applyUser(sessionUser);
      }
    };

    initSession();

    const supabase = createClientComponentClient();
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session: Session | null) => {
        if (!mounted) return;

        // SIGNED_OUT 이벤트일 때만 store 초기화
        if (!session) {
          setUser(null);
          return;
        }

        // SIGNED_IN은 login 액션에서 이미 처리하므로 스킵
        // OAuth 콜백(INITIAL_SESSION)은 처리 필요
        if (_event === 'INITIAL_SESSION' || _event === 'TOKEN_REFRESHED') {
          await applyUser(session.user);
        }
      }
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [applyUser, setUser]);
}
