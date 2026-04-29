# Refactoring Log

## 목적

실시간 댓글/좋아요 동기화 기능을 도입하면서, 데이터 정합성과 UX 안정성을 함께 개선했다.  
아래 내용은 포트폴리오/README 작성 시 근거로 활용하기 위한 변경 기록이다.

## 수정 파일별 핵심 개선 포인트

### `src/services/realtimeService.ts`

- **잠재 치명 버그**
  - 페이지마다 개별 구독 구현 시 이벤트 누락, 중복 구독, 해제 누락으로 인한 메모리 누수 가능
- **개선 내용**
  - 토픽 단위 채널(`topic:${topicId}:realtime`) 구독 로직을 중앙화
  - `comment`/`topic_likes`의 `INSERT`, `DELETE` 이벤트를 일관된 핸들러로 연결

### `src/services/commentService.ts`

- **잠재 치명 버그**
  - 실시간 `INSERT` payload만 사용하면 댓글 작성자 정보 누락으로 UI 데이터 불완전 렌더링 가능
- **개선 내용**
  - `CommentItem` 타입 정의
  - `fetchCommentById()` 추가로 `comment_user_view` 기준 단건 재조회 후 캐시 반영

### `src/hooks/useComment.ts`

- **잠재 치명 버그**
  - 댓글 작성/삭제 중 네트워크 실패 시 화면 상태와 DB 상태 불일치 가능
  - 로컬 mutate + 실시간 이벤트가 겹치면 댓글 중복 삽입 가능
- **개선 내용**
  - `onMutate`/`onError`/`onSettled` 기반 optimistic update + rollback 적용
  - `id` 기준 dedupe/upsert/remove 유틸 도입
  - `useCommentRealtimeHandlers` 추가로 실시간 insert/delete를 캐시에 즉시 반영

### `src/hooks/useTopic.ts`

- **잠재 치명 버그**
  - 좋아요 실시간 이벤트 순서 꼬임/중복 시 좋아요 수 과증가 혹은 음수 가능
- **개선 내용**
  - `useTopicRealtimeHandlers` 추가
  - 좋아요 수 patch 시 `Math.max(0, ...)`로 음수 방지
  - `user_id` 기준 중복 insert 방지 및 delete 시 정확 제거

### `src/pages/topics/[topic_id]/detail.tsx`

- **잠재 치명 버그**
  - 언마운트 후에도 구독이 남으면 메모리 누수 + 의도치 않은 다른 화면 캐시 갱신 가능
- **개선 내용**
  - 마운트 시 구독, 언마운트 시 `unsubscribe()` 보장
  - 댓글/좋아요 이벤트를 각 전용 핸들러 훅에 연결

## Lazy Load 적용 여부

- 이번 작업 범위에서는 **lazy load를 실제 코드에 적용하지 않았다**.
- 즉, `React.lazy`/`Suspense`를 적용한 파일은 현재 없다.
- Lazy load는 다음 단계(라우트 분할 최적화)로 분리해 진행 예정.

## 검증

- `npm run build` 통과 (TypeScript 에러 없음)
- 수정된 파일 기준 linter 에러 없음
