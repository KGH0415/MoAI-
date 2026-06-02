# SPEC-AUTH-001: 구현 계획 (Plan)

## 개요

본 문서는 SPEC-AUTH-001(회원가입 및 로그인)의 구현 계획을 정의합니다. Next.js 16 App Router, Auth.js v5, Prisma 6, PostgreSQL 16 스택을 기반으로 인증 도메인 MVP를 구축합니다.

---

## 기술 스택 및 라이브러리

### 핵심 의존성 (Production Stable)

| 라이브러리 | 권장 버전 | 역할 |
|------------|----------|------|
| `next-auth` | `^5.0.0` (Auth.js v5) | 인증 프레임워크 (Credentials + Google) |
| `@auth/prisma-adapter` | `^2.0.0` | Auth.js ↔ Prisma 어댑터 |
| `@prisma/client` | `^6.0.0` | Prisma ORM 런타임 |
| `prisma` | `^6.0.0` | Prisma CLI (devDependency) |
| `bcrypt` | `^5.1.1` | 비밀번호 해싱 (또는 `@node-rs/bcrypt ^1.x`) |
| `zod` | `^3.23.0` | 입력 검증 스키마 |
| `react-hook-form` | `^7.x` | 폼 상태 관리 |
| `@hookform/resolvers` | `^3.x` | react-hook-form ↔ Zod 통합 |
| `resend` | `^4.x` | 트랜잭션 이메일 발송 (대안: `nodemailer ^6.x`) |

### 개발 의존성

| 라이브러리 | 용도 |
|------------|------|
| `@types/bcrypt` | bcrypt 타입 정의 |
| `vitest` | 단위/통합 테스트 |
| `@playwright/test` | E2E 테스트 |
| `@testing-library/react` | 컴포넌트 테스트 |

### 환경변수

```env
DATABASE_URL="postgresql://user:pass@localhost:5432/community"
AUTH_SECRET="<32+ bytes random>"        # openssl rand -base64 32
AUTH_URL="http://localhost:3000"        # production은 실제 도메인
GOOGLE_CLIENT_ID="<from Google Cloud Console>"
GOOGLE_CLIENT_SECRET="<from Google Cloud Console>"
RESEND_API_KEY="<from resend.com>"
EMAIL_FROM="noreply@example.com"
```

---

## 데이터 모델 (Prisma Schema 초안)

```prisma
// prisma/schema.prisma (추가/수정 부분)

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  passwordHash  String?   // OAuth-only 사용자는 NULL
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]

  @@index([email])
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String  // "oauth" | "credentials"
  provider          String  // "google" | "credentials"
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String   // email
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@index([expires])
}

model LoginAttempt {
  id          String   @id @default(cuid())
  email       String?
  ipAddress   String
  success     Boolean
  attemptedAt DateTime @default(now())

  @@index([email, attemptedAt])
  @@index([ipAddress, attemptedAt])
}
```

> 참고: JWT 세션 전략을 사용하지만, OAuth 계정 연결을 위해 `Account` 테이블은 필수다. Auth.js Prisma Adapter 표준 스키마를 따른다.

---

## 작업 분해 (Task Breakdown)

### Phase 1: 기반 설정 (Priority High)

- **T1-1**: 의존성 설치 (`next-auth@beta`, `@auth/prisma-adapter`, `bcrypt`, `zod`, `react-hook-form`, `resend`)
- **T1-2**: `prisma/schema.prisma`에 `User`, `Account`, `Session`, `VerificationToken`, `LoginAttempt` 모델 추가
- **T1-3**: `pnpm prisma migrate dev --name init_auth` 마이그레이션 실행
- **T1-4**: `.env.example` 업데이트 (`AUTH_SECRET`, `GOOGLE_CLIENT_*`, `RESEND_API_KEY`)
- **T1-5**: `lib/db.ts` Prisma 클라이언트 싱글톤 작성

### Phase 2: Auth.js 핵심 설정 (Priority High)

- **T2-1**: `lib/auth.ts`에 `authOptions` 정의
  - Credentials Provider 등록 (`authorize` 함수에 bcrypt 비교 로직)
  - Google Provider 등록
  - PrismaAdapter 연결
  - `session.strategy = 'jwt'` 설정
  - JWT/세션 콜백에 `userId`, `emailVerified` 포함
- **T2-2**: `app/api/auth/[...nextauth]/route.ts` 핸들러 노출 (`GET`, `POST`)
- **T2-3**: `auth()` 헬퍼 export (Server Component / Route Handler에서 사용)

### Phase 3: 회원가입 플로우 (Priority High)

