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

## 1일차 작업 요약

- 실시간 댓글/좋아요 동기화 기반 구조 도입
- 캐시 정합성 보강(optimistic update, rollback, dedupe)
- 구독 생명주기 정리(구독/해제)

## 2일차 작업 - 라우트 Lazy Load 적용
##            N+1 쿼리 제거 (작성자 닉네임 배치 조회)

### `src/main.tsx`

- **잠재 치명 버그/리스크**
  - 모든 페이지를 정적 import하면 초기 번들 과대화로 첫 진입 지연, 저사양/저속 네트워크 환경에서 체감 성능 급락 가능
- **개선 내용**
  - 페이지 컴포넌트를 `lazy(() => import(...))`로 전환
  - 라우트 렌더링 구간을 `Suspense`로 감싸 fallback UI 제공

### `src/pages/index.tsx`

- **잠재 치명 버그/리스크**
  - 토픽 카드 수만큼 작성자 닉네임 조회가 발생하면 목록 스크롤/페이지 전환 시 네트워크 병목 가능
- **개선 내용**
  - 토픽 목록의 `author` ID를 수집해 단일 배치 조회로 전환
  - 조회된 닉네임 맵을 카드로 전달해 렌더링

### `src/components/topics/TopicCard.tsx`

- **잠재 치명 버그/리스크**
  - 카드 내부 개별 `useQuery`가 반복되면 카드 수 증가 시 요청 수가 선형 증가(N+1)
- **개선 내용**
  - 카드 내부 닉네임 조회 로직 제거
  - `authorNickname` prop 기반의 순수 렌더 컴포넌트로 단순화

### `src/services/useService.ts`

- **잠재 치명 버그/리스크**
  - 단건 닉네임 조회 API만 존재하면 목록 페이지 성능 최적화 한계
- **개선 내용**
  - `getUserNicknames(ids)` 추가
  - `user` 테이블 `in('id', uniqueIds)` 조회 후 `{ [id]: nickname }` 형태로 반환
