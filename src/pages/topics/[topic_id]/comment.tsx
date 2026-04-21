'use client';

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import type { KeyboardEvent } from 'react';
import { CircleUserRound, MessageSquareMore, ChevronsDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

import { Separator, Textarea, Button } from '@/components/ui';
import { AppDeleteDialog } from '@/components/common';
import { QUERY_KEYS } from '@/constants/querykey.constant';

import { useComments, useCommentsCount, useAddComment, useDeleteComment } from '@/hooks/useComment';

// 날짜 포맷팅 라이브러리
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';

dayjs.extend(relativeTime);
dayjs.locale('ko');

interface CommentBoxProps {
  topicId: number;
}

export default function CommentBox({ topicId }: CommentBoxProps) {
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const newCommentRef = useRef<HTMLTextAreaElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---------------------------------------------------------
  // 1. 데이터 페칭 (사용자 정보, 댓글 목록, 총 개수)
  // ---------------------------------------------------------
  const { data: user } = useQuery({
    queryKey: QUERY_KEYS.user.me,
    queryFn: async () => {
      const { data } = await import('@/lib/supabase').then((m) => m.default.auth.getUser());
      return data.user;
    },
    staleTime: Infinity,
  });

  const { data: totalCount = 0 } = useCommentsCount(topicId);
  const { data, fetchNextPage, hasNextPage, status } = useComments(topicId);

  // 무한 스크롤 데이터를 단일 배열로 평탄화
  const comments = useMemo(() => data?.pages.flatMap((page) => page.comments) ?? [], [data]);

  // ---------------------------------------------------------
  // 2. 비즈니스 로직 (등록, 삭제)
  // ---------------------------------------------------------
  const addCommentMutation = useAddComment(topicId);
  const deleteCommentMutation = useDeleteComment(topicId);

  const handleSubmit = useCallback(() => {
    const text = newCommentRef.current?.value?.trim();

    if (!text) return toast.warning('내용을 입력해주세요.');
    if (addCommentMutation.isPending) return;

    setIsSubmitting(true);
    addCommentMutation.mutate(text, {
      onSuccess: () => {
        toast.success('댓글이 등록되었습니다.');
        if (newCommentRef.current) newCommentRef.current.value = '';
        setIsSubmitting(false);
      },
      onError: () => {
        toast.error('등록에 실패했습니다. 다시 시도해주세요.');
        setIsSubmitting(false);
      },
    });
  }, [addCommentMutation, isSubmitting]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // ---------------------------------------------------------
  // 3. 무한 스크롤 구현 (Intersection Observer)
  // ---------------------------------------------------------
  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const entry = entries[0];
      if (entry.isIntersecting && hasNextPage) fetchNextPage();
    },
    [hasNextPage, fetchNextPage]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(observerCallback, { threshold: 0.1 });
    const current = loaderRef.current;
    if (current) observer.observe(current);
    return () => {
      if (current) observer.unobserve(current);
    };
  }, [observerCallback]);

  return (
    <section className="w-full max-w-4xl mx-auto space-y-10 pb-20">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-3 px-1">
        <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <MessageSquareMore className="size-6 text-emerald-400" />
        </div>
        <h3 className="font-bold text-2xl tracking-tight flex items-center gap-2 text-zinc-100">
          댓글
          <span className="text-emerald-500 text-base font-bold bg-emerald-500/10 px-3 py-0.5 rounded-full border border-emerald-500/20">
            {totalCount}
          </span>
        </h3>
      </div>

      {/* 댓글 입력창 (UI 개선: 여백 및 가독성 최적화) */}
      <div className="relative bg-[#161618] border border-white/5 rounded-4xl p-6 shadow-2xl transition-all focus-within:border-emerald-500/40 focus-within:ring-1 focus-within:ring-emerald-500/20">
        <Textarea
          ref={newCommentRef}
          onKeyDown={handleKeyDown}
          placeholder="인사이트에 대한 의견을 자유롭게 남겨주세요... ✨"
          className="min-h-[120px] w-full bg-transparent text-zinc-100 border-none rounded-2xl focus-visible:ring-0 resize-none text-[16px] leading-relaxed placeholder:text-zinc-600 p-2 pl-4"
        />

        <div className="flex justify-end mt-4 pt-4 border-t border-white/5">
          <Button
            onClick={handleSubmit}
            disabled={addCommentMutation.isPending}
            className="h-11 px-8 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm rounded-2xl transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
          >
            {addCommentMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              '등록하기'
            )}
          </Button>
        </div>
      </div>

      <Separator className="bg-white/5" />

      {/* 댓글 리스트 영역 */}
      <div className="space-y-6">
        {status === 'pending' ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-8 text-emerald-500/30 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-24 bg-zinc-900/20 rounded-[40px] border border-dashed border-white/5">
            <p className="text-zinc-500 font-medium tracking-tight">
              아직 등록된 댓글이 없습니다. 첫 의견의 주인공이 되어보세요! 🚀
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {comments.map((c) => {
              const isOwner = c.user_id === user?.id;

              return (
                <article
                  key={c.id}
                  className={`group relative p-5 md:p-7 rounded-[36px] transition-all duration-300 ${
                    isOwner
                      ? 'bg-[#1a1a1c] border border-emerald-500/20 shadow-xl'
                      : 'bg-[#121214] border border-white/5 hover:border-white/10'
                  }`}
                >
                  <header className="flex justify-between items-start mb-4">
                    <div className="flex gap-4 items-center">
                      <div className="p-3 rounded-2xl bg-zinc-800/50 border border-white/5 text-zinc-400">
                        <CircleUserRound className="size-6" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2.5">
                          <span className="text-[15px] font-bold text-zinc-100">
                            {c.email?.split('@')[0] || '익명 사용자'}
                          </span>
                          {isOwner && (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-lg border border-emerald-400/20">
                              작성자
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-zinc-500 font-medium">
                          {dayjs(c.created_at).fromNow()}
                        </span>
                      </div>
                    </div>

                    {isOwner && (
                      <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                        <AppDeleteDialog
                          onConfirm={() => deleteCommentMutation.mutate(c.id)}
                          title="의견 삭제"
                          description="작성하신 댓글을 영구적으로 삭제하시겠습니까?"
                        />
                      </div>
                    )}
                  </header>

                  <p className="text-[16px] leading-[1.7] text-zinc-300 whitespace-pre-wrap px-1">
                    {c.content}
                  </p>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* 무한 스크롤 트리거 & 더보기 버튼 */}
      {hasNextPage && (
        <div ref={loaderRef} className="flex justify-center pt-12">
          <Button
            onClick={() => fetchNextPage()}
            variant="ghost"
            className="group flex flex-col gap-3 h-auto hover:bg-transparent text-zinc-500 hover:text-emerald-400 transition-all font-bold text-xs tracking-widest"
          >
            <span className="uppercase">더 많은 의견 불러오기</span>
            <ChevronsDown className="size-5 animate-bounce group-hover:animate-none" />
          </Button>
        </div>
      )}
    </section>
  );
}
