/**
 * @file sort.constant.ts
 * @description 정렬 옵션 관련 상수 정의 파일입니다.
 */

export const SORT_CATEGORY = [
  { sortOption: 'latest', label: '최신순' },
  { sortOption: 'likes', label: '좋아요순' },
  { sortOption: 'views', label: '조회순' },
] as const;
