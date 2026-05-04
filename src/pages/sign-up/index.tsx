// 회원가입 페이지

import { useEffect, useState, useCallback } from 'react';
import { NavLink, useNavigate } from 'react-router';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { ArrowLeft, Asterisk, ChevronRight, UserPlus, Sparkles } from 'lucide-react';

import { useAuthStore } from '@/stores';
import { checkNickname } from '@/services/authService';
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

// Zod Schema
const formSchema = z
  .object({
    nickname: z.string().min(2, '닉네임은 최소 2자 이상이어야 합니다.').max(20, '닉네임은 최대 20자까지 가능합니다.'),
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

  // Auth Store 상태
  const user = useAuthStore((state) => state.user);
  const signUp = useAuthStore((state) => state.signUp);
  const loading = useAuthStore((state) => state.loading);

  // React Hook Form 초기화
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { nickname: '', email: '', password: '', confirmPassword: '' },
  });

  // 약관 동의 상태
  const [serviceAgreed, setServiceAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);
  const [nicknameError, setNicknameError] = useState('');
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);

  const handleCheckService = useCallback(() => setServiceAgreed((prev) => !prev), []);
  const handleCheckPrivacy = useCallback(() => setPrivacyAgreed((prev) => !prev), []);
  const handleCheckMarketing = useCallback(() => setMarketingAgreed((prev) => !prev), []);

  const handleNicknameChange = useCallback(async (value: string) => {
    if (value.length < 2) {
      setNicknameError('');
      return;
    }

    setIsCheckingNickname(true);
    const isDuplicate = await checkNickname(value);
    setIsCheckingNickname(false);

    if (isDuplicate) {
      setNicknameError('이미 사용 중인 닉네임입니다.');
    } else {
      setNicknameError('');
    }
  }, []);

  // 인증 상태 감지
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  // 회원가입 폼 제출 핸들러
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!serviceAgreed || !privacyAgreed) {
      toast.warning('필수 동의항목을 체크해주세요.');
      return;
    }

    if (nicknameError) {
      toast.error('닉네임 중복을 확인해주세요.');
      return;
    }

    try {
      const success = await signUp(
        values.email,
        values.password,
        serviceAgreed,
        privacyAgreed,
        marketingAgreed,
        values.nickname
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
      {/* Background Decorative Glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[440px] z-10">
        {/* 회원가입 카드 */}
        <section className="backdrop-blur-xl bg-slate-900/40 border border-white/10 rounded-[32px] p-8 md:p-10 shadow-2xl">
          {/* 헤더 */}
          <header className="flex flex-col items-center text-center gap-4 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-2">
              <UserPlus className="text-purple-400" size={28} />
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tighter text-white flex items-center gap-2 justify-center">
                시작하기 <Sparkles size={20} className="text-purple-400" />
              </h1>
              <p className="text-slate-400 text-sm font-medium">
                새로운 인사이트를 만날 준비가 되셨나요?
              </p>
            </div>
          </header>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 입력 필드 */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="nickname"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-slate-400 ml-1">닉네임</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="2자 이상 20자 이하"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleNicknameChange(e.target.value);
                          }}
                          className="h-12 rounded-2xl bg-slate-950/50 border-white/10 focus:border-purple-500/50 transition-all"
                        />
                      </FormControl>
                      {nicknameError && <p className="text-xs text-red-400 ml-1">{nicknameError}</p>}
                      {isCheckingNickname && <p className="text-xs text-slate-500 ml-1">중복 검사 중...</p>}
                      <FormMessage className="text-xs text-red-400" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-1.5">
                      <FormLabel className="text-slate-400 ml-1">이메일</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="name@example.com"
                          {...field}
                          className="h-12 rounded-2xl bg-slate-950/50 border-white/10 focus:border-purple-500/50 transition-all"
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
                      <FormLabel className="text-slate-400 ml-1">비밀번호</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="8자 이상의 비밀번호"
                          {...field}
                          className="h-12 rounded-2xl bg-slate-950/50 border-white/10 focus:border-purple-500/50 transition-all"
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
                      <FormLabel className="text-slate-400 ml-1">비밀번호 확인</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="비밀번호를 한 번 더 입력"
                          {...field}
                          className="h-12 rounded-2xl bg-slate-950/50 border-white/10 focus:border-purple-500/50 transition-all"
                        />
                      </FormControl>
                      <FormMessage className="text-xs text-red-400" />
                    </FormItem>
                  )}
                />
              </div>

              {/* 약관 동의 */}
              <div className="bg-slate-950/30 rounded-2xl p-5 border border-white/5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Asterisk size={14} className="text-purple-400" />
                  <span className="text-[13px] font-bold text-slate-300 uppercase tracking-widest">
                    필수 항목
                  </span>
                </div>

                <div className="space-y-3">
                  {/* 이용약관 */}
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="service"
                        checked={serviceAgreed}
                        onCheckedChange={handleCheckService}
                        className="w-5 h-5 rounded-md border-slate-700 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                      />
                      <Label
                        htmlFor="service"
                        className="text-sm text-slate-400 cursor-pointer group-hover:text-slate-200 transition-colors"
                      >
                        서비스 이용약관 동의
                      </Label>
                    </div>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-slate-600 hover:text-purple-400 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>

                  {/* 개인정보 */}
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="privacy"
                        checked={privacyAgreed}
                        onCheckedChange={handleCheckPrivacy}
                        className="w-5 h-5 rounded-md border-slate-700 data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500"
                      />
                      <Label
                        htmlFor="privacy"
                        className="text-sm text-slate-400 cursor-pointer group-hover:text-slate-200 transition-colors"
                      >
                        개인정보 수집 및 이용 동의
                      </Label>
                    </div>
                    <Button
                      variant="link"
                      className="h-auto p-0 text-slate-600 hover:text-purple-400 transition-colors"
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </div>

                <Separator className="bg-white/5" />

                {/* 마케팅 */}
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="marketing"
                      checked={marketingAgreed}
                      onCheckedChange={handleCheckMarketing}
                      className="w-5 h-5 rounded-md border-slate-700 data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500"
                    />
                    <Label
                      htmlFor="marketing"
                      className="text-sm text-slate-500 cursor-pointer group-hover:text-slate-300 transition-colors font-normal"
                    >
                      마케팅 및 광고 수신 동의 (선택)
                    </Label>
                  </div>
                  <Button
                    variant="link"
                    className="h-auto p-0 text-slate-600 hover:text-indigo-400 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              </div>

              {/* 하단 버튼 */}
              <footer className="flex flex-col gap-4 pt-2">
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => navigate(-1)}
                    className="w-12 h-12 rounded-2xl border-white/10 hover:bg-slate-800 text-slate-400 transition-all shrink-0"
                  >
                    <ArrowLeft size={20} />
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 h-12 rounded-2xl bg-purple-500 hover:bg-purple-400 text-white font-bold transition-all shadow-lg shadow-purple-500/20 disabled:opacity-50 active:scale-[0.98]"
                  >
                    {loading ? '가입 처리 중...' : '회원가입 완료'}
                  </Button>
                </div>

                <div className="text-center text-[13px] text-slate-500">
                  이미 계정이 있으신가요?
                  <NavLink
                    to="/sign-in"
                    className="text-purple-400 hover:text-purple-300 font-bold ml-2 underline underline-offset-4 transition-colors"
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
