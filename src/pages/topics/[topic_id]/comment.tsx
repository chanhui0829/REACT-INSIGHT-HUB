'use client';

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import type { KeyboardEvent } from 'react';
import { CircleUserRound, MessageSquareMore, Loader2 } from 'lucide-react';
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
    <section className="w-full max-w-4xl mx-auto space-y-8 pb-20">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-3 px-1">
        <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <MessageSquareMore className="size-5 text-indigo-400" />
        </div>
        <h3 className="font-bold text-xl tracking-tight flex items-center gap-2 text-slate-100">
          댓글
          <span className="text-indigo-400 text-sm font-bold bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
            {totalCount}
          </span>
        </h3>
      </div>

      {/* 댓글 입력창 - 더 컴팩트하고 미니멀한 디자인 */}
      <div className="relative bg-slate-900/40 border border-white/10 rounded-2xl p-4 shadow-lg transition-all focus-within:border-indigo-500/30 focus-within:ring-1 focus-within:ring-indigo-500/10">
        <Textarea
          ref={newCommentRef}
          onKeyDown={handleKeyDown}
          placeholder="인사이트에 대한 의견을 자유롭게 남겨주세요..."
          className="min-h-[80px] w-full bg-transparent text-slate-100 border-none rounded-xl focus-visible:ring-0 resize-none text-sm leading-relaxed placeholder:text-slate-500 p-2"
        />

        <div className="flex justify-end mt-3">
          <Button
            onClick={handleSubmit}
            disabled={addCommentMutation.isPending}
            className="h-9 px-5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-full transition-all shadow-md shadow-indigo-500/10 active:scale-95"
          >
            {addCommentMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              '등록'
            )}
          </Button>
        </div>
      </div>

      <Separator className="bg-white/5" />

      {/* 댓글 리스트 영역 - 더 컴팩트한 카드 디자인 */}
      <div className="space-y-4">
        {status === 'pending' ? (
          <div className="flex justify-center py-16">
            <Loader2 className="size-6 text-indigo-500/30 animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/20 rounded-2xl border border-dashed border-white/5">
            <p className="text-slate-500 font-medium tracking-tight text-sm">
              아직 등록된 댓글이 없습니다. 첫 의견의 주인공이 되어보세요! 🚀
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => {
              const isOwner = c.user_id === user?.id;

              return (
                <article
                  key={c.id}
                  className={`group relative p-4 rounded-2xl transition-all duration-300 ${
                    isOwner
                      ? 'bg-slate-900/50 border border-indigo-500/15'
                      : 'bg-slate-900/30 border border-white/5 hover:border-white/10'
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center">
                      <CircleUserRound className="size-4 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-100 truncate">
                          {c.email?.split('@')[0] || '익명 사용자'}
                        </span>
                        {isOwner && (
                          <span className="text-[10px] font-bold text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded-md border border-indigo-400/20">
                            작성자
                          </span>
                        )}
                        <span className="text-xs text-slate-500">
                          {dayjs(c.created_at).fromNow()}
                        </span>
                      </div>
                      <p className="text-sm leading-[1.6] text-slate-300 whitespace-pre-wrap">
                        {c.content}
                      </p>
                    </div>
                    {isOwner && (
                      <div className="opacity-0 group-hover:opacity-100 transition-all">
                        <AppDeleteDialog
                          onConfirm={() => deleteCommentMutation.mutate(c.id)}
                          title="의견 삭제"
                          description="작성하신 댓글을 영구적으로 삭제하시겠습니까?"
                        />
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* 무한 스크롤 트리거 */}
      {hasNextPage && (
        <div ref={loaderRef} className="flex justify-center pt-4">
          <Loader2 className="size-5 text-indigo-500/30 animate-spin" />
        </div>
      )}
    </section>
  );
}
