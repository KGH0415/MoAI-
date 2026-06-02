# 커뮤니티 앱 - 기술 스택 문서

---

## 개요

| 항목 | 값 |
|------|-----|
| 주 언어 | TypeScript 5.x |
| 런타임 | Node.js 22 LTS |
| 아키텍처 | 풀스택 모노레포 (Next.js 16 기반) |
| 개발 방법론 | TDD (Test-Driven Development) |

---

## 기술 스택 상세

### 언어

#### TypeScript 5.x
- **선택 근거**: 런타임 오류를 컴파일 타임에 잡아 안정성을 높이고, IDE 자동완성으로 개발 생산성을 향상시킵니다. 프론트엔드와 백엔드가 동일한 타입을 공유하여 API 계약의 불일치를 방지합니다.

---

### 런타임 및 패키지 관리

#### Node.js 22 LTS
- **선택 근거**: 짝수 버전 LTS로 장기 지원이 보장됩니다. 네이티브 ESM 지원, 향상된 성능, 안정적인 에코시스템을 제공합니다.

#### pnpm 9+
- **선택 근거**: npm/yarn 대비 디스크 사용량이 적고(심볼릭 링크 기반 저장소), 설치 속도가 빠릅니다. Monorepo 확장 시에도 Workspace 기능으로 자연스럽게 대응 가능합니다.

---

### 프론트엔드

#### Next.js 16 (App Router + React 19 + Server Components)
- **선택 근거**: App Router의 서버 컴포넌트(RSC)로 초기 로딩 속도를 개선하고 클라이언트 JS 번들을 줄입니다. 파일 기반 라우팅, API Routes, SEO 최적화(SSR/SSG)를 단일 프레임워크에서 제공합니다.
- **주요 활용**: 게시글 상세·목록 페이지는 SSR로 SEO 확보, 좋아요·댓글 등 인터랙션은 클라이언트 컴포넌트로 분리

#### Tailwind CSS 4
- **선택 근거**: 유틸리티 클래스 기반으로 CSS 파일 관리 부담을 제거하고, 디자인 토큰 기반의 일관된 스타일을 빠르게 구현합니다. Next.js와의 통합이 공식 지원됩니다.

#### shadcn/ui
- **선택 근거**: 설치형이 아닌 복사-붙여넣기 방식으로 컴포넌트 소스를 직접 소유합니다. Tailwind CSS + Radix UI 기반으로 접근성(WCAG)이 내장되어 있으며 커스터마이징이 자유롭습니다.

---

### 백엔드

#### Next.js API Routes (Route Handlers)
- **선택 근거**: 별도 서버 없이 Next.js 프로젝트 내에서 REST API를 구현하여 초기 개발 속도를 높입니다. 트래픽 증가 시 별도 Express/Fastify 서버로 분리하는 경로를 열어둡니다.
- **분리 고려 시점**: API 복잡도 증가, 독립적 스케일링 필요, 마이크로서비스 전환 시 (추후 결정)

---

### 데이터베이스

#### PostgreSQL 16
- **선택 근거**: 관계형 데이터 모델이 커뮤니티 앱의 사용자-게시글-댓글-좋아요 관계를 자연스럽게 표현합니다. Full-Text Search 내장으로 별도 검색 엔진 없이 MVP 검색 기능을 구현합니다.
- **로컬 개발**: Docker Compose로 PostgreSQL 16 컨테이너 구동 (추후 설정 파일 제공)

#### Prisma 6 (ORM)
- **선택 근거**: TypeScript 네이티브 ORM으로 스키마에서 타입이 자동 생성됩니다. 마이그레이션 관리, 직관적인 API, 강력한 IDE 지원을 제공합니다. PostgreSQL Full-Text Search도 Raw Query로 활용 가능합니다.

---

### 인증

#### Auth.js (구 NextAuth.js)
- **선택 근거**: Next.js 16 App Router에 최적화된 공식 인증 솔루션입니다. 이메일/비밀번호와 OAuth(Google, GitHub)를 설정만으로 통합하며, JWT/세션 기반 전략을 모두 지원합니다.
- **지원 방식**: 이메일 + 비밀번호 (Credentials Provider), Google OAuth, GitHub OAuth

---

### 폼 및 검증