- **T3-1**: `lib/validations/auth.ts`에 Zod 스키마 작성
  - `registerSchema`: email (RFC 5322), password (8자+, 영문+숫자)
  - `loginSchema`: email, password (비어있지 않음)
- **T3-2**: `app/api/auth/register/route.ts` 작성
  - 이메일 중복 검사
  - bcrypt 해시 (cost=12) 후 `User` 생성
  - `VerificationToken` 발급 (24시간 TTL)
  - 인증 메일 발송
- **T3-3**: `components/features/auth/RegisterForm.tsx` 작성 (react-hook-form + Zod resolver)
- **T3-4**: `app/(auth)/register/page.tsx` 페이지

### Phase 4: 로그인 플로우 (Priority High)

- **T4-1**: `components/features/auth/LoginForm.tsx` 작성
- **T4-2**: `components/features/auth/SocialLoginButtons.tsx` (Google 버튼)
- **T4-3**: `app/(auth)/login/page.tsx` 페이지
- **T4-4**: 로그인 성공 시 리다이렉트 로직 (`callbackUrl` 처리)

### Phase 5: 이메일 인증 (Priority High)

- **T5-1**: `lib/services/email.ts`에 Resend 클라이언트 + `sendVerificationEmail()` 작성
- **T5-2**: `app/api/auth/verify/route.ts` 토큰 검증 엔드포인트
  - 토큰 조회 → 만료 확인 → `User.emailVerified` 업데이트 → 토큰 삭제
- **T5-3**: `app/(auth)/verify-email/page.tsx` 결과 페이지 (성공/만료/에러)

### Phase 6: Rate Limit (Priority High)

- **T6-1**: `lib/services/rate-limit.ts` 작성
  - `checkLoginRateLimit(email, ip)`: 최근 15분 내 실패 카운트 조회
  - `recordLoginAttempt(email, ip, success)`: 시도 기록
  - 5회 이상 실패 시 차단
- **T6-2**: Credentials Provider `authorize`에 rate limit 체크 통합
- **T6-3**: 차단 응답 시 사용자 친화적 메시지 반환

### Phase 7: 미인증 사용자 쓰기 차단 (Priority Medium)

- **T7-1**: `middleware.ts`에 `/posts/new`, `/posts/[id]/edit` 등 보호 라우트 가드
- **T7-2**: API 라우트(`/api/posts`, `/api/comments`, `/api/likes`)에 `emailVerified` 체크 헬퍼 적용
- **T7-3**: UI에 인증 안내 컴포넌트 노출

### Phase 8: 테스트 (Priority High)

- **T8-1**: Vitest 단위 테스트
  - `validations/auth.ts` 스키마 테스트
  - `services/rate-limit.ts` 카운터 로직 테스트
  - `services/email.ts` 모의 발송 테스트
- **T8-2**: Vitest 통합 테스트 (Prisma)
  - 가입 → 이메일 인증 → 로그인 플로우
  - 중복 이메일 거부
  - Rate Limit 발동
- **T8-3**: Playwright E2E 테스트
  - 가입 → 인증 메일 클릭(목 처리) → 로그인 → 홈 진입
  - Google OAuth (모킹 또는 실제 테스트 계정)

---

## MX 태그 계획 (mx_plan)

@MX 태그는 GREEN 단계 진입 시 추가합니다.

### @MX:ANCHOR (불변 계약 — fan_in >= 3 예상)

| 위치 | 사유 |
|------|------|
| `lib/auth.ts` `auth()` 헬퍼 | 모든 보호 라우트와 API에서 호출되는 단일 진입점 |
| `lib/auth.ts` `authOptions` | Auth.js 전역 설정. 변경 시 광범위한 영향 |
| `app/api/auth/register/route.ts` 핸들러 | 가입 단일 진입점 |
| `lib/services/rate-limit.ts` `checkLoginRateLimit()` | 인증 보안 핵심 함수 |

### @MX:WARN (위험 지대 — @MX:REASON 동반)

| 위치 | 사유 |
|------|------|
| `lib/auth.ts` `authorize` 콜백 내 bcrypt 비교 | 비밀번호 검증 핵심. 타이밍 공격 방어 필요(`bcrypt.compare`는 상수 시간) |
| `lib/services/rate-limit.ts` 카운터 증가 로직 | 트랜잭션 경합 가능성. 동시 요청 시 카운트 누락 위험 |
| `app/api/auth/verify/route.ts` 토큰 검증 | 토큰 재사용 방지 위해 트랜잭션으로 검증+삭제 필요 |

### @MX:NOTE (의도/맥락 전달)

