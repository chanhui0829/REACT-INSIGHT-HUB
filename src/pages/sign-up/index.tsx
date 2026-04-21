/**
 * @file SignUp.tsx
 * @description 사용자 회원가입 페이지.
 * 유효성 검사(Zod), 상태 관리(AuthStore), 약관 동의 로직이 통합된 구조입니다.
 */

import { useEffect, useState, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowLeft, Asterisk, ChevronRight, UserPlus, Sparkles } from 'lucide-react';

import { useAuthStore } from '@/stores';
import {
  Button,
  Checkbox,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Label,
  PasswordInput,
  Separator,
} from '@/components/ui';

// —————————————————————————————————————————————————————————————————————————————
// 🔹 Zod Schema: 클라이언트 측 유효성 검사 정의
// —————————————————————————————————————————————————————————————————————————————
const formSchema = z
  .object({
    email: z.string().email('올바른 이메일 주소를 입력해주세요.'),
    password: z.string().min(8, '비밀번호는 최소 8자 이상이어야 합니다.'),
    confirmPassword: z.string().min(8, '비밀번호 확인을 입력해주세요.'),
  })
  .superRefine(({ password, confirmPassword }, ctx) => {
    if (password !== confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        message: '비밀번호가 일치하지 않습니다.',
        path: ['confirmPassword'],
      });
    }
  });

export default function SignUp() {
  const navigate = useNavigate();

  // Auth Store 상태 및 액션
  const user = useAuthStore((state) => state.user);
  const signUp = useAuthStore((state) => state.signUp);
  const loading = useAuthStore((state) => state.loading);

  // 1. React Hook Form 초기화
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  // 2. 약관 동의 상태 관리 (필수 2, 선택 1)
  const [serviceAgreed, setServiceAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);

  const handleCheckService = useCallback(() => setServiceAgreed((prev) => !prev), []);
  const handleCheckPrivacy = useCallback(() => setPrivacyAgreed((prev) => !prev), []);
  const handleCheckMarketing = useCallback(() => setMarketingAgreed((prev) => !prev), []);

  // 3. 인증 상태 감지: 로그인된 사용자는 메인으로 리다이렉트
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  /**
   * @description 회원가입 폼 제출 핸들러
   * @param values - Zod로 검증된 폼 데이터
   */
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!serviceAgreed || !privacyAgreed) {
      toast.warning('필수 동의항목을 체크해주세요.');
      return;
    }

    try {
      const success = await signUp(
        values.email,
        values.password,
        serviceAgreed,
        privacyAgreed,
        marketingAgreed
      );

      if (success) {
        toast.success('회원가입이 완료되었습니다! 로그인해주세요.');
        navigate('/sign-in', { state: { email: values.email } });
      } else {
        toast.error('회원가입에 실패했습니다.');
      }
    } catch (err) {
      console.error('SignUp Error:', err);
      toast.error('회원가입 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <main className="relative w-full min-h-screen flex items-center justify-center p-4 mt-24 mb-12 overflow-hidden">
      {/* Background Decorative Glow (포트폴리오용 시각 효과) */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-sky-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[440px] z-10">
        {/* 회원가입 카드 컨테이너 */}
        <section className="backdrop-blur-xl bg-zinc-900/40 border border-white/5 rounded-4xl p-8 md:p-10 shadow-2xl">
          {/* 헤더 섹션 */}
          <header className="flex flex-col items-center text-center gap-4 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-2">
              <UserPlus className="text-emerald-400" size={28} />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tighter text-white flex items-center gap-2 justify-center">
                시작하기 <Sparkles size={20} className="text-emerald-400" />
              </h1>
              <p className="text-zinc-400 text-sm font-medium">
                새로운 인사이트를 만날 준비가 되셨나요?
              </p>
            </div>
          </header>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 입력 필드 그룹 */}
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
                          className="h-12 rounded-2xl bg-zinc-950/50 border-zinc-800 focus:border-emerald-500/50 transition-all"
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
                          placeholder="8자 이상의 비밀번호"
                          {...field}
                          className="h-12 rounded-2xl bg-zinc-950/50 border-zinc-800 focus:border-emerald-500/50 transition-all"
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-zinc-400 ml-1">비밀번호 확인</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="비밀번호를 한 번 더 입력"
                          {...field}
                          className="h-12 rounded-2xl bg-zinc-950/50 border-zinc-800 focus:border-emerald-500/50 transition-all"
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-red-400" />
                    </FormItem>
                  )}
                />
              </div>

              {/* 약관 동의 섹션 */}
              <div className="bg-zinc-950/30 rounded-2xl p-5 border border-white/5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Asterisk size={14} className="text-emerald-500" />
                  <span className="text-[13px] font-bold text-zinc-300 uppercase tracking-widest">
                    필수 항목
                  </span>
                </div>

                <div className="space-y-3">
                  {/* 이용약관 동의 */}
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="service"
                        checked={serviceAgreed}
                        onCheckedChange={handleCheckService}
                        className="w-5 h-5 rounded-md border-zinc-700 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      />
                      <Label
                        htmlFor="service"
                        className="text-sm text-zinc-400 cursor-pointer group-hover:text-zinc-200 transition-colors"
                      >
                        서비스 이용약관 동의
                      </Label>
                    </div>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-zinc-600 hover:text-emerald-400 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>

                  {/* 개인정보 동의 */}
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="privacy"
                        checked={privacyAgreed}
                        onCheckedChange={handleCheckPrivacy}
                        className="w-5 h-5 rounded-md border-zinc-700 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      />
                      <Label
                        htmlFor="privacy"
                        className="text-sm text-zinc-400 cursor-pointer group-hover:text-zinc-200 transition-colors"
                      >
                        개인정보 수집 및 이용 동의
                      </Label>
                    </div>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-zinc-600 hover:text-emerald-400 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>

                <Separator className="bg-zinc-800" />

                {/* 마케팅 동의 */}
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="marketing"
                      checked={marketingAgreed}
                      onCheckedChange={handleCheckMarketing}
                      className="w-5 h-5 rounded-md border-zinc-700 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                    />
                    <Label
                      htmlFor="marketing"
                      className="text-sm text-zinc-500 cursor-pointer group-hover:text-zinc-300 transition-colors font-normal"
                    >
                      마케팅 및 광고 수신 동의 (선택)
                    </Label>
                  </div>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-zinc-600 hover:text-emerald-400 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>

              {/* 하단 액션 버튼 */}
              <footer className="flex flex-col gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => navigate(-1)}
                    className="w-12 h-12 rounded-2xl border-zinc-800 hover:bg-zinc-800 text-zinc-400 transition-all shrink-0"
                  >
                    <ArrowLeft size={20} />
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 active:scale-[0.98]"
                  >
                    {loading ? '가입 처리 중...' : '회원가입 완료'}
                  </Button>
                </div>

                <div className="text-center text-[13px] text-zinc-500">
                  이미 계정이 있으신가요?
                  <NavLink
                    to="/sign-in"
                    className="text-emerald-400 hover:text-emerald-300 font-bold ml-2 underline underline-offset-4 transition-colors"
                  >
                    로그인
                  </NavLink>
                </div>
              </footer>
            </form>
          </Form>
        </section>
      </div>
    </main>
  );
}