#### react-hook-form
- **선택 근거**: 비제어 컴포넌트 방식으로 불필요한 리렌더링을 줄이고 성능이 우수합니다. 복잡한 폼 상태 관리와 검증을 선언적으로 처리합니다.

#### Zod
- **선택 근거**: 런타임 타입 검증 라이브러리로 프론트엔드 폼 검증과 백엔드 API 요청 검증을 동일한 스키마로 공유합니다. TypeScript 타입 추론과 완벽히 통합됩니다.

---

### 테스트

#### Vitest (단위 테스트 + 통합 테스트)
- **선택 근거**: Vite 기반으로 Jest보다 실행 속도가 빠르고 ESM을 네이티브 지원합니다. Jest 호환 API로 마이그레이션 비용이 낮습니다.
- **적용 범위**: 유틸리티 함수, 커스텀 훅, API Route 핸들러, Prisma 쿼리 통합 테스트

#### Playwright (E2E 테스트)
- **선택 근거**: 크로스 브라우저(Chrome, Firefox, WebKit) 테스트를 단일 API로 처리합니다. 네트워크 인터셉트, 인증 상태 저장 등 고급 기능을 제공합니다.
- **적용 범위**: 회원가입 → 게시글 작성 → 댓글 → 좋아요 등 핵심 사용자 플로우

---

### 코드 품질

#### ESLint
- **선택 근거**: Next.js 공식 ESLint 규칙 세트(`eslint-config-next`)로 React, TypeScript, 접근성 관련 안티패턴을 자동 감지합니다.

#### Prettier
- **선택 근거**: 코드 포맷에 대한 팀 내 논쟁을 없애고 일관된 스타일을 강제합니다. ESLint와 통합하여 저장 시 자동 포맷을 지원합니다.

#### Biome (선택 사항)
- **선택 근거**: ESLint + Prettier를 단일 도구로 대체하는 고속 Rust 기반 도구입니다. 프로젝트 성숙도에 따라 도입을 검토합니다. (추후 결정)

---

### 빌드 및 배포

#### Vercel (권장)
- **선택 근거**: Next.js 창시사인 Vercel이 만든 플랫폼으로 제로 설정 배포를 지원합니다. Edge Functions, Preview 배포, Analytics를 기본 제공합니다.

#### Docker (대안)
- **선택 근거**: 자체 서버 또는 클라우드(AWS, GCP, Azure) 배포 시 컨테이너 기반으로 환경 일관성을 보장합니다. PostgreSQL 로컬 개발 환경도 Docker Compose로 구성합니다.

---

## 개발 환경 요구사항

| 요구사항 | 최소 버전 | 비고 |
|----------|----------|------|
| Node.js | 22.0.0+ | LTS 버전 권장 |
| pnpm | 9.0.0+ | `npm install -g pnpm`으로 설치 |
| PostgreSQL | 16.0+ | 로컬 설치 또는 Docker 사용 |
| Docker | 최신 안정버전 | PostgreSQL 로컬 개발 시 권장 |
| Git | 2.40+ | - |

### 빠른 시작 (로컬 개발)

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경변수 설정
cp .env.example .env.local

# 3. PostgreSQL 실행 (Docker)
docker compose up -d postgres

# 4. 데이터베이스 마이그레이션
pnpm prisma migrate dev

# 5. 개발 서버 실행
pnpm dev
```

> 상세 설정은 추후 README.md에 문서화됩니다.

---

## 기술 결정 보류 사항 (TBD)

| 항목 | 현황 | 결정 기준 |
|------|------|----------|
| 상태 관리 라이브러리 | React 19 내장 use + Server Actions 우선 | 복잡한 클라이언트 상태 필요 시 Zustand 검토 |
| 캐싱 레이어 | Next.js 내장 캐싱 우선 | 성능 병목 발생 시 Redis 도입 검토 |
| Full-Text Search | PostgreSQL 내장 FTS | 고도화 필요 시 Meilisearch / Typesense 검토 |
| 이미지 업로드 | MVP 범위 외 | 추후 Cloudinary / S3 검토 |
| Biome 도입 | 선택 사항 | 팀 논의 후 결정 |
| 백엔드 분리 | 현재 API Routes | 트래픽 증가 시 별도 서버 분리 검토 |

---

## 메타데이터

| 항목 | 값 |
|------|-----|
| Version | 0.1.0 |
| Last Updated | 2026-06-02 |
| Status | Draft |
| Source | .moai/project/interview.md |
