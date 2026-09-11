/**
 * @file page.tsx
 * @description 토픽 상세 보기 페이지입니다.
 * BlockNote 기반 콘텐츠 렌더링 및
 * 좋아요 / 조회수 / 댓글 기능을 제공합니다.
 */

'use client';

import { useEffect, useCallback, useMemo, useState, useRef } from 'react';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Archivo } from 'next/font/google';
import dayjs from 'dayjs';
import { toast } from 'sonner';

// 댓글 영역 상단의 "Community" 레이블 전용 서체 — 이탤릭 세리프 대신
// 곧고 각진 굵은 그로테스크로, 라벨 하나에만 포인트를 줌
const communityLabelFont = Archivo({ subsets: ['latin'], weight: '800' });

import { ArrowLeft, Eye, Heart, Calendar, Share2, User } from 'lucide-react';

import * as React from 'react';

import { useAuthStore } from '@/stores';

import { AppDeleteDialog } from '@/components/common/AppDeleteDialog';

import { Button, Badge } from '@/components/ui';

import { CommentBox } from '@/components/topics';

import { getUserNickname } from '@/services/useService';

import {
  useTopicDetail,
  useTopicLikes,
  useIncreaseViews,
  useToggleLike,
  useDeleteTopic,
  useTopicRealtimeHandlers,
} from '@/hooks/useTopic';

import { useCommentRealtimeHandlers } from '@/hooks/useComment';

import { subscribeTopicRealtime } from '@/services/realtimeService';

import type { Block } from '@blocknote/core';

// BlockNote 에디터는 클라이언트 전용으로 처리
const AppEditor = dynamic(() => import('@/components/common/AppEditor').then((m) => m.AppEditor), {
  ssr: false,
});

// 저장된 JSON 콘텐츠 파싱
const parseEditorContent = (raw: string | Block[] | null | undefined): Block[] => {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw;
  }

  try {
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed) ? (parsed as Block[]) : [];
  } catch {
    return [];
  }
};

