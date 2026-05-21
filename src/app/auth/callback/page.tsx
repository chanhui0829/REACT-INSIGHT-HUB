/**
 * @file page.tsx
 * @description OAuth 콜백 페이지입니다.
 * 소셜 로그인 후 닉네임 설정 및 약관 동의를 처리합니다.
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@/lib/supabase';
import { toast } from 'sonner';
import { Input, Button, Checkbox } from '@/components/ui';
import { useAuthStore } from '@/stores';
import { User } from '@/types/auth.type';

export default function AuthCallback() {
  const router = useRouter();
  const setStoreUser = useAuthStore((state) => state.setUser);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nickname, setNickname] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nicknameError, setNicknameError] = useState('');
  const [isCheckingNickname, setIsCheckingNickname] = useState(false);
  const [serviceAgreed, setServiceAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClientComponentClient();

      const code = new URLSearchParams(window.location.search).get('code');
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      // 5초까지 세션이 들어오길 기다립니다 (안전장치)
      let session = null;
      for (let i = 0; i < 5; i++) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          session = data.session;
          break;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }

      if (!session) {
        console.error('끝내 세션을 찾지 못함');
        toast.error('로그인 처리가 지연되고 있습니다.');
        router.push('/sign-in');
        return;
      }

      // 유저 정보 조회 (ID 기반)
      const userId = session.user.id;
      const { data: userData, error } = await supabase
        .from('user')
        .select('nickname')
        .eq('id', userId)
        .single();

      // DB에 닉네임이 없으면 신규 가입 프로세스(모달) 진행
      if (error || !userData?.nickname) {
        setUserId(userId);
        setShowNicknameModal(true);
      } else {
        // 닉네임이 있는 기존 유저는 즉시 메인 페이지로 이동
        setStoreUser({
          id: userId,
          email: session.user.email ?? '',
          nickname: userData.nickname,
          role: 'user',
        });
        router.push('/');
      }

      setLoading(false);
    };

    handleAuthCallback();
  }, [router, setStoreUser]);

  const handleNicknameSubmit = async () => {
    if (!nickname || nickname.length < 2 || nickname.length > 20) {
      toast.error('닉네임은 2자 이상 20자 이하로 입력해주세요.');
      return;
    }
    if (!serviceAgreed || !privacyAgreed) {
      toast.error('필수 동의항목을 체크해주세요.');
      return;
    }
    if (!userId) return;

    const supabase = createClientComponentClient();

    setIsCheckingNickname(true);
    const { data: existing } = await supabase
      .from('user')
      .select('id')
      .eq('nickname', nickname)
      .single();
    setIsCheckingNickname(false);

    if (existing) {
      setNicknameError('이미 사용 중인 닉네임입니다.');
      return;
    }

    // security definer RPC로 저장
    const { error: rpcError } = await supabase.rpc('update_user_on_signup', {
      user_id: userId,
      user_nickname: nickname,
      user_service_agreed: serviceAgreed,
      user_privacy_agreed: privacyAgreed,
      user_marketing_agreed: marketingAgreed,
    });

    if (rpcError) {
      toast.error('정보 저장에 실패했습니다.');
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      setStoreUser({
        id: session.user.id,
        email: session.user.email ?? '',
        nickname,
        role: 'user',
      });
    }

    toast.success('로그인을 성공하였습니다.');
    router.push('/');
  };

  if (loading) {
    return (
      <main className="w-full h-full min-h-[720px] flex items-center justify-center">
        <p className="text-slate-400">로그인을 진행 중입니다. 잠시만 기다려주세요.</p>
      </main>
    );
  }

  if (showNicknameModal) {
    return (
      <main className="w-full h-full min-h-[720px] flex items-center justify-center bg-slate-950">
        <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold text-white mb-4">닉네임 설정</h2>
          <p className="text-slate-400 mb-6">서비스 이용을 위해 닉네임을 설정해주세요.</p>
          <Input
            placeholder="2자 이상 20자 이하"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setNicknameError('');
            }}
            className="h-12 rounded-xl bg-slate-950 border-white/10 text-white mb-2"
          />
          {nicknameError && <p className="text-xs text-red-400 mb-4">{nicknameError}</p>}
          {isCheckingNickname && <p className="text-xs text-slate-500 mb-4">중복 검사 중...</p>}

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <Checkbox
                id="service"
                checked={serviceAgreed}
                onCheckedChange={(c) => setServiceAgreed(c === true)}
                className="border-slate-600 data-[state=checked]:bg-indigo-500"
              />
              <label htmlFor="service" className="text-sm text-slate-300 cursor-pointer">
                서비스 이용약관 동의 <span className="text-red-400">(필수)</span>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="privacy"
                checked={privacyAgreed}
                onCheckedChange={(c) => setPrivacyAgreed(c === true)}
                className="border-slate-600 data-[state=checked]:bg-indigo-500"
              />
              <label htmlFor="privacy" className="text-sm text-slate-300 cursor-pointer">
                개인정보 처리방침 동의 <span className="text-red-400">(필수)</span>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="marketing"
                checked={marketingAgreed}
                onCheckedChange={(c) => setMarketingAgreed(c === true)}
                className="border-slate-600 data-[state=checked]:bg-indigo-500"
              />
              <label htmlFor="marketing" className="text-sm text-slate-300 cursor-pointer">
                마케팅 정보 수신 동의 <span className="text-slate-500">(선택)</span>
              </label>
            </div>
          </div>

          <Button
            onClick={handleNicknameSubmit}
            disabled={isCheckingNickname}
            className="w-full h-12 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white"
          >
            {isCheckingNickname ? '검사 중...' : '시작하기'}
          </Button>
        </div>
      </main>
    );
  }

  return null;
}
