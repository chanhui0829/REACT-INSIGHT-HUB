'use client';

import { useEffect, useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { ArrowLeft, Eye, Heart, Calendar, Share2, User, Bookmark, Link2, Printer, TrendingUp } from 'lucide-react';

import { useAuthStore } from '@/stores';
import { AppDeleteDialog, AppEditor } from '@/components/common';
import { Button, Badge } from '@/components/ui';
import CommentBox from './comment';
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

const TRENDING_TOPICS = [
  { id: 1, title: 'Next.js 14의 서버 컴포넌트 이해하기', category: 'React', likes: 42 },
  { id: 2, title: '효율적인 상태 관리를 위한 Zustand 활용법', category: 'State', likes: 38 },
  { id: 3, title: '2026년 프론트엔드 디자인 트렌드 분석', category: 'Design', likes: 35 },
  { id: 4, title: 'TypeScript 5.0 신규 기능 살펴보기', category: 'TypeScript', likes: 29 },
];

const QUICK_ACTIONS = [
  { icon: Link2, label: '링크 복사', action: 'copy' },
  { icon: Bookmark, label: '북마크', action: 'bookmark' },
  { icon: Printer, label: '인쇄', action: 'print' },
];

const parseEditorContent = (raw: string | Block[] | null | undefined): Block[] => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Block[]) : [];
  } catch {
    return [];
  }
};

