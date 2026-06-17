/**
 * @file TopicCard.tsx
 * @description 토픽 목록 카드 컴포넌트입니다.
 * 블로그 포스트의 썸네일, 제목, 미리보기, 메타 정보를 표시합니다.
 */

'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';

import { Eye, Heart, Layers } from 'lucide-react';

import { Card } from '@/components/ui';
import type { Topic } from '@/types/topic.type';

dayjs.extend(relativeTime);
dayjs.locale('ko');

// 타입 정의
interface ContentChild {
  text?: string;
}

interface ContentBlock {
  content?: ContentChild[];
}

// JSON 구조의 본문 데이터에서 텍스트 추출
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
  topic: Topic;
  authorNickname?: string;
}

// Main Component
const TopicCardComponent = ({ topic, authorNickname }: Props) => {
  // 본문 미리보기 메모이제이션
  const previewText = useMemo(() => extractTextFromContent(topic.content), [topic.content]);

  return (
    <Link href={`/topics/${topic.id}`}>
      <Card
        className="
            group relative w-full overflow-hidden cursor-pointer
           bg-slate-900 border-white/5 rounded-[20px] sm:rounded-[24px] md:rounded-[32px]
            hover:shadow-[0_20px_40px_rgba(99,102,241,0.15)]
            transition-transform duration-500 hover:scale-[1.02]
            flex flex-row sm:flex-col sm:aspect-4/5 md:aspect-4/5 lg:aspect-4/5
        "
      >
        {/* Image Section */}
        <div className="relative w-[130px] shrink-0 sm:w-full sm:h-[55%] overflow-hidden rounded-l-[20px] sm:rounded-none sm:rounded-t-[24px] md:rounded-t-[32px]">
          <Image
            src={topic.thumbnail ?? '/assets/default-thumbnail.png'}
            alt="thumbnail"
            fill
            sizes="(max-width: 640px) 130px, 100%"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {/* Category Badge */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
            <div className="flex items-center gap-1 px-1.5 py-1 sm:px-2 sm:py-1 rounded-full bg-slate-950/90 border border-white/10">
              <Layers size={8} className="text-indigo-400 sm:w-[9px] sm:h-[9px]" />
              <span className="text-[7px] sm:text-[8px] font-black uppercase tracking-widest text-indigo-400">
                {topic.category}
              </span>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex-1 px-4 py-3 sm:px-4 sm:py-3 md:px-5 md:py-4 flex flex-col gap-1.5 sm:gap-2 bg-slate-950 justify-between min-h-0 rounded-r-[20px] sm:rounded-none sm:rounded-b-[24px] md:rounded-b-[32px]">
          {/* Title */}
          <h3 className="text-sm sm:text-base font-black tracking-tight text-white line-clamp-2 leading-[1.15] group-hover:text-indigo-400 transition-colors">
            {topic.title}
          </h3>

          {/* Preview Text */}
          <p className="text-[11px] sm:text-xs lg:text-sm text-slate-400 line-clamp-2 leading-tight overflow-hidden break-keep">
            {previewText}
          </p>
          {/* Meta Info */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <div className="flex flex-col min-w-0">
              <span className="text-[11px] sm:text-xs font-bold text-slate-300 truncate">
                {authorNickname ?? '알 수 없는 사용자'}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 whitespace-nowrap">
                {dayjs(topic.created_at).fromNow()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-slate-400">
                <Eye size={10} />
                <span className="text-[10px] font-medium">{topic.views}</span>
              </div>
              <div className="flex items-center gap-1 text-rose-500">
                <Heart size={10} className="fill-rose-500/10" />
                <span className="text-[10px] font-bold">{topic.likes}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export const TopicCard = memo(TopicCardComponent);
