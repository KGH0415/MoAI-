# SPEC-AUTH-001 (Compact): 회원가입 및 로그인

> 본 문서는 `spec.md`의 압축본입니다. REQ 항목, AC 시나리오 헤더(Given/When/Then 본문 포함), Affected Files, What NOT to Build만 포함하며, Overview / Technical Approach / HISTORY는 제외합니다.

---

## Requirements

### REQ-AUTH-001: 이메일/비밀번호 회원가입 (Ubiquitous)

The system **shall** allow users to register a new account using an email address and password through the `/register` page, store the password as a bcrypt hash with cost factor 12, and persist the user record in the `User` table with a unique email constraint.

- 이메일은 RFC 5322 형식
- 비밀번호 최소 8자, 영문+숫자 각 1자 이상
- 가입 성공 시 인증 이메일 자동 발송

### REQ-AUTH-002: 이메일/비밀번호 로그인 및 세션 발급 (Ubiquitous)

The system **shall** authenticate users via email and password through Auth.js Credentials Provider, and upon successful authentication, issue a JWT-based session cookie with `httpOnly`, `Secure`, and `SameSite=Lax` attributes.

- bcrypt.compare 사용
- 세션 만료 30일 (Auth.js 기본)
- 성공 시 직전 페이지 또는 `/` 리다이렉트

### REQ-AUTH-003: Google OAuth 로그인 (Optional Feature)

**Where** the user chooses to authenticate via Google, the system **shall** delegate authentication to Google OAuth 2.0 through Auth.js Google Provider, retrieve the user's email and profile, and create or link a `User` record via `@auth/prisma-adapter`.

- 동일 이메일 OAuth는 기존 사용자에 연결 (Account 테이블)
- OAuth 가입자는 `emailVerified` 자동 설정
- 콜백 URL `/api/auth/callback/google` 고정

### REQ-AUTH-004: 이메일 인증 플로우 (Event-Driven)

**When** a new user completes email/password registration, the system **shall** generate a `VerificationToken` (24-hour TTL), send a verification email containing a confirmation link, and mark the user's `emailVerified` field as `NULL` until the link is clicked.

- 토큰 단일 사용, 검증 후 폐기
- 24시간 TTL
- 만료 토큰 클릭 시 재발송 안내 페이지로

### REQ-AUTH-005: 미인증 사용자 쓰기 차단 (State-Driven)

**While** the authenticated user's `emailVerified` field is `NULL`, the system **shall** block all write actions (post creation, comment creation, like toggle) and display a notification prompting email verification.

- API 라우트 401/403 응답
- UI 글쓰기 버튼 비활성화
- 읽기 액션은 정상 허용

### REQ-AUTH-006: 로그인 실패 Rate Limit (Unwanted Behavior)

**If** the same IP address or email address accumulates 5 failed login attempts within a 15-minute window, **then** the system **shall** reject further login attempts from that IP/email for 15 minutes and respond with HTTP 429 (Too Many Requests).

- DB 기반 LoginAttempt 카운터
- 15분 윈도우 경과 시 자동 리셋
- 차단 메시지: "잠시 후 다시 시도해주세요"

---

## Acceptance Criteria

### AC-1: 이메일 회원가입 성공

- **Given**: `/register` 접속, `newuser@example.com` 미존재, Resend 정상
- **When**: 유효 이메일 + `SecurePass123` 입력 후 가입
- **Then**: 201/200 응답, `User` 생성, bcrypt 해시 저장(cost=12), `emailVerified=NULL`, `VerificationToken` 발급, 인증 이메일 발송
- **And**: "이메일 확인" 페이지 리다이렉트, 자동 로그인 없음

### AC-2: 약한 비밀번호로 가입 실패

- **Given**: 회원가입 페이지 접속, Zod `registerSchema` 활성
- **When**: `short1` / `password` / `12345678` 중 하나로 가입 시도
- **Then**: 400 응답, `User` 미생성, 검증 메시지 반환
- **And**: 폼 필드별 오류 표시, 인증 메일 미발송

### AC-3: 중복 이메일 가입 실패

- **Given**: `existing@example.com` 이미 존재
- **When**: 동일 이메일 + 유효 비밀번호로 가입 시도
- **Then**: 409 응답, 새 레코드 미생성, "이미 사용 중인 이메일" 메시지
- **And**: 기존 해시 불변, 인증 메일 미발송, 기존 사용자 무알림

### AC-4: 이메일/비밀번호 로그인 성공

- **Given**: `verified@example.com` 존재, `emailVerified` 설정, 비밀번호 `correctPassword123` bcrypt 저장
- **When**: 정확한 자격증명 입력 후 로그인
- **Then**: 200 응답, JWT 쿠키 발급(`httpOnly`, `Secure`, `SameSite=Lax`), payload에 `userId`, `email`, `emailVerified` 포함
- **And**: `/` 또는 `callbackUrl`로 리다이렉트, `LoginAttempt success=true` 기록

