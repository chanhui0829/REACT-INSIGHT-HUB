'use client'; //질문

import { useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { ArrowLeft, Eye, Heart } from 'lucide-react';

import { useAuthStore } from '@/stores';
import { AppDeleteDialog, AppEditor } from '@/components/common';
import { Button, Separator } from '@/components/ui';
import CommentBox from './comment';

// hook
import {
  useTopicDetail,
  useTopicLikes,
  useIncreaseViews,
  useToggleLike,
  useDeleteTopic,
} from '@/hooks/useTopic';

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

  const isLiked = likesData.some((row) => row.user_id === user?.id);

  const isInitialLoading = isLoading && !topic;

  useEffect(() => {
    if (topicId) increaseViews.mutate();
  }, [topicId]);

  const handleDelete = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync();

      toast.success('토픽이 삭제되었습니다.');
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error('토픽 삭제 중 오류가 발생했습니다.');
    }
  }, [deleteMutation, navigate]);

  if (isInitialLoading) {
    return (
      <div className="flex justify-center items-center min-h-[500px] text-zinc-400">
        토픽 정보를 불러오는 중입니다...
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="flex justify-center items-center min-h-[500px] text-zinc-400">
        존재하지 않는 토픽입니다.
      </div>
    );
  }

  return (
    <main className="w-full min-h-[720px] flex flex-col">
      {/* ============================ */}
      {/* 썸네일 */}
      {/* ============================ */}
      <div
        className="relative w-full h-60 md:h-100 bg-cover bg-[50%_35%] bg-accent"
        style={{ backgroundImage: `url(${topic.thumbnail})` }}
      >
        <div className="absolute top-6 left-6 z-10 flex items-center gap-2 mt-5">
          <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft />
          </Button>

          {topic.author === user?.id && (
            <AppDeleteDialog
              onConfirm={handleDelete}
              title="정말 해당 토픽을 삭제하시겠습니까?"
              description="삭제 시 모든 내용이 영구적으로 삭제됩니다."
            />
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-l from-[#0a0a0a] via-transparent to-transparent" />
      </div>

      {/* ============================ */}
      {/* 제목 영역 */}
      {/* ============================ */}
      <section className="relative w-full flex flex-col items-center -mt-40 text-center">
        <span className="mb-3 text-accent-foreground text-sm">{topic.category}</span>
        <h1 className="font-extrabold tracking-tight text-xl sm:text-2xl md:text-4xl">
          {topic.title}
        </h1>

        <Separator className="!w-6 my-6 bg-foreground" />

        <span className="text-sm text-zinc-500">
          {dayjs(topic.created_at).format('YYYY.MM.DD')}
        </span>
      </section>

      <div className="w-full py-10">
        <AppEditor value={JSON.parse(topic.content)} readonly />
      </div>

      <div className="p-4">
        <div className="flex gap-4 mt-4 items-center justify-end text-[16px] pr-6">
          <div className="flex items-center gap-1.5 text-gray-200">
            <Eye size={22} />
            <span>{topic.views}</span>
          </div>

          <button
            disabled={toggleLike.isPending}
            className={`flex items-center gap-1.5 transition cursor-pointer ${
              isLiked ? 'text-red-500' : 'text-gray-200'
            }`}
            onClick={() => toggleLike.mutate()}
          >
            <Heart size={22} fill={isLiked ? 'currentColor' : 'none'} />
            <span>{topic.likes}</span>
          </button>
        </div>
      </div>

      <Separator />

      <div className="relative bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
        <div className="z-10 flex justify-center gap-3 px-0 py-8 items-start">
          <section className="flex-1 max-w-4xl">
            <CommentBox topicId={topicId} />
          </section>

          <aside className="hidden lg:block w-[320px] mr-20 space-y-6 sticky top-20">
            <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 shadow-lg backdrop-blur-sm">
              <h3 className="text-white font-semibold text-lg mb-3 flex items-center gap-2">
                🔥 인기 토픽
              </h3>
              <ul className="space-y-2 text-zinc-400 text-sm">
                {[
                  'React vs Vue 논쟁',
                  'Supabase 인증 완전정복',
                  'Tailwind로 포트폴리오 만들기',
                  'Next.js App Router 2025 패턴',
                ].map((item, i) => (
                  <li key={i} className="hover:text-emerald-400 cursor-pointer transition-colors">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
