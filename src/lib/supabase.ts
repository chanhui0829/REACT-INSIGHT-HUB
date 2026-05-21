/**
 * @file supabase.ts
 */

import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 1. 서버 전용 (SSR 환경에서 쿠키를 읽어야 할 때 사용)
export const createServerSupabaseClient = async () => {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get: (name) => cookieStore.get(name)?.value,
      set: (name, value, options) => {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {}
      },
      remove: (name, options) => {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch {}
      },
    },
  });
};

// 2. 캐시 전용 (unstable_cache 등에서 사용, 쿠키 의존성 없음)
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// 3. 클라이언트 전용 (Client Component에서 사용)
export const createClientComponentClient = () => createBrowserClient(supabaseUrl, supabaseAnonKey);
