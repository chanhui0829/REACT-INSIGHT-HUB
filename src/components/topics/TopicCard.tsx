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

import { Card } from '../ui';
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
        group relative w-full aspect-[4/5] overflow-hidden cursor-pointer
        bg-slate-900 border-white/5 rounded-[32px]
        hover:shadow-[0_20px_40px_rgba(99,102,241,0.15)]
        transition-all duration-500 transform hover:scale-[1.02]
      "
    >
      {/* Image Section */}
      <div className="relative h-[65%] w-full overflow-hidden">
        <img
          src={props.thumbnail ?? '/assets/default-thumbnail.png'}
          alt="thumbnail"
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-white/10">
            <Layers size={11} className="text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
              {props.category}
            </span>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 p-5 flex flex-col gap-3 bg-slate-950">
        {/* Title */}
        <h3 className="text-base font-black tracking-tight text-white line-clamp-2 leading-[1.3] group-hover:text-indigo-400 transition-colors">
          {props.title}
        </h3>

        {/* Preview Text */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{previewText}</p>

        {/* Meta Info */}
        <div className="mt-auto flex items-center justify-between pt-3 border-t border-white/5">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-300">
              {authorNickname ?? '알 수 없는 사용자'}
            </span>
            <span className="text-[10px] text-slate-500">{dayjs(props.created_at).fromNow()}</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-slate-400">
              <Eye size={11} />
              <span className="text-[10px] font-medium">{props.views}</span>
            </div>
            <div className="flex items-center gap-1 text-rose-500">
              <Heart size={11} className="fill-rose-500/10" />
              <span className="text-[10px] font-bold">{props.likes}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export const TopicCard = memo(TopicCardComponent);
