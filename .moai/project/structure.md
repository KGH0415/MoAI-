# 커뮤니티 앱 - 디렉터리 구조 문서

---

## 아키텍처 패턴

**Feature-based + Clean Architecture Lite**

- **Feature-based**: 기능 도메인(auth, posts, comments, search)을 중심으로 파일을 구성하여 관련 코드를 응집시킵니다.
- **Clean Architecture Lite**: 풀 Clean Architecture의 복잡성 없이, UI / 비즈니스 로직 / 데이터 접근 계층을 느슨하게 분리합니다.
- Next.js 16 App Router 기반으로 서버 컴포넌트와 클라이언트 컴포넌트를 명확히 구분합니다.

---

## 권장 디렉터리 구조

```
커뮤니티-앱/
├── app/                          # Next.js App Router 루트
│   ├── layout.tsx                # 루트 레이아웃 (HTML, 폰트, 전역 Provider)
│   ├── page.tsx                  # 홈 피드 페이지
│   ├── globals.css               # 전역 스타일
│   │
│   ├── (auth)/                   # 인증 라우트 그룹 (레이아웃 분리)
│   │   ├── login/
│   │   │   └── page.tsx          # 로그인 페이지
│   │   └── register/
│   │       └── page.tsx          # 회원가입 페이지
│   │
│   ├── posts/                    # 게시글 라우트
│   │   ├── page.tsx              # 게시글 목록
│   │   ├── new/
│   │   │   └── page.tsx          # 게시글 작성
│   │   └── [id]/
│   │       ├── page.tsx          # 게시글 상세
│   │       └── edit/
│   │           └── page.tsx      # 게시글 수정
│   │
│   ├── search/
│   │   └── page.tsx              # 검색 결과 페이지
│   │
│   └── api/                      # Next.js API Routes
│       ├── auth/
│       │   └── [...nextauth]/
│       │       └── route.ts      # Auth.js 핸들러
│       ├── posts/
│       │   ├── route.ts          # GET (목록), POST (생성)
│       │   └── [id]/
│       │       └── route.ts      # GET, PATCH, DELETE
│       ├── comments/
│       │   ├── route.ts          # POST (생성)
│       │   └── [id]/
│       │       └── route.ts      # PATCH, DELETE
│       ├── likes/
│       │   └── route.ts          # POST (토글)
│       └── search/
│           └── route.ts          # GET (검색)
│
├── components/                   # 재사용 가능한 UI 컴포넌트
│   ├── ui/                       # shadcn/ui 기반 원자 컴포넌트
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   ├── avatar.tsx
│   │   └── ...                   # shadcn/ui 설치 컴포넌트
│   │
│   └── features/                 # 도메인별 복합 컴포넌트
│       ├── auth/
│       │   ├── LoginForm.tsx
│       │   ├── RegisterForm.tsx
│       │   └── SocialLoginButtons.tsx
│       ├── posts/
│       │   ├── PostCard.tsx      # 목록용 카드 컴포넌트
│       │   ├── PostDetail.tsx    # 상세 뷰
│       │   ├── PostForm.tsx      # 작성/수정 폼
│       │   └── PostList.tsx      # 목록 래퍼
│       ├── comments/
│       │   ├── CommentItem.tsx
│       │   ├── CommentForm.tsx
│       │   └── CommentList.tsx
│       ├── likes/
│       │   └── LikeButton.tsx
│       ├── search/
│       │   ├── SearchBar.tsx
│       │   └── SearchResults.tsx
│       └── layout/
│           ├── Header.tsx
│           ├── Footer.tsx
│           └── Sidebar.tsx       # 추후 결정 (TBD)
│
├── lib/                          # 유틸리티, 헬퍼, 클라이언트 설정
│   ├── db.ts                     # Prisma 클라이언트 싱글톤
│   ├── auth.ts                   # Auth.js 설정 및 헬퍼
│   ├── validations/              # Zod 스키마 정의
│   │   ├── post.ts
│   │   ├── comment.ts
│   │   └── auth.ts
│   ├── utils/                    # 순수 유틸리티 함수
│   │   ├── date.ts               # 날짜 포맷팅
│   │   └── string.ts             # 문자열 처리
│   └── hooks/                    # React 커스텀 훅
│       ├── usePosts.ts
│       ├── useComments.ts
│       └── useLikes.ts
│
├── prisma/                       # Prisma ORM 설정
│   ├── schema.prisma             # 데이터베이스 스키마
│   └── migrations/               # 자동 생성 마이그레이션 파일
│
├── public/                       # 정적 자산 (CDN 서빙)
│   ├── favicon.ico
│   ├── logo.svg                  # 추후 결정 (TBD)
│   └── images/
│       └── ...
│
├── tests/                        # 테스트 파일
│   ├── unit/                     # 단위 테스트 (Vitest)
│   │   ├── lib/
│   │   └── components/
│   ├── integration/              # 통합 테스트 (Vitest + Prisma)
│   │   └── api/
│   └── e2e/                      # E2E 테스트 (Playwright)
│       ├── auth.spec.ts
│       ├── posts.spec.ts
│       └── search.spec.ts
│
├── .moai/                        # MoAI-ADK 설정 및 산출물
│   ├── project/                  # 프로젝트 문서 (이 파일 포함)
│   ├── specs/                    # SPEC 문서
│   └── config/                   # MoAI 설정
│
├── .claude/                      # Claude Code 설정
│
├── .env.local                    # 로컬 환경변수 (git 제외)
├── .env.example                  # 환경변수 예시 (git 포함)
├── next.config.ts                # Next.js 설정
├── tailwind.config.ts            # Tailwind CSS 설정
├── tsconfig.json                 # TypeScript 설정
├── vitest.config.ts              # Vitest 설정
├── playwright.config.ts          # Playwright 설정
└── package.json
```

