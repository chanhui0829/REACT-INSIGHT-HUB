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

## 2일차 작업 - 라우트 Lazy Load 적용, N+1 쿼리 제거 (작성자 닉네임 배치 조회)

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

## 3일차 작업 - 검색 입력/URL 상태 완전 동기화, 접근성(A11y) + 상호작용 안정성 개선

### `src/pages/index.tsx`

- **잠재 치명 버그/리스크**
  - `defaultValue` 기반 검색 입력은 URL 쿼리(`q`) 변경 시 입력창과 실제 검색 상태가 어긋날 수 있음
  - 입력 중 매번 즉시 반영하면 불필요한 URL 갱신/쿼리 트리거로 UX 저하 가능
- **개선 내용**
  - 검색 입력을 `controlled input`으로 전환 (`value` + `onChange`)
  - URL의 `q` 변경 시 입력 상태를 동기화하는 effect 추가
  - `300ms debounce`로 검색 파라미터 갱신을 완화
  - Enter/검색 버튼 동작을 단일 `handleSearch` 로직으로 통합
- **성과 요약**
  - URL 상태와 UI 표시 상태의 일관성 확보
  - 검색 UX 안정화 및 불필요한 갱신 감소

### `src/components/common/AppHeader.tsx`

- **잠재 치명 버그/리스크**
  - 모바일 메뉴 토글/닫기 버튼에 접근성 속성이 부족하면 스크린리더 사용자 탐색성이 저하됨
  - `window.location` 직접 참조는 라우터 상태와 분리되어 확장/테스트 안정성 저하 가능
- **개선 내용**
  - `useLocation`으로 경로 체크 전환 (`window.location` 제거)
  - 모바일 메뉴 버튼에 `aria-label`, `aria-controls`, `aria-expanded` 추가
  - 모바일 메뉴 닫기 버튼에 `aria-label` 및 포커스 링 보강

### `src/pages/topics/[topic_id]/detail.tsx`

- **잠재 치명 버그/리스크**
  - 아이콘 전용 버튼(공유)과 토글 버튼(좋아요)의 의미가 보조기기에 충분히 전달되지 않을 수 있음
- **개선 내용**
  - 공유 버튼 `aria-label` 추가
  - 좋아요 버튼 상태 기반 `aria-label` 추가(추가/취소)

### `src/pages/index.tsx`

- **잠재 치명 버그/리스크**
  - 검색 입력/버튼의 역할이 보조기기에 명확히 전달되지 않을 수 있음
  - 페이지네이션 링크의 액션 의도가 모호해 키보드/보조기기 사용 시 혼란 가능
- **개선 내용**
  - 검색 input, 검색 버튼, 임시저장 버튼에 `aria-label` 추가
  - 페이지네이션 이전/다음/숫자 링크에 `aria-label` 및 `role="button"` 보강

### 성과 요약

- 주요 인터랙션 요소의 접근성 라벨을 보강해 보조기기 호환성 개선
- 모바일 메뉴 조작의 상태 전달(`aria-expanded`) 및 키보드 포커스 가시성 강화
- 라우터 상태 기반 내비게이션 처리로 UI 동작 안정성 향상

## 4일차 작업 - 에디터 JSON 파싱 안정성 강화, 인증 가드 강화 (`user!.id` 제거)

### `src/pages/topics/[topic_id]/create.tsx`

- **잠재 치명 버그/리스크**
  - 수정 페이지 진입 시 `topic.content`가 손상된 JSON이면 `JSON.parse`에서 예외가 발생해 화면 전체가 크래시될 수 있음
- **개선 내용**
  - `parseEditorContent` 유틸 추가
  - 파싱 실패 시 빈 배열(`[]`)로 안전하게 fallback 처리
  - 초기 에디터 상태 세팅에 안전 파서 적용

### `src/pages/topics/[topic_id]/detail.tsx`

- **잠재 치명 버그/리스크**
  - 상세 페이지 본문 렌더에서 직접 `JSON.parse`를 수행해, 비정상 데이터가 들어오면 본문 렌더링이 중단될 수 있음
- **개선 내용**
  - `string | Block[]` 모두 처리 가능한 안전 파서(`parseEditorContent`) 추가
  - `useMemo`로 파싱 결과를 캐시해 불필요한 재파싱 방지
  - 파싱 실패 시 빈 본문으로 fallback하여 페이지 크래시 방지

### 성과 요약

- 콘텐츠 데이터 손상/이행 중 비정상 데이터에도 페이지가 죽지 않도록 방어력 강화
- 에디터 렌더 경로에서 런타임 예외 가능성 감소
- 안정성 관점의 포트폴리오 스토리(“실패 복원력”) 확보

### `src/pages/topics/[topic_id]/create.tsx`

- **잠재 치명 버그/리스크**
  - 저장/발행 시 `user!.id` non-null 단언을 사용하면, 비로그인 상태 진입 시 런타임 크래시 가능
- **개선 내용**
  - `requireAuth` 가드 함수 추가로 로그인 상태를 먼저 검증
  - 인증 실패 시 경고 토스트 후 로그인 페이지로 유도
  - `saveMutation`/`publishMutation` 호출에 안전한 `userId`만 전달
  - 비로그인 상태에서 저장/발행 버튼을 비활성화해 잘못된 액션 사전 차단

### 성과 요약

- 인증 상태 예외 케이스에서 앱 크래시 가능성 제거
- 작성 흐름의 가드 일관성 강화(사전 차단 + 런타임 방어)
- 안정성 중심 포트폴리오 포인트(“비정상 경로 방어”) 추가 확보

## 검증

- `npm run build` 통과 (TypeScript 에러 없음)
- 수정된 파일 기준 linter 에러 없음