| 위치 | 내용 |
|------|------|
| `lib/auth.ts` JWT 콜백 | `userId`, `emailVerified` 주입 이유 명시 |
| `lib/auth.ts` Session 콜백 | 클라이언트로 노출되는 필드 화이트리스트 명시 |
| `prisma/schema.prisma` `LoginAttempt` 모델 | MVP는 DB 기반, 향후 Redis 전환 예정 명시 |
| `lib/services/email.ts` Resend 호출부 | 실패 시 사용자 가입은 계속 진행하되 재발송 큐로 처리 |

### @MX:TODO (GREEN 단계 완료까지의 미완 항목)

- 가입 폼 RED 테스트 작성 전: `RegisterForm.tsx`에 `@MX:TODO 이메일 형식 검증 테스트 필요`
- Rate Limit 통합 테스트 작성 전: `rate-limit.ts`에 `@MX:TODO 동시 요청 경합 테스트 필요`

---

## 위험 분석 및 완화 전략

### 리스크 1: Auth.js v5 베타 → 안정 버전 마이그레이션 비용
- **영향**: API 변경으로 인한 재작성 가능성
- **완화**: `next-auth@^5.0.0` 안정 릴리스 또는 베타 최신을 핀 고정. 공식 마이그레이션 가이드 사전 검토. `lib/auth.ts`로 추상화하여 변경 영향 국소화.

### 리스크 2: bcrypt 네이티브 빌드 실패 (Vercel/Docker 환경)
- **영향**: 배포 단계에서 빌드 깨짐
- **완화**: 백업 옵션으로 `@node-rs/bcrypt`(순수 Rust, 네이티브 의존성 적음) 준비. CI에서 빌드 테스트.

### 리스크 3: Rate Limit 우회 (분산 IP, IP 스푸핑)
- **영향**: 무차별 대입 공격
- **완화**: MVP는 IP + 이메일 이중 키 차단. 향후 reCAPTCHA 또는 Cloudflare Turnstile 도입 검토. `X-Forwarded-For` 헤더 신뢰 정책 명시.

### 리스크 4: 인증 메일 발송 실패
- **영향**: 사용자가 가입 후 글쓰기 불가 상태로 방치
- **완화**: Resend API 실패 시 가입은 성공시키되 별도 재발송 UI 제공. 발송 실패 로그 적재.

### 리스크 5: JWT 시크릿 노출
- **영향**: 모든 세션 위조 가능
- **완화**: `AUTH_SECRET`은 환경변수로만 관리. CI/CD 시크릿 저장소 사용. 로컬 `.env.local`은 `.gitignore` 등록.

### 리스크 6: Google OAuth 콜백 URL 미스매치
- **영향**: 프로덕션 배포 시 OAuth 실패
- **완화**: Google Cloud Console에 dev/staging/production 콜백 URL 모두 사전 등록. `AUTH_URL` 환경변수 환경별 분리.

### 리스크 7: 이메일 중복 + 동시 가입 경합
- **영향**: 같은 이메일로 두 개의 User 레코드 생성 가능
- **완화**: Prisma `User.email @unique` 제약 + 애플리케이션 레벨 사전 체크 이중 방어. 동시 요청 시 Prisma가 `P2002` 에러를 반환하므로 catch 후 사용자 친화적 메시지로 변환.

---

## 마일스톤 (우선순위 기반)

| 마일스톤 | 포함 작업 | 우선순위 |
|----------|----------|----------|
| **M1: 데이터 기반** | T1-1 ~ T1-5 | Priority High |
| **M2: Auth.js 골격** | T2-1 ~ T2-3 | Priority High |
| **M3: 가입/로그인 플로우** | T3-1 ~ T4-4 | Priority High |
| **M4: 이메일 인증** | T5-1 ~ T5-3 | Priority High |
| **M5: Rate Limit** | T6-1 ~ T6-3 | Priority High |
| **M6: 보호 라우트** | T7-1 ~ T7-3 | Priority Medium |
| **M7: 테스트 완비** | T8-1 ~ T8-3 | Priority High |

> 순서: M1 → M2 → (M3 ∥ M4 ∥ M5) → M6 → M7. M3/M4/M5는 독립적으로 진행 가능하며, M7은 각 마일스톤마다 점진적으로 작성한다.

---

## 검증 게이트 (Quality Gates)

- **TRUST 5**: Tested(85%+ coverage), Readable(ESLint 0 warnings), Unified(Prettier 통과), Secured(bcrypt cost=12, JWT secret 32+ bytes, OWASP Top 10 검토), Trackable(SPEC-AUTH-001 커밋 메시지 참조)
- **LSP**: TypeScript strict mode, 0 type errors, 0 ESLint errors
- **Test Coverage**: 85% 이상 (인증 핵심 로직은 100% 권장)
- **Performance**: 로그인 응답 P95 < 500ms (bcrypt 비교 포함)
