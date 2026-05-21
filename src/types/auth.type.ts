/**
 * @file auth.type.ts
 * @description 인증 관련 타입 정의 파일입니다.
 */

export interface User {
  id: string;
  email: string;
  nickname: string | null;
  role: string;
  created_at?: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
}