### AC-5: 잘못된 비밀번호 로그인 실패

- **Given**: `verified@example.com` 존재, 최근 15분 실패 카운트 0
- **When**: 잘못된 비밀번호 `wrongPassword`로 시도
- **Then**: 401 응답, 세션 미발급, 모호한 메시지 ("이메일 또는 비밀번호가 올바르지 않습니다")
- **And**: `LoginAttempt success=false` 기록, 카운터 +1

### AC-6: Google OAuth 로그인 성공

- **Given**: Google 계정 인증 가능, Google Provider 설정 완료, 콜백 URL 등록
- **When**: "Google로 로그인" 클릭 → 동의 → 콜백 리다이렉트
- **Then**: 액세스 토큰 교환, `User` 신규 생성 또는 연결, `Account` 레코드 생성, `emailVerified` 자동 설정, JWT 쿠키 발급
- **And**: `/` 리다이렉트, 동일 이메일 재로그인 시 기존 User에 연결 (중복 없음)

### AC-7: 미인증 이메일로 로그인 시 안내

- **Given**: `unverified@example.com` 존재, `emailVerified=NULL`, 비밀번호 매칭
- **When**: 올바른 자격증명으로 로그인 시도
- **Then**: 로그인 성공 가능하나 "이메일 인증 필요" 안내 표시 (선택 A 권장: 세션 발급 + 글쓰기 차단)
- **And**: 글쓰기/댓글/좋아요 API 403 (`EMAIL_NOT_VERIFIED`), UI 버튼 비활성화, 읽기는 정상

### AC-8: 5회 실패 후 15분 차단

- **Given**: `target@example.com` 존재, IP `192.168.1.100` 실패 카운트 0
- **When**: 동일 IP에서 잘못된 비밀번호로 5회 연속 시도
- **Then**: 1~5회 401 응답, 카운터 5 도달
- **And (6회+)**: 동일 IP/이메일은 429 응답, "15분 후 다시 시도" 메시지, 올바른 비밀번호도 차단, 15분 후 자동 해제

---

## Affected Files

### 생성

| 경로 | 역할 |
|------|------|
| `app/(auth)/login/page.tsx` | 로그인 페이지 |
| `app/(auth)/register/page.tsx` | 회원가입 페이지 |
| `app/(auth)/verify-email/page.tsx` | 이메일 인증 결과 페이지 |
| `app/api/auth/[...nextauth]/route.ts` | Auth.js v5 핸들러 |
| `app/api/auth/register/route.ts` | 회원가입 API |
| `app/api/auth/verify/route.ts` | 이메일 토큰 검증 API |
| `components/features/auth/LoginForm.tsx` | 로그인 폼 |
| `components/features/auth/RegisterForm.tsx` | 회원가입 폼 |
| `components/features/auth/SocialLoginButtons.tsx` | Google 버튼 |
| `lib/auth.ts` | Auth.js 설정 및 `auth()` 헬퍼 |
| `lib/validations/auth.ts` | Zod 스키마 |
| `lib/services/rate-limit.ts` | 로그인 실패 카운터 |
| `lib/services/email.ts` | 인증 메일 발송 |
| `prisma/schema.prisma` | User/Account/Session/VerificationToken/LoginAttempt 모델 |

### 수정

| 경로 | 변경 |
|------|------|
| `app/layout.tsx` | SessionProvider 래핑 |
| `middleware.ts` | 보호 라우트 가드 |
| `.env.example` | AUTH_SECRET, GOOGLE_CLIENT_*, RESEND_API_KEY 추가 |

---

## What NOT to Build (Exclusions)

| 제외 항목 | 이유 |
|-----------|------|
| 비밀번호 재설정 메일 (Forgot Password) | 인터뷰 Confirmed Scope 명시 제외 |
| 2FA (이중 인증) | MVP 범위 외 |
| Passkey / WebAuthn | MVP 범위 외 |
| 매직 링크 로그인 | MVP 범위 외 |
| GitHub OAuth | MVP 범위 외 (Google만 지원) |
| 비밀번호 정책 고도화 (특수문자 필수 등) | "일반 수준" 합의 |
| 사용자 프로필 편집 | 별도 SPEC (profile 도메인) |
| 계정 삭제 / 탈퇴 | 별도 SPEC |
| 관리자 강제 차단 / 영구 정지 | 관리자 대시보드 SPEC |
| Redis 기반 Rate Limit | MVP는 DB 기반, 트래픽 증가 시 별도 SPEC |
