/**
 * @file comment.tsx
 * @description 댓글 박스 컴포넌트입니다.
 */

'use client';

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import type { KeyboardEvent } from 'react';
import { MessageSquareMore, Loader2, CircleUserRound } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

import { Textarea, Skeleton } from '@/components/ui';
import { AppDeleteDialog } from '@/components/common';
import { QUERY_KEYS } from '@/constants/querykey.constant';
import { getUserNicknames } from '@/services/useService';

import { useComments, useCommentsCount, useAddComment, useDeleteComment } from '@/hooks/useComment';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';

dayjs.extend(relativeTime);
dayjs.locale('ko');

interface CommentBoxProps {
  topicId: number;
}

// 원형 사용자 아이콘 — 사용자별 색상 구분 없이 통일된 기본 아이콘
function AvatarIcon({ size = 'size-9' }: { size?: string }) {
  return (
    <div
      className={`shrink-0 ${size} rounded-2xl bg-white/[0.04] ring-1 ring-white/10 flex items-center justify-center`}
    >
      <CircleUserRound className="size-[58%] text-slate-500" strokeWidth={1.5} />
    </div>
  );
}

function CommentSkeleton() {
  return (
    <div className="flex gap-3 py-4">
      <Skeleton className="size-9 rounded-2xl shrink-0 bg-white/5" />
      <div className="flex-1 space-y-2 pt-0.5">
        <Skeleton className="h-3 w-24 bg-white/5" />
        <Skeleton className="h-3.5 w-4/5 bg-white/5" />
      </div>
    </div>
  );
}

export function CommentBox({ topicId }: CommentBoxProps) {
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const newCommentRef = useRef<HTMLTextAreaElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftLength, setDraftLength] = useState(0);

  const { data: user } = useQuery({
    queryKey: QUERY_KEYS.user.me,
    queryFn: async () => {
      const { createClientComponentClient } = await import('@/lib/supabase');
      const supabase = createClientComponentClient();
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
    staleTime: Infinity,
  });

  const { data: totalCount = 0 } = useCommentsCount(topicId);
  const { data, fetchNextPage, hasNextPage, status } = useComments(topicId);

  const comments = useMemo(() => data?.pages.flatMap((page) => page.comments) ?? [], [data]);

  const authorIds = useMemo(
    () => comments.map((c) => c.user_id).filter(Boolean) as string[],
    [comments]
  );

  const { data: nicknameMap = {} } = useQuery({
    queryKey: ['user', 'nicknames', [...authorIds].sort().join(',')],
    queryFn: () => getUserNicknames(authorIds),
    enabled: authorIds.length > 0,
    staleTime: 1000 * 60 * 30,
  });

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
        setDraftLength(0);
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

  const hasDraft = draftLength > 0;

  return (
    <section className="w-full max-w-4xl mx-auto pb-4">
      {/* 댓글 개수 라벨 */}
      <div className="flex items-center gap-1.5 mb-6 text-slate-500">
        <MessageSquareMore className="size-3.5 text-indigo-400/80" />
        <span className="text-xs font-bold tabular-nums">댓글 {totalCount}개</span>
      </div>

      {/* 댓글 작성 폼 */}
      <div className="flex gap-3 items-start mb-8">
        <div className="hidden sm:block pt-0.5">
          <AvatarIcon />
        </div>

        <div className="flex-1 min-w-0 bg-white/[0.08] border border-white/[0.14] rounded-2xl p-3.5 focus-within:border-indigo-400/40 transition-colors duration-200">
          <Textarea
            ref={newCommentRef}
            onKeyDown={handleKeyDown}
            onChange={(e) => setDraftLength(e.target.value.length)}
            maxLength={500}
            placeholder="인사이트에 대한 의견을 남겨주세요..."
            className="min-h-[44px] w-full bg-transparent text-[14.5px] text-slate-100 border-none rounded-none focus-visible:ring-0 resize-none leading-relaxed placeholder:text-slate-400 p-0"
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
            <span className="text-[11px] font-medium text-slate-600 tabular-nums">{draftLength}/500</span>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={addCommentMutation.isPending}
              className={`flex items-center gap-1.5 h-8 px-4 rounded-full font-bold text-xs transition-all duration-200 disabled:opacity-60 ${
                hasDraft
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-950/40'
                  : 'bg-white/[0.06] text-slate-500'
              }`}
            >
              {addCommentMutation.isPending ? <Loader2 className="size-3.5 animate-spin" /> : '등록'}
            </button>
          </div>
        </div>
      </div>

      {/* 댓글 목록 */}
      {status === 'pending' ? (
        <div className="divide-y divide-white/[0.12]">
          <CommentSkeleton />
          <CommentSkeleton />
        </div>
      ) : comments.length === 0 ? (
        <div className="flex items-center gap-3 py-10">
          <div className="shrink-0 size-10 rounded-full border border-dashed border-white/10 flex items-center justify-center">
            <MessageSquareMore className="size-4 text-slate-600" />
          </div>
          <p className="text-slate-500 font-medium tracking-tight text-sm">
            아직 등록된 댓글이 없습니다. 첫 의견의 주인공이 되어보세요! 🚀
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-white/[0.12]">
          {comments.map((c) => {
            const isOwner = c.user_id === user?.id;
            const nickname = nicknameMap[c.user_id] || '알 수 없는 사용자';

            return (
              <article key={c.id} className="group relative flex gap-3 py-4">
                <AvatarIcon />

                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[13.5px] font-bold text-slate-100 truncate">{nickname}</span>
                    {isOwner && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-300">
                        <span className="size-1 rounded-full bg-indigo-400" />
                        작성자
                      </span>
                    )}
                    <span className="text-xs text-slate-600">·</span>
                    <span className="text-xs text-slate-500">{dayjs(c.created_at).fromNow()}</span>
                  </div>
                  <p className="text-[14px] leading-[1.65] text-slate-300 whitespace-pre-wrap break-words">
                    {c.content}
                  </p>
                </div>

                {isOwner && (
                  <div className="absolute right-0 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <AppDeleteDialog
                      onConfirm={() => deleteCommentMutation.mutate(c.id)}
                      title="의견 삭제"
                      description="작성하신 댓글을 영구적으로 삭제하시겠습니까?"
                      trigger={
                        <button
                          type="button"
                          className="size-7 rounded-full flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="삭제"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            className="size-3.5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6h16Z" />
                          </svg>
                        </button>
                      }
                    />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {hasNextPage && (
        <div ref={loaderRef} className="flex justify-center pt-5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-white/[0.03] px-4 py-1.5 rounded-full">
            <Loader2 className="size-3.5 text-indigo-400 animate-spin" />
            더 불러오는 중
          </div>
        </div>
      )}
    </section>
  );
}
