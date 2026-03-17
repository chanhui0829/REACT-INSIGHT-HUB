'use client';

import { useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { ArrowLeft, Eye, Heart } from 'lucide-react';

import supabase from '@/lib/supabase';
import { useAuthStore } from '@/stores';
import { AppDeleteDialog, AppEditor } from '@/components/common';
import { Button, Separator } from '@/components/ui';
import CommentBox from './comment';

import type { Topic } from '@/types/topic.type';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function TopicDetail() {
  const { id } = useParams();
  const topicId = Number(id);
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  // ======================================================
  // 🔥 1. 토픽 데이터 가져오기
  // ======================================================
  const { data: topic, isLoading } = useQuery<Topic | null>({
    queryKey: ['topic', topicId],
    queryFn: async () => {
      const { data, error } = await supabase.from('topic').select('*').eq('id', topicId).single();

      if (error) throw error;
      return data as Topic;
    },
    enabled: !!topicId,
  });

  // ======================================================
  // 🔥 2. 조회수 +1 (Optimistic Update)
  // ======================================================
  const increaseViews = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('increment_topic_views', { topic_id: topicId });
      if (error) throw error;
      return data;
    },

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['topic', topicId] });

      const prev = queryClient.getQueryData<Topic | null>(['topic', topicId]);

      if (prev) {
        queryClient.setQueryData(['topic', topicId], {
          ...prev,
          views: prev.views + 1,
        });
      }

      return { prev };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(['topic', topicId], ctx.prev);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['topic', topicId] });
      queryClient.invalidateQueries({ queryKey: ['topics'] }); // 목록에도 반영
    },
  });

  // 🔥 첫 렌더링 시 조회수 증가
  useEffect(() => {
    if (topicId) increaseViews.mutate();
  }, [topicId]);

  // ======================================================
  // 🔥 3. 좋아요 정보 가져오기 (topic_likes 기반)
  // ======================================================
  const { data: likesData = [] } = useQuery({
    queryKey: ['topicLikes', topicId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('topic_likes')
        .select('user_id')
        .eq('topic_id', topicId);

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!topicId,
  });

  const likesCount = likesData.length;
  const isLiked = likesData.some((row) => row.user_id === user?.id);

  // ======================================================
  // 🔥 4. 좋아요 토글
  // ======================================================
  const toggleLike = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('로그인이 필요합니다.');
      const { data, error } = await supabase.rpc('toggle_topic_like', {
        p_topic_id: topicId,
      });
      if (error) throw error;
      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['topicLikes', topicId] });
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['topic', topicId] });
    },

    onError: () => {
      toast.error('좋아요 처리 중 오류가 발생했습니다.');
    },
  });

  // ======================================================
  // 🔥 5. 삭제 기능
  // ======================================================
  const handleDelete = useCallback(async () => {
    try {
      const { error } = await supabase.from('topic').delete().eq('id', topicId);
      if (error) throw error;

      toast.success('토픽이 삭제되었습니다.');
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error('토픽 삭제 중 오류가 발생했습니다.');
    }
  }, [topicId, navigate]);

  // ======================================================
  // 🔥 로딩 처리
  // ======================================================
  if (isLoading) {
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

  // ======================================================
  // 🔥 렌더링
  // ======================================================
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

      {/* ============================ */}
      {/* 본문 */}
      {/* ============================ */}
      <div className="w-full py-10">
        <AppEditor value={JSON.parse(topic.content)} readonly />
      </div>

      {/* ============================ */}
      {/* 좋아요 & 조회수 */}
      {/* ============================ */}
      <div className="p-4">
        <div className="flex gap-4 mt-4 items-center justify-end text-[16px] pr-6">
          {/* 조회수 */}
          <div className="flex items-center gap-1.5 text-gray-200">
            <Eye size={22} />
            <span>{topic.views}</span>
          </div>

          {/* 좋아요 */}
          <button
            className={`flex items-center gap-1.5 transition cursor-pointer ${
              isLiked ? 'text-red-500' : 'text-gray-200'
            }`}
            onClick={() => toggleLike.mutate()}
          >
            <Heart size={22} fill={isLiked ? 'currentColor' : 'none'} />
            <span>{likesCount}</span>
          </button>
        </div>
      </div>

      <Separator />

      {/* ============================ */}
      {/* 댓글 */}
      {/* ============================ */}
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
