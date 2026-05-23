/**
 * @file supabase.ts
 */

import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 클라이언트 인스턴스를 저장할 변수
let browserClient: ReturnType<typeof createBrowserClient> | undefined;

// 1. 서버 전용
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

// 2. 캐시 전용
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// 3. 클라이언트 전용
export const createClientComponentClient = () => {
  if (browserClient) return browserClient;

  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
};
