/**
 * @file SortSelect.tsx
 * @description 정렬 옵션 선택 컴포넌트입니다.
 */

'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import { SORT_CATEGORY } from '@/constants/sort.constant';

function SortSelectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get('category') ?? 'all';
  const searchQuery = searchParams.get('q') ?? '';
  const sortOption = searchParams.get('sort') ?? 'latest';

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('sort', value);
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-slate-400">정렬</span>
      <Select value={sortOption} onValueChange={handleSortChange}>
        <SelectTrigger className="w-[140px] h-9 bg-slate-900/50 border-white/10 rounded-xl text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-slate-950 border-white/10">
          {SORT_CATEGORY.map((sort) => (
            <SelectItem key={sort.sortOption} value={sort.sortOption} className="text-xs">
              {sort.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function SortSelect() {
  return (
    <Suspense fallback={null}>
      <SortSelectContent />
    </Suspense>
  );
}