import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import dayjs from 'dayjs';
import { toast } from 'sonner';

import { useAuthStore } from '@/stores';
import supabase from '@/lib/supabase';

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Separator,
} from '@/components/ui';

import { DialogClose } from '@radix-ui/react-dialog';
import { AppDeleteDialog } from './AppDeleteDialog';
import { TOPIC_STATUS, type Topic } from '@/types/topic.type';
// ✅ useQuery와 useQueryClient 추가
import { useQuery, useQueryClient } from '@tanstack/react-query';

// ------------------------------
// 🔹 Props 타입 정의
// ------------------------------
interface Props {
  children: React.ReactNode;
}

// ------------------------------
// 🔹 AppDraftsDialog 컴포넌트
// ------------------------------
export function AppDraftsDialog({ children }: Props) {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  // Dialog가 열렸는지 감지 (상태값은 유지하되, 데이터 패칭은 useQuery가 담당)
  const [open, setOpen] = useState(false);

  // ------------------------------
  // 🔹 임시 저장 토픽 조회 (React Query 도입)
  // ------------------------------
  const { data: drafts = [], isLoading } = useQuery({
    queryKey: ['drafts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('topic')
        .select('*')
        .eq('author', user.id)
        .eq('status', TOPIC_STATUS.TEMP)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as Topic[]) || [];
    },
    enabled: !!user?.id, // 유저가 있을 때만 실행
  });

  // ------------------------------
  // 🔹 삭제 핸들러 (메모이징)
  // ------------------------------
  const handleDelete = useCallback(
    async (id: number) => {
      try {
        const { error } = await supabase.from('topic').delete().eq('id', id);
        if (error) throw error;

        // ✅ 삭제 성공 후 쿼리 무효화 (목록 새로고침)
        await queryClient.invalidateQueries({ queryKey: ['drafts', user?.id] });
        toast.success('임시 저장된 토픽이 삭제되었습니다.');
      } catch (error) {
        console.error(error);
        toast.error('삭제 중 오류가 발생했습니다.');
      }
    },
    [queryClient, user?.id]
  );

  // ------------------------------
  // 🔹 리스트 UI useMemo로 캐싱
  // ------------------------------
  const draftList = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-60 text-muted-foreground/50">
          불러오는 중...
        </div>
      );
    }

    // ✅ 에러 방지: drafts가 배열인지 확실히 체크
    if (!Array.isArray(drafts) || drafts.length === 0) {
      return (
        <div className="min-h-60 flex items-center justify-center">
          <p className="text-muted-foreground/50">임시 저장된 토픽이 없습니다.</p>
        </div>
      );
    }

    return (
      <div className="w-full max-w-2xl mx-auto h-80 space-y-2 mt-3 overflow-y-auto pr-1">
        {drafts.map((draft, index) => (
          <div
            key={draft.id}
            className="w-full flex items-center py-2 px-4 gap-3 rounded-md bg-card/50 cursor-pointer hover:bg-card/70 transition "
            onClick={() => {
              setOpen(false); // 다이얼로그 닫기
              navigate(`/topics/create/${draft.id}`);
            }}
          >
            <div className="flex justify-between w-full items-start">
              <div className="flex w-full items-start gap-2 overflow-hidden">
                <Badge className="w-5 h-5 mt-2 mr-3 rounded-sm aspect-square text-foreground bg-[#E26F24] hover:bg-[#E26F24]">
                  {index + 1}
                </Badge>

                <div className="flex flex-col w-[calc(100%-2rem)]">
                  <p className="line-clamp-1 break-all pr-4 font-medium">
                    {draft.title || '(제목 없음)'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    작성일: {dayjs(draft.created_at).format('YYYY. MM. DD')}
                  </p>
                </div>
              </div>

              <Badge className="mt-2" variant="outline">
                작성중
              </Badge>
            </div>

            {/* 삭제 버튼 */}
            <div
              onClick={(e) => e.stopPropagation()} // 🔥 부모 onClick 전파 방지
            >
              <AppDeleteDialog
                onConfirm={() => handleDelete(draft.id)}
                title="정말 이 토픽을 삭제하시겠습니까?"
                description="삭제된 토픽은 복구할 수 없습니다."
              />
            </div>
          </div>
        ))}
      </div>
    );
  }, [drafts, isLoading, navigate, handleDelete]);

  // ------------------------------
  // 🔹 렌더링
  // ------------------------------
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="relative inline-flex cursor-pointer">
          {children}
          {Array.isArray(drafts) && drafts.length > 0 && (
            <span className="absolute top-[1px] right-[-1px] flex h-3 w-3 z-[50]">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border-2 border-zinc-900"></span>
            </span>
          )}
        </div>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>임시 저장된 토픽</DialogTitle>
          <DialogDescription>
            임시 저장된 토픽 목록입니다. 이어서 작성하거나 삭제할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          <div className="flex items-center gap-2">
            <p>임시 저장</p>
            <p className="text-base text-emerald-500 -mr-[6px]">
              {Array.isArray(drafts) ? drafts.length : 0}
            </p>
            <p>건</p>
          </div>

          <Separator />

          {/* 리스트 */}
          {draftList}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="border-0">
              닫기
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