export default function TopicDetail() {
  const { id } = useParams();
  const topicId = Number(id);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const { data: topic, isLoading } = useTopicDetail(topicId);
  const { data: likesData = [] } = useTopicLikes(topicId);
  const increaseViews = useIncreaseViews(topicId);
  const toggleLike = useToggleLike(topicId, user?.id);
  const deleteMutation = useDeleteTopic(topicId);
  const { handleCommentInsert, handleCommentDelete } = useCommentRealtimeHandlers(topicId);
  const { handleLikeInsert, handleLikeDelete } = useTopicRealtimeHandlers(topicId);

  const [authorNickname, setAuthorNickname] = useState('알 수 없는 사용자');

  useEffect(() => {
    if (!topic?.author) {
      setAuthorNickname('알 수 없는 사용자');
      return;
    }

    getUserNickname(topic.author).then(setAuthorNickname);
  }, [topic?.author]);

  const isLiked = useMemo(
    () => likesData.some((row) => row.user_id === user?.id),
    [likesData, user?.id]
  );
  const parsedContent = useMemo(() => parseEditorContent(topic?.content), [topic?.content]);

  useEffect(() => {
    if (topicId) increaseViews.mutate();
  }, [topicId]);

  useEffect(() => {
    if (!topicId) return;

    const channel = subscribeTopicRealtime(topicId, {
      onCommentInsert: (payload) => {
        void handleCommentInsert(payload);
      },
      onCommentDelete: handleCommentDelete,
      onLikeInsert: handleLikeInsert,
      onLikeDelete: handleLikeDelete,
    });

    return () => {
      void channel.unsubscribe();
    };
  }, [topicId, handleCommentInsert, handleCommentDelete, handleLikeInsert, handleLikeDelete]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync();
      toast.success('토픽이 삭제되었습니다.');
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error('삭제 처리 중 오류가 발생했습니다.');
    }
  }, [deleteMutation, navigate]);

  if (isLoading && !topic) return <div className="min-h-screen bg-[#0a0a0a]" />;

  return (
    /* 1. pt를 통해 fixed 헤더 높이(66px)만큼 정확히 밀어냄 */
    <main className="relative w-full min-h-screen bg-[#0a0a0a] text-zinc-100 pt-[66px] overflow-x-hidden">
      {/* 2. 배경 이미지 영역: w-full + max-w-none으로 부모 제약 해제 */}
      <header className="relative w-full h-[400px] md:h-[450px] overflow-hidden">
        {/* 이미지가 꽉 안 차는 문제를 방지하기 위해 110% 너비로 강제 확장 후 중앙 정렬 */}
        <div
          className="absolute inset-0 w-screen left-1/2 -translate-x-1/2 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${topic?.thumbnail || '/assets/default-thumbnail.png'})` }}
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-linear-to-t from-[#0a0a0a] via-transparent to-transparent" />

        <nav className="relative z-20 w-full max-w-7xl mx-auto px-6 pt-6 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white px-5 h-10 text-xs font-bold hover:bg-white/10 transition-all"
          >
            <ArrowLeft size={16} className="mr-2" /> Back
          </Button>

          <div className="flex gap-3">
            {topic?.author === user?.id && (
              <AppDeleteDialog onConfirm={handleDelete} title="토픽 삭제" />
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="토픽 공유"
              className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 text-white "
            >
              <Share2 size={16} />
            </Button>
          </div>
        </nav>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 mt-6 pointer-events-none">
          <Badge className="mb-4 bg-indigo-500 text-white border-none px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
            {topic?.category}
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-[1.2] max-w-4xl break-keep drop-shadow-2xl">
            {topic?.title}
          </h1>
          <div className="flex items-center gap-5 mt-8 text-zinc-300 text-[11px] font-bold uppercase tracking-widest">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <User size={13} className="text-indigo-400" />
              <span>{authorNickname}</span>
            </div>
            <div className="flex items-center gap-2 opacity-40 font-medium">
              <Calendar size={13} />
              <span>{dayjs(topic?.created_at).format('YYYY. MM. DD')}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 본문 레이아웃 */}
      <section className="w-full max-w-[1200px] mx-auto px-6 -mt-16 pb-32">
        <article className="relative z-10 bg-[#121214] border border-white/5 rounded-[48px] py-10 md:p-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)]">
          <div className="prose prose-invert prose-emerald max-w-none min-h-[300px] leading-[1.9] text-zinc-300 text-[17px]">
            <AppEditor value={parsedContent} readonly />
          </div>

          <div className="ml-10 mt-20 flex items-center justify-between">
            <div className="flex gap-3">
              <div className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-zinc-900 text-zinc-400 border border-white/5 font-bold text-xs uppercase">
                <Eye size={16} /> {topic?.views.toLocaleString()} VIEWS
              </div>
              <button
                disabled={toggleLike.isPending}
                onClick={() => toggleLike.mutate()}
                aria-label={isLiked ? '좋아요 취소' : '좋아요 추가'}
                className={`flex items-center gap-2.5 px-7 py-3 rounded-2xl border transition-all font-bold text-xs active:scale-95 ${
                  isLiked
                    ? 'bg-rose-500 border-rose-400 text-white shadow-lg'
                    : 'bg-zinc-900 text-zinc-400 border-white/5'
                }`}
              >
                <Heart size={16} fill={isLiked ? 'white' : 'none'} /> {topic?.likes}
              </button>
            </div>
          </div>
        </article>

        {/* 3. 댓글 영역 + 우측 Sticky 추천 토픽 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-24 items-start">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-4 mb-12 px-2">
              <h3 className="text-3xl font-black tracking-tighter italic">Discussions</h3>
              <div className="h-px flex-1 bg-white/5" />
            </div>
            <div className="px-2">
              <CommentBox topicId={topicId} />
            </div>
          </div>

          {/* Sticky Sidebar: 오직 댓글 영역 우측에만 존재 */}
          <aside className="hidden lg:block lg:col-span-4 mt-20">
            <div className="sticky top-[calc(66px+40px)] space-y-8 pl-8 border-l border-white/5">
              {/* Quick Actions Section */}
              <section>
                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-6 px-2">
                  Quick Actions
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.action}
                      onClick={() => {
                        if (action.action === 'copy') {
                          navigator.clipboard.writeText(window.location.href);
                          toast.success('링크가 복사되었습니다.');
                        } else if (action.action === 'bookmark') {
                          toast.info('북마크 기능이 곧 추가될 예정입니다.');
                        } else if (action.action === 'print') {
                          window.print();
                        }
                      }}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-slate-900/40 border border-white/10 hover:border-indigo-500/30 hover:bg-slate-900/60 transition-all group"
                    >
                      <action.icon size={18} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                      <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-300 transition-colors">
                        {action.label}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Trending Topics Section */}
              <section>
                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-purple-400 mb-6 px-2 flex items-center gap-2">
                  <TrendingUp size={12} />
                  Trending Topics
                </h4>
                <div className="space-y-2">
                  {TRENDING_TOPICS.map((topic) => (
                    <div
                      key={topic.id}
                      className="group p-4 rounded-2xl bg-slate-900/30 border border-white/5 hover:border-indigo-500/20 hover:bg-slate-900/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-bold text-sm leading-snug text-slate-200 group-hover:text-indigo-400 transition-colors line-clamp-2 break-keep mb-2">
                            {topic.title}
                          </h5>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                              {topic.category}
                            </span>
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                              <Heart size={10} className="fill-rose-500 text-rose-500" />
                              {topic.likes}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
