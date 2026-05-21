/**
 * @file supabase.ts
 * @description Supabase 클라이언트 설정 파일입니다.
 * 서버 사이드와 클라이언트 사이드에서 각각 사용할 수 있도록
 * createClient와 createBrowserClient를 분리하여 제공합니다.
 */

import { createClient as createServerClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// 환경 변수
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 서버 사이드용 Supabase 클라이언트 인스턴스 (Server Component, Route Handler 전용)
export const supabase = createServerClient(supabaseUrl, supabaseAnonKey);

// 클라이언트 사이드용 Supabase 클라이언트 생성 함수 (Client Component 전용)
export const createClient = () => createBrowserClient(supabaseUrl, supabaseAnonKey);

// 클라이언트 사이드용 Supabase 클라이언트 (호환성 유지)
export const createClientComponentClient = () => createBrowserClient(supabaseUrl, supabaseAnonKey);
