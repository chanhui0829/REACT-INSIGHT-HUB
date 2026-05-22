# 💡 InsightHub | 지식 공유 블로그 플랫폼

> **배포 링크**: [react-chanweb.vercel.app](https://react-chanweb.vercel.app)  
> **GitHub**: [chanhui0829/REACT-INSIGHT-HUB](https://github.com/chanhui0829/REACT-INSIGHT-HUB)

---

## 📘 프로젝트 소개

InsightHub는 **지식과 인사이트를 '토픽' 단위로 작성하고 공유할 수 있는 블로그형 커뮤니티 플랫폼**입니다.

처음엔 React + Vite 기반의 SPA로 시작했다가, 초기 로딩 속도와 SEO 문제를 개선하고 싶어서 **Next.js App Router로 직접 마이그레이션**했습니다. 단순한 기능 구현에서 끝내지 않고, SSR/CSR 분리 전략, 서버 캐싱, 낙관적 업데이트, 실시간 통신까지 실제 서비스 수준에 가깝게 완성하는 걸 목표로 했습니다.

---

## ⚙️ 기술 스택

| 분류            | 기술                                           |
| --------------- | ---------------------------------------------- |
| **Frontend**    | Next.js, TypeScript, Tailwind CSS, Shadcn UI   |
| **상태 관리**   | Zustand (persist 미들웨어), TanStack Query v5  |
| **백엔드 / DB** | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| **에디터**      | BlockNote (Notion 스타일 리치텍스트)           |
| **폼 검증**     | Zod + React Hook Form                          |
| **배포**        | Vercel                                         |

---

## 🛠️ 개발 도구

AI 도구를 보조적으로 활용해 코드 품질과 개발 속도를 개선했습니다.

- **Cursor**: 리팩토링 및 최적화 작업
- **Claude**: 아키텍처 설계, 트러블슈팅, 코드 리뷰

---

## 📁 프로젝트 구조

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # 루트 레이아웃 (SSR, 인증 유저 fetch)
│   ├── page.tsx                # 메인 피드 (SSR + unstable_cache)
│   ├── api/revalidate/         # On-Demand 캐시 무효화 API
│   ├── auth/callback/          # OAuth 콜백 처리
│   ├── sign-in / sign-up/
│   ├── case-study/
│   └── topics/
│       ├── [id]/               # 토픽 상세 (Realtime 구독)
│       └── create/             # 토픽 작성 / 임시저장
├── components/
│   ├── common/                 # 공통 UI (헤더, 에디터, 파일업로드 등)
│   └── topics/                 # 토픽 관련 컴포넌트 (카드, 목록, 댓글)
├── hooks/                      # TanStack Query 커스텀 훅
│   ├── useTopic.ts
│   ├── useComment.ts
│   ├── useCreateTopic.ts
│   └── useAuth.ts
├── services/                   # Supabase 직접 호출 함수
│   ├── topicService.ts
│   ├── commentService.ts
│   ├── authService.ts
│   ├── realtimeService.ts
│   └── useService.ts
├── stores/                     # Zustand 전역 상태 (인증)
├── types/                      # 타입 정의
├── constants/                  # 쿼리키, 카테고리, 정렬 상수
└── lib/supabase.ts             # 서버/클라이언트 Supabase 클라이언트 분리
```

---

## 🍀 주요 기능

### 👤 사용자 인증

- 이메일/비밀번호 회원가입 및 로그인
- Google OAuth 소셜 로그인 (PKCE 방식)
- 신규 OAuth 유저 닉네임 설정 및 약관 동의 처리
- Zustand `persist` 미들웨어로 새로고침 후 로그인 상태 유지
- Supabase `onAuthStateChange`로 세션 만료 자동 감지

### 🗂️ 토픽 CRUD

- BlockNote 기반 리치텍스트 에디터로 자유로운 콘텐츠 작성
- 카테고리 분류, 썸네일 이미지 업로드 (Supabase Storage)
- 임시저장(`status: temp`) → 발행(`status: publish`) 2단계 플로우
- 임시저장 보관함에서 이어 작성 가능
- 카테고리 / 최신순 / 좋아요순 / 조회순 필터 및 검색 (URL 기반 상태 관리)
- 무한스크롤 (Intersection Observer)

### 💬 댓글

- `comment_user_view` DB View를 통한 댓글 + 유저 정보 JOIN 조회
- `useInfiniteQuery` 기반 페이지네이션
- 낙관적 업데이트 (등록/삭제 즉시 UI 반영, 실패 시 롤백)
- Supabase Realtime으로 다른 유저 댓글 실시간 반영

### ❤️ 좋아요 & 👁️ 조회수

- `toggle_topic_like` RPC로 좋아요 토글 처리 (동시성 안전)
- `increment_topic_views` RPC로 조회수 증가 (동시성 안전)
- 낙관적 업데이트로 즉각적인 UI 반응
- Supabase Realtime으로 다른 유저 좋아요 실시간 반영

### 📦 서버 캐싱 & 즉시 반영

- `unstable_cache`로 토픽 목록 1시간 서버 캐싱
- 토픽 발행/삭제 시 `POST /api/revalidate`로 캐시 즉시 무효화 (On-Demand Revalidation)

---

## 🧱 데이터베이스 구조

```
user
  id uuid (PK)
  email text
  nickname text
  role text
  service_agreed bool
  privacy_agreed bool
  marketing_agreed bool
  created_at timestamp

topic
  id int8 (PK)
  author uuid (FK → user.id)
  title text
  content text          -- BlockNote JSON 직렬화
  category text
  thumbnail text
  status text           -- 'temp' | 'publish'
  views int8
  likes int8
  created_at timestamp

comment
  id int8 (PK)
  user_id uuid (FK → user.id)
  topic_id int8 (FK → topic.id)
  content text
  created_at timestamp

topic_likes
  id int8 (PK)
  user_id uuid (FK → user.id)
  topic_id int8 (FK → topic.id)
  created_at timestamp

-- View
comment_user_view     -- comment + user JOIN
```

### ERD

```
user (1) ─── (N) topic
user (1) ─── (N) comment
user (1) ─── (N) topic_likes
topic (1) ─── (N) comment
topic (1) ─── (N) topic_likes
```

---

## ⚡ Supabase 설계 포인트

- **회원가입 트리거**: `auth.users`에 유저 생성 시 `public.user`에 자동으로 레코드 삽입 (`handle_new_user` 트리거)
- **Security Definer RPC** (`update_user_on_signup`): RLS 정책을 우회해 신규 가입자의 닉네임 및 약관 정보를 안전하게 저장
- **RLS 정책**: SELECT는 공개, INSERT/UPDATE/DELETE는 `auth.uid()` 기반 본인만 허용
- **Realtime**: `comment`, `topic_likes` 테이블에 `postgres_changes` 구독 활성화
- **인덱싱**: 조회수, 좋아요, 작성일 정렬 성능 향상을 위한 주요 필드 인덱스 적용

---

## 🔑 마이그레이션 포인트 (React SPA → Next.js)

직접 마이그레이션하면서 겪은 핵심 차이점들입니다.

- **SSR 적용**: 메인 피드 첫 12개를 서버에서 렌더해 초기 로딩 속도 개선
- **Supabase 클라이언트 분리**: 서버 전용(`createServerClient`) / 클라이언트 전용(`createBrowserClient`) 명확히 구분
- **`unstable_cache` 도입**: 반복 DB 쿼리를 서버에서 캐싱, On-Demand Revalidation으로 즉시 갱신
- **`useSearchParams` Suspense 처리**: Next.js 14+ 빌드 에러 대응

---

## 🚀 향후 개선 계획

- 댓글 수정 및 대댓글 구조 추가
- 사용자 프로필 페이지
- `img` 태그 → Next.js `Image` 컴포넌트 교체 (WebP 자동 변환)
- 검색 기능 Full-Text Search(FTS) 전환

---

✍️ **개발자**: 윤찬희  
📎 **GitHub**: [chanhui0829](https://github.com/chanhui0829)
