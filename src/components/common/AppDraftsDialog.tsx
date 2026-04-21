/**
 * @file AppDraftsDialog.tsx
 * @description
 * - React.memo와 useMemo를 결합한 극강의 렌더링 최적화
 * - '방금 전', 'n시간 전' 등 상대 시간 UI 및 호버 인터랙션 구현
 * - GPU 가속 및 레이아웃 격리(Containment)를 통한 스크롤 성능 확보
 */

import type React from 'react';
import { useCallback, useMemo, useState, memo } from 'react';
import { useNavigate } from 'react-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores';
import { QUERY_KEYS } from '@/constants/querykey.constant';
import { fetchDrafts, deleteTopic } from '@/services/topicService';

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
import { Loader2, Inbox, Clock } from 'lucide-react';

// 상대 시간 플러그인 적용
dayjs.extend(relativeTime);
dayjs.locale('ko');

// ----------------------------------------------------------------------
// 🔹 타입 정의
// ----------------------------------------------------------------------
interface Draft {
  id: number;
  title: string;
  created_at: string;
}

interface DraftItemProps {
  draft: Draft;
  index: number;
  onNavigate: (id: number) => void;
  onDelete: (id: number) => void;
}

// ----------------------------------------------------------------------
// 🔹 개별 리스트 아이템 (성능 최적화를 위한 메모이제이션)
// ----------------------------------------------------------------------
const DraftItem = memo(({ draft, index, onNavigate, onDelete }: DraftItemProps) => {
  return (
    <div
      onClick={() => onNavigate(draft.id)}
      className="group flex items-center justify-between py-3.5 px-2 border-b border-white/3 hover:bg-white/2 transition-colors cursor-pointer"
      style={{ transform: 'translateZ(0)' }} // GPU 가속 유도
    >
      <div className="flex items-center gap-4 overflow-hidden">
        <span className="text-[10px] font-black text-zinc-700 group-hover:text-emerald-500 transition-colors">
          {(index + 1).toString().padStart(2, '0')}
        </span>
        <div className="flex flex-col gap-0.5 overflow-hidden">
          <h3 className="text-[13.5px] font-semibold text-zinc-300 group-hover:text-white truncate pr-4">
            {draft.title || '제목이 없는 토픽'}
          </h3>
          <div className="flex items-center gap-1 text-[10px] text-zinc-600">
            <Clock className="w-3 h-3 text-zinc-700" />
            <span>{dayjs(draft.created_at).fromNow()}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div
          onClick={(e) => e.stopPropagation()}
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-out"
        >
          <AppDeleteDialog
            onConfirm={() => onDelete(draft.id)}
            title="임시 저장 삭제"
            description="정말 이 토픽을 보관함에서 삭제할까요?"
          />
        </div>
        <Badge
          variant="outline"
          className="text-[10px] px-2 h-5 border-zinc-800 text-zinc-500 bg-zinc-900/50 group-hover:border-emerald-500/40 group-hover:text-emerald-400 transition-all"
        >
          작성중
        </Badge>
      </div>
    </div>
  );
});

DraftItem.displayName = 'DraftItem';

// ----------------------------------------------------------------------
// 🔹 메인 다이얼로그 컴포넌트
// ----------------------------------------------------------------------
export function AppDraftsDialog({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);

  const { data: drafts = [], isLoading } = useQuery<Draft[]>({
    queryKey: QUERY_KEYS.drafts(user?.id),
    queryFn: () => fetchDrafts(user!.id),
    enabled: !!user?.id,
  });

  const handleNavigate = useCallback(
    (id: number) => {
      setOpen(false);
      navigate(`/topics/create/${id}`);
    },
    [navigate]
  );

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteTopic(id);
        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.drafts(user?.id) });
      } catch (e) {
        console.error('삭제 처리 중 오류:', e);
      }
    },
    [queryClient, user?.id]
  );

  // 🔹 리스트 렌더링 최적화 (useMemo 적용)
  const renderedDrafts = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin mb-2 text-emerald-500" />
          <p className="text-xs font-medium">보관함을 확인하고 있어요</p>
        </div>
      );
    }

    if (drafts.length === 0) {
      return (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <Inbox className="w-8 h-8 text-zinc-800 mb-2" />
          <p className="text-zinc-600 text-[13px] leading-relaxed">
            임시 저장된 토픽이 없습니다.
            <br />
            새로운 통찰을 기록해보세요.
          </p>
        </div>
      );
    }

    return drafts.map((draft, index) => (
      <DraftItem
        key={draft.id}
        draft={draft}
        index={index}
        onNavigate={handleNavigate}
        onDelete={handleDelete}
      />
    ));
  }, [drafts, isLoading, handleNavigate, handleDelete]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="relative inline-flex cursor-pointer group select-none">
          {children}
          {drafts.length > 0 && (
            <span className="absolute -top-1 left-8 flex h-5 w-5 z-50">
              <span className="animate-ping absolute h-full w-full rounded-full bg-red-500 opacity-30"></span>
              <span className="relative rounded-full h-5 w-5 bg-red-500 border-2 border-zinc-950 text-[9px] font-black text-black flex items-center justify-center">
                {drafts.length > 9 ? '9+' : drafts.length}
              </span>
            </span>
          )}
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-[420px] bg-[#0c0c0e] border-white/5 p-7 rounded-[28px] shadow-2xl focus:outline-none">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-emerald-500 rounded-full" />
            <DialogTitle className="text-xl font-bold text-white tracking-tight italic">
              임시 저장 보관함
            </DialogTitle>
          </div>
          <DialogDescription className="text-[13px] text-zinc-500 leading-relaxed">
            작성하던 생각을 이어서 완성해보세요. 삭제한 데이터는 복구되지 않습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 overflow-hidden">
          <div className="flex items-end justify-between mb-2.5 px-1 font-bold">
            <span className="text-[11px] text-zinc-600 tracking-wider">보관된 목록</span>
            <div className="flex items-center gap-1 text-emerald-500">
              <span className="text-[14px] leading-none">{drafts.length}</span>
              <span className="text-[11px] font-medium">개의 토픽</span>
            </div>
          </div>
          <Separator className="bg-white/5" />

          <div
            className="w-full mt-2 max-h-[260px] overflow-y-auto scrollbar-hide"
            style={{
              contain: 'content', // 레이아웃 격리를 통한 스크롤 최적화
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {renderedDrafts}
          </div>
        </div>

        <DialogFooter className="mt-5">
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="w-full h-11 text-[13px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 rounded-xl transition-all"
            >
              나중에 할게요
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
