/**
 * @file SignIn.tsx
 * @description 사용자 인증(로그인) 페이지.
 * Google OAuth 및 이메일/비밀번호 기반 로그인을 지원하며, 회원가입 페이지와 디자인 시스템을 공유합니다.
 */

import { useEffect, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { LogIn, Sparkles, Command } from 'lucide-react';

// Store & Services
import { useAuthStore } from '@/stores';
import { signInWithGoogleService } from '@/services/authService';

// UI Components
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  PasswordInput,
} from '@/components/ui';

// —————————————————————————————————————————————————————————————————————————————
// 🔹 Validation Schema: 보안 강화를 위한 패스워드 정규식 포함
// —————————————————————————————————————————————————————————————————————————————
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$&*?!%])[A-Za-z\d!@$%&*?]{8,15}$/;

const formSchema = z.object({
  email: z.string().email('올바른 형식의 이메일 주소를 입력해주세요.'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
    .regex(passwordRegex, '영문, 숫자, 특수문자를 포함해야 합니다.'),
});

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();

  // Auth Store 상태
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);

  // 회원가입 페이지로부터 전달받은 이메일 우선 적용 (UX 최적화)
  const prefillEmail = location.state?.email || '';

  // 1. React Hook Form 초기화
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: prefillEmail, password: '' },
  });

  // 2. 인증 상태 감지: 로그인된 사용자는 즉시 홈으로 이동
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  /**
   * @description Google 소셜 로그인 핸들러
   */
  const handleGoogleSignIn = useCallback(async () => {
    const { error } = await signInWithGoogleService();
    if (error) toast.error(error.message);
  }, []);

  /**
   * @description 일반 이메일/비밀번호 로그인 핸들러
   */
  const onSubmit = useCallback(
    async (values: z.infer<typeof formSchema>) => {
      try {
        const success = await login(values.email, values.password);

        if (success) {
          toast.success('환영합니다! 로그인이 성공하였습니다.');
          navigate('/');
        } else {
          toast.error('이메일 또는 비밀번호를 다시 확인해주세요.');
        }
      } catch (err) {
        console.error('SignIn Error:', err);
        toast.error('로그인 처리 중 오류가 발생했습니다.');
      }
    },
    [navigate, login]
  );

  return (
    <main className="relative w-full min-h-screen flex items-center justify-center mt-24 my-12 overflow-hidden">
      {/* Background Decorative Glow (회원가입 페이지와 대칭) */}
      <div className="absolute top-[-5%] left-[-5%] w-[450px] h-[450px] bg-sky-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-5%] right-[-5%] w-[450px] h-[450px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[420px] z-10">
        {/* 로그인 카드 컨테이너 */}
        <section className="backdrop-blur-2xl bg-zinc-900/40 border border-white/5 rounded-4xl p-8 md:p-10 shadow-2xl">
          {/* 헤더 섹션 */}
          <header className="flex flex-col items-center text-center gap-4 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-2">
              <Command className="text-sky-400" size={28} />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tighter text-white flex items-center gap-2 justify-center">
                로그인 <Sparkles size={20} className="text-sky-400" />
              </h1>
              <p className="text-zinc-400 text-sm font-medium">
                인사이트 허브에 다시 오신 것을 환영합니다
              </p>
            </div>
          </header>

          <div className="flex flex-col gap-6">
            {/* 1. 소셜 로그인 (Google) */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              className="h-12 rounded-2xl border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800 hover:text-white transition-all flex items-center gap-3 font-semibold"
            >
              <img src="/assets/icons/icon-003.png" alt="Google" className="w-5 h-5 shrink-0" />
              Google 계정으로 계속하기
            </Button>

            {/* 구분선 */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-zinc-800"></span>
              </div>
              <div className="relative flex justify-center text-[10px] font-bold tracking-widest uppercase">
                <span className="px-4 text-zinc-600 bg-[#09090b]">OR CONTINUE WITH EMAIL</span>
              </div>
            </div>

            {/* 2. 일반 로그인 폼 */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-zinc-400 ml-1">이메일</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="name@example.com"
                            {...field}
                            className="h-12 rounded-2xl bg-zinc-950/50 border-zinc-800 focus:border-sky-500/50 transition-all text-zinc-200"
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem className="space-y-1.5">
                        <FormLabel className="text-zinc-400 ml-1">비밀번호</FormLabel>
                        <FormControl>
                          <PasswordInput
                            placeholder="비밀번호를 입력하세요"
                            {...field}
                            className="h-12 rounded-2xl bg-zinc-950/50 border-zinc-800 focus:border-sky-500/50 transition-all text-zinc-200"
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex flex-col gap-4 pt-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-2xl bg-sky-500 hover:bg-sky-400 text-zinc-950 font-bold transition-all shadow-lg shadow-sky-500/20 disabled:opacity-50 active:scale-[0.98] flex items-center gap-2"
                  >
                    {loading ? (
                      '로그인 중...'
                    ) : (
                      <>
                        로그인 <LogIn size={18} />
                      </>
                    )}
                  </Button>

                  <div className="text-center text-[13px] text-zinc-500">
                    계정이 없으신가요?
                    <NavLink
                      to="/sign-up"
                      className="text-sky-400 hover:text-sky-300 font-bold ml-2 underline underline-offset-4 transition-colors"
                    >
                      회원가입
                    </NavLink>
                  </div>
                </div>
              </form>
            </Form>
          </div>
        </section>
      </div>
    </main>
  );
}