---

## 각 디렉터리의 책임

| 디렉터리 | 책임 |
|----------|------|
| `app/` | Next.js 라우팅, 페이지 컴포넌트, 레이아웃, API 라우트 핸들러 |
| `app/api/` | REST API 엔드포인트. 요청 파싱 → 비즈니스 로직 호출 → 응답 반환 |
| `components/ui/` | shadcn/ui 기반 범용 원자 컴포넌트. 도메인 지식 없음 |
| `components/features/` | 도메인별 복합 컴포넌트. 상태·API 호출 포함 가능 |
| `lib/` | 도메인 비즈니스 로직, DB 클라이언트, 인증 헬퍼, 유틸리티 |
| `prisma/` | 데이터베이스 스키마 정의 및 마이그레이션 이력 관리 |
| `public/` | 이미지, 폰트 등 정적 자산. Next.js가 `/` 경로로 서빙 |
| `tests/` | 단위·통합·E2E 테스트. 운영 코드와 분리 |

---

## 모듈 경계 (도메인)

| 도메인 | 책임 | 주요 파일 위치 |
|--------|------|----------------|
| **auth** | 회원가입, 로그인, 세션 관리, OAuth | `app/(auth)/`, `app/api/auth/`, `lib/auth.ts`, `components/features/auth/` |
| **posts** | 게시글 CRUD, 목록, 정렬 | `app/posts/`, `app/api/posts/`, `components/features/posts/` |
| **comments** | 댓글 CRUD, 게시글 연관 | `app/api/comments/`, `components/features/comments/` |
| **likes** | 좋아요 토글, 집계 | `app/api/likes/`, `components/features/likes/` |
| **search** | 키워드 검색, 결과 표시 | `app/search/`, `app/api/search/`, `components/features/search/` |

### 도메인 간 의존 규칙

- `auth` → 다른 도메인에 의존 없음 (독립)
- `comments`, `likes` → `posts`에 의존 (게시글 ID 참조)
- `search` → `posts`에 의존 (게시글 데이터 검색)
- `components/ui` → 어떤 도메인에도 의존 없음

---

## 메타데이터

| 항목 | 값 |
|------|-----|
| Version | 0.1.0 |
| Last Updated | 2026-06-02 |
| Status | Draft |
| Framework | Next.js 16 App Router |
| Source | .moai/project/interview.md |
