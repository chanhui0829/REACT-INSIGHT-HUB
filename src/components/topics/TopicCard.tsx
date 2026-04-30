/**
 * @file TopicCard.tsx
 * @description 토픽 목록의 메인 카드 컴포넌트입니다.
 * - 시각적 균형을 위해 제목 2줄, 본문 2줄로 제한 (Line-clamp)
 * - BlockNote 데이터 구조를 위한 정교한 타입 정의 (any 제거)
 * - transform-gpu 및 will-change를 통한 스크롤 성능 최적화
 */

'use client';

import { memo, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';

import { Eye, Heart, Layers } from 'lucide-react';

import { Card, Separator } from '../ui';
import type { Topic } from '@/types/topic.type';

dayjs.extend(relativeTime);
dayjs.locale('ko');

// -----------------------------------------------------------------------------
// 🔹 1. 정교한 타입 정의 (Portfolio Quality)
// -----------------------------------------------------------------------------
interface ContentChild {
  text?: string;
}

interface ContentBlock {
  content?: ContentChild[];
}

/**
 * @function extractTextFromContent
 * @description JSON 구조의 본문 데이터에서 순수 텍스트만 추출하여 미리보기를 생성합니다.
 */
const extractTextFromContent = (content: string | ContentBlock[], maxChars = 140): string => {
  try {
    const parsed = typeof content === 'string' ? JSON.parse(content) : content;
    if (!Array.isArray(parsed)) return '';

    let result = '';
    for (const block of parsed as ContentBlock[]) {
      if (block.content && Array.isArray(block.content)) {
        for (const child of block.content) {
          if (child.text) result += child.text + ' ';
        }
      }
      if (result.length >= maxChars) break;
    }

    const trimmed = result.trim();
    return trimmed.length > maxChars ? `${trimmed.slice(0, maxChars)}...` : trimmed;
  } catch {
    return '';
  }
};

interface Props {
  props: Topic;
  authorNickname?: string;
}

// -----------------------------------------------------------------------------
// 🔹 2. Main Component
// -----------------------------------------------------------------------------
const TopicCardComponent = ({ props, authorNickname }: Props) => {
  const navigate = useNavigate();

  const handleNavigate = useCallback(() => {
    navigate(`/topics/${props.id}/detail`);
  }, [navigate, props.id]);

  // 본문 미리보기 메모이제이션
  const previewText = useMemo(() => extractTextFromContent(props.content), [props.content]);

  return (
    <Card
      onClick={handleNavigate}
      className="
        group relative w-full p-5 
        bg-[#121214] border-white/5 
        hover:border-emerald-500/40 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]
        transition-all duration-300 cursor-pointer overflow-hidden
        flex flex-col transform-gpu will-change-transform
      "
    >
      {/* 🔹 상단: 텍스트 정보 & 썸네일 밸런스 */}
      <div className="flex gap-5 items-start flex-1 min-h-[120px]">
        <div className="flex-1 flex flex-col gap-2.5 min-w-0">
          {/* 카테고리 태그 */}
          <div className="flex items-center gap-1.5">
            <Layers size={12} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80">
              {props.category}
            </span>
          </div>

          {/* 타이틀 (2줄 제한) */}
          <h3 className="text-lg font-bold tracking-tight text-zinc-100 line-clamp-2 leading-[1.4] group-hover:text-emerald-400 transition-colors">
            {props.title}
          </h3>

          {/* 본문 미리보기 (2줄 제한으로 썸네일과 높이 균형 조정) */}
          <p className="text-sm text-zinc-400 line-clamp-2 leading-relaxed">{previewText}</p>
        </div>

        {/* 썸네일: 비율과 크기 고정 */}
        <div className="relative shrink-0 w-[110px] h-[110px] rounded-xl overflow-hidden border border-white/5 bg-zinc-950">
          <img
            src={props.thumbnail ?? '/assets/default-thumbnail.png'}
            alt="thumbnail"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </div>

      {/* 🔹 하단: 메타 정보 */}
      <div className="mt-5 space-y-4">
        <Separator className="bg-white/5" />

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[13px] font-bold text-zinc-200">
              {authorNickname ?? '알 수 없는 사용자'}
            </span>
            <span className="text-[11px] text-zinc-500">{dayjs(props.created_at).fromNow()}</span>
          </div>

          <div className="flex items-center gap-3 bg-zinc-900/80 px-3 py-1.5 rounded-full border border-white/10">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Eye size={13} />
              <span className="text-[11px] font-medium">{props.views}</span>
            </div>
            <div className="w-px h-2.5 bg-zinc-800" />
            <div className="flex items-center gap-1.5 text-rose-500">
              <Heart size={13} className="fill-rose-500/10" />
              <span className="text-[11px] font-bold">{props.likes}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export const TopicCard = memo(TopicCardComponent);