export default function TopicDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const topicId = Number(id);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  // 토픽 상세 데이터, 좋아요 목록
  const { data: topic, isLoading } = useTopicDetail(topicId);
  const { data: likesData } = useTopicLikes(topicId);

  // 조회수 증가, 좋아요, 토픽 삭제 mutation
  const increaseViews = useIncreaseViews(topicId);
  const toggleLike = useToggleLike(topicId, user?.id);
  const deleteMutation = useDeleteTopic(topicId);

  // 댓글,좋아요 realtime 핸들러
  const { handleCommentInsert, handleCommentDelete } = useCommentRealtimeHandlers(topicId);
  const { handleLikeInsert, handleLikeDelete } = useTopicRealtimeHandlers(topicId);

  const [authorNickname, setAuthorNickname] = useState('알 수 없는 사용자');

  const viewedRef = useRef(false);

  /**
   * 작성자 닉네임 조회
   */
  useEffect(() => {
    if (!topic?.author) {
      setAuthorNickname('알 수 없는 사용자');

      return;
    }

    getUserNickname(topic.author).then(setAuthorNickname);
  }, [topic?.author]);

  /**
   * 현재 유저 좋아요 여부 확인
   */
  const isLiked = useMemo(() => {
    if (!user?.id) {
      return false;
    }

    if (!likesData) {
      return false;
    }

    return likesData.some((row) => String(row.user_id) === String(user.id));
  }, [likesData, user?.id]);

  /**
   * 에디터 콘텐츠 파싱
   */
  const parsedContent = useMemo(() => parseEditorContent(topic?.content), [topic?.content]);

  /**
   * 조회수 증가
   * StrictMode에서 중복 호출 방지
   */
  useEffect(() => {
    if (!topicId) return;

    if (viewedRef.current) {
      return;
    }

    viewedRef.current = true;

    increaseViews.mutate();
  }, [topicId]);

  /**
   * realtime 구독
   * 댓글 / 좋아요 변경 실시간 반영
   */
  useEffect(() => {
    if (!topicId) return;

    const channel = subscribeTopicRealtime(topicId, {
      onCommentInsert: (payload) => handleCommentInsert(payload),

      onCommentDelete: handleCommentDelete,

      onLikeInsert: handleLikeInsert,

      onLikeDelete: handleLikeDelete,
    });

    return () => {
      channel.unsubscribe();
    };
  }, [topicId, handleCommentInsert, handleCommentDelete, handleLikeInsert, handleLikeDelete]);

  /**
   * 토픽 삭제 처리
   */
  const handleDelete = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync();

      toast.success('토픽이 삭제되었습니다.');

      router.push('/');
    } catch (err) {
      console.error(err);

      toast.error('삭제 처리 중 오류가 발생했습니다.');
    }
  }, [deleteMutation, router]);

  /**
   * 로딩 상태
   */
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-500 font-bold">
        로딩 중...
      </div>
    );
  }

  /**
   * 데이터 없음
   */
  if (!topic) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-500 font-bold">
        데이터를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <main className="relative w-full min-h-screen bg-slate-900 text-slate-100 pt-[66px] overflow-x-hidden">
      {/* 상단 커버 영역 */}
      <header className="relative w-full h-[400px] md:h-[450px] overflow-hidden">
        {/* 썸네일 */}
        <div
          className="absolute inset-0 w-screen left-1/2 -translate-x-1/2 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${topic?.thumbnail || '/assets/default-thumbnail.png'})`,
          }}
        />

        {/* 어두운 오버레이 */}
        <div className="absolute inset-0 bg-black/50" />

        {/* 하단 그라데이션 */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

        {/* 상단 네비게이션 */}
        <nav className="relative z-20 w-full max-w-7xl mx-auto px-6 pt-6 flex justify-between items-center">
          {/* 뒤로가기 */}
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white px-5 h-10 text-xs font-bold hover:bg-white/10 transition-all"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back
          </Button>

          <div className="flex gap-3">
            {/* 삭제 버튼 */}
            {topic?.author === user?.id && (
              <AppDeleteDialog onConfirm={handleDelete} title="토픽 삭제" />
            )}

            {/* 공유 버튼 */}
            <Button
              variant="ghost"
              size="icon"
              aria-label="토픽 공유"
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white"
            >
              <Share2 size={16} />
            </Button>
          </div>
        </nav>

        {/* 타이틀 영역 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 mt-6 pointer-events-none">
          {/* 카테고리 */}
          <Badge className="mb-4 bg-indigo-500 text-white border-none px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
            {topic?.category}
          </Badge>

          {/* 제목 */}
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-[1.2] max-w-4xl break-keep drop-shadow-2xl">
            {topic?.title}
          </h1>

          {/* 메타 정보 */}
          <div className="flex items-center gap-5 mt-8 text-slate-300 text-[11px] font-bold uppercase tracking-widest">
            {/* 작성자 */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <User size={13} className="text-indigo-400" />

              <span>{authorNickname}</span>
            </div>

            {/* 작성일 */}
            <div className="flex items-center gap-2 opacity-40 font-medium">
              <Calendar size={13} />

              <span>{dayjs(topic?.created_at).format('YYYY. MM. DD')}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 본문 */}
      <section className="w-full max-w-[1200px] mx-auto px-6 -mt-16 pb-32">
        {/* 콘텐츠 카드 */}
        <article className="relative z-10 bg-slate-800 border border-white/5 rounded-[48px] py-10 md:p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)]">
          {/* 에디터 콘텐츠 */}
          <div className="prose prose-invert prose-emerald max-w-none min-h-[300px] leading-[1.9] text-slate-300 text-[17px]">
            <AppEditor value={parsedContent} readonly />
          </div>

          {/* 하단 액션 */}
          <div className="ml-10 mt-20 flex items-center justify-between">
            <div className="flex gap-3">
              {/* 조회수 */}
              <div className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-slate-900 text-slate-400 border border-white/5 font-bold text-xs uppercase">
                <Eye size={16} />
                {topic?.views.toLocaleString()} VIEWS
              </div>

              {/* 좋아요 버튼 */}
              <button
                type="button"
                disabled={toggleLike.isPending}
                onClick={() => toggleLike.mutate()}
                aria-label={isLiked ? '좋아요 취소' : '좋아요 추가'}
                className={`flex items-center gap-2.5 px-7 py-3 rounded-2xl border transition-all duration-200 font-bold text-xs active:scale-95 ${
                  isLiked
                    ? 'bg-rose-500 border-rose-400 text-white shadow-lg'
                    : 'bg-slate-900 text-slate-400 border-white/5 hover:border-slate-700'
                }`}
              >
                <Heart
                  size={16}
                  fill={isLiked ? 'white' : 'none'}
                  strokeWidth={isLiked ? 2.5 : 2}
                  className="transition-all duration-300"
                />

                {topic?.likes}
              </button>
            </div>
          </div>
        </article>

        {/* "Community" 레이블 — 댓글 박스와 분리된, 그 자체로 독립된 섹션 헤더 */}
        <div className="mt-24 px-2">
          <span className={`${communityLabelFont.className} block text-2xl text-slate-200 tracking-wide uppercase`}>
            Community
          </span>
        </div>

        {/* 댓글 영역 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-6 items-start">
          <div className="lg:col-span-8">
            <div className="px-2">
              <CommentBox topicId={topicId} />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
