import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores';
import supabase from '@/lib/supabase';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';

// ------------------------------
// 🔹 Zustand User 타입과 동일하게 변환하는 함수
// ------------------------------
function mapUser(sessionUser: SupabaseUser | null) {
  if (!sessionUser) return null;

  return {
    id: sessionUser.id,
    email: sessionUser.email ?? '',
    role: sessionUser.role ?? '',
  };
}

// ------------------------------
// 🔹 Auth Listener Hook
// ------------------------------
export default function useAuthListener() {
  // Zustand의 setUser만 가져오면 리렌더 최소화됨
  const setUser = useAuthStore((state) => state.setUser);

  // -----------------------------------------
  // 🔥 Supabase User → Zustand User로 변환하여 저장
  // -----------------------------------------
  const applyUser = useCallback(
    (sessionUser: SupabaseUser | null) => {
      const formatted = mapUser(sessionUser);
      setUser(formatted); // formatted가 null이면 null 저장
    },
    [setUser]
  );

  useEffect(() => {
    let mounted = true;

    // -----------------------------------------
    // 🔥 1) 첫 로딩 시 세션 확인
    // -----------------------------------------
    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      const sessionUser = data.session?.user ?? null;

      if (mounted) {
        applyUser(sessionUser);
      }
    };

    initSession();

    // -----------------------------------------
    // 🔥 2) onAuthStateChange로 실시간 로그인 변화 감지
    // -----------------------------------------
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session: Session | null) => {
        if (!mounted) return;
        applyUser(session?.user ?? null);
      }
    );

    // 🔥 cleanup
    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [applyUser]);
}
