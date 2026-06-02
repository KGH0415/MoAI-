---
id: SPEC-AUTH-001
version: 0.1.0
status: draft
created: 2026-06-02
updated: 2026-06-02
author: S-103895
priority: P0
issue_number: 0
---

# SPEC-AUTH-001: 회원가입 및 로그인

## HISTORY

| 버전 | 일시 | 작성자 | 변경 내역 |
|------|------|--------|----------|
| 0.1.0 | 2026-06-02 | S-103895 | 초기 SPEC 작성. 인터뷰 결과(Round 1-2) 기반 EARS 형식 요구사항 정의. Confirmed Scope (Locked) 항목을 그대로 반영. |

---

## Overview

커뮤니티 앱의 회원 인증 시스템을 구축한다. 사용자는 이메일/비밀번호 또는 Google OAuth 계정으로 가입·로그인할 수 있으며, 가입 후 이메일 인증을 완료해야 게시글 작성 권한을 얻는다. 인증되지 않은 방문자도 공개 피드는 열람할 수 있으나, 글쓰기·댓글·좋아요 등 쓰기 액션은 인증된 사용자에게만 허용된다.

세션은 Auth.js v5의 JWT 기반 httpOnly 쿠키로 유지하며, 무차별 대입 공격을 방어하기 위해 동일 IP/이메일 기준 로그인 5회 실패 시 15분간 차단한다. 비밀번호는 bcrypt(cost=12)로 해시 저장한다. 이 SPEC은 인증 도메인의 MVP 범위로, 비밀번호 재설정 메일, 2FA, GitHub OAuth, 매직 링크 등은 명시적으로 제외한다.

---

## Requirements

### Ubiquitous Requirements (보편)

#### REQ-AUTH-001: 이메일/비밀번호 회원가입
The system **shall** allow users to register a new account using an email address and password through the `/register` page, store the password as a bcrypt hash with cost factor 12, and persist the user record in the `User` table with a unique email constraint.

- **EARS 패턴**: Ubiquitous
- **상세**:
  - 이메일은 RFC 5322 형식을 따라야 한다.
  - 비밀번호는 최소 8자, 영문(a-z, A-Z) 및 숫자(0-9)를 각각 1자 이상 포함해야 한다.
  - 가입 성공 시 인증 이메일을 자동 발송한다.

#### REQ-AUTH-002: 이메일/비밀번호 로그인 및 세션 발급
The system **shall** authenticate users via email and password through Auth.js Credentials Provider, and upon successful authentication, issue a JWT-based session cookie with `httpOnly`, `Secure`, and `SameSite=Lax` attributes.

- **EARS 패턴**: Ubiquitous
- **상세**:
  - 비밀번호 검증은 bcrypt.compare를 통해 수행한다.
  - 세션 만료 기간은 Auth.js 기본 정책(30일)을 따른다.
  - 로그인 성공 시 사용자를 직전 페이지 또는 홈 피드(`/`)로 리다이렉트한다.

### Optional Feature Requirements (선택)

#### REQ-AUTH-003: Google OAuth 로그인
**Where** the user chooses to authenticate via Google, the system **shall** delegate authentication to Google OAuth 2.0 through Auth.js Google Provider, retrieve the user's email and profile, and create or link a `User` record via `@auth/prisma-adapter`.

- **EARS 패턴**: Optional Feature
- **상세**:
  - 기존 이메일과 동일한 Google 계정으로 로그인 시 `Account` 테이블에 OAuth 식별자를 연결한다.
  - Google OAuth로 가입한 사용자는 이메일 인증을 완료한 것으로 간주한다(Google이 이미 검증함).
  - OAuth 콜백 URL은 `/api/auth/callback/google`로 고정한다.

### Event-Driven Requirements (이벤트 기반)

#### REQ-AUTH-004: 이메일 인증 플로우
**When** a new user completes email/password registration, the system **shall** generate a `VerificationToken` (24-hour TTL), send a verification email containing a confirmation link, and mark the user's `emailVerified` field as `NULL` until the link is clicked.

- **EARS 패턴**: Event-Driven
- **상세**:
  - 인증 링크 클릭 시 `emailVerified` 컬럼에 현재 시각을 기록한다.
  - 토큰은 단일 사용(one-time)이며, 사용 후 즉시 폐기한다.
  - 만료 토큰 클릭 시 재발송 안내 페이지로 리다이렉트한다.

### State-Driven Requirements (상태 기반)

#### REQ-AUTH-005: 미인증 사용자 쓰기 차단
**While** the authenticated user's `emailVerified` field is `NULL`, the system **shall** block all write actions (post creation, comment creation, like toggle) and display a notification prompting email verification.

- **EARS 패턴**: State-Driven
- **상세**:
  - API 라우트(`/api/posts`, `/api/comments`, `/api/likes`)는 401 또는 403 응답을 반환한다.
  - UI는 글쓰기 버튼을 비활성화하고 안내 메시지를 표시한다.
  - 읽기 액션(피드 조회, 게시글 상세)은 정상 허용한다.

### Unwanted Behavior Requirements (원치 않는 동작)

#### REQ-AUTH-006: 로그인 실패 Rate Limit
**If** the same IP address or email address accumulates 5 failed login attempts within a 15-minute window, **then** the system **shall** reject further login attempts from that IP/email for 15 minutes and respond with HTTP 429 (Too Many Requests).

- **EARS 패턴**: Unwanted Behavior
- **상세**:
  - 실패 카운터는 인메모리 또는 데이터베이스 기반 카운터로 구현한다(MVP는 DB 기반 권장).
  - 15분 경과 후 카운터를 자동 리셋한다.
  - 차단된 사용자에게는 "잠시 후 다시 시도해주세요" 메시지를 표시한다.

---

## Acceptance Criteria 요약

상세 시나리오는 `acceptance.md`를 참조한다. 핵심 통과 기준:

- AC-1: 유효한 이메일/비밀번호로 회원가입이 완료되며 인증 메일이 발송된다.
- AC-2: 약한 비밀번호(8자 미만 또는 영문/숫자 미포함)는 가입이 거부된다.
- AC-3: 중복 이메일로 가입 시도 시 명확한 오류 메시지가 표시된다.
- AC-4: 등록된 자격증명으로 로그인 시 JWT 쿠키가 발급된다.
- AC-5: 잘못된 비밀번호 입력 시 인증이 실패하고 카운터가 증가한다.
- AC-6: Google OAuth 플로우가 정상 동작하고 사용자 레코드가 생성/연결된다.
- AC-7: 미인증 이메일 사용자가 로그인 시 인증 안내가 표시된다.
- AC-8: 동일 IP에서 5회 연속 실패 시 15분간 추가 시도가 차단된다.

---

## Affected Files

### 생성 예상 파일

| 경로 | 역할 |
|------|------|
| `app/(auth)/login/page.tsx` | 로그인 페이지 (Server Component) |
| `app/(auth)/register/page.tsx` | 회원가입 페이지 (Server Component) |
| `app/(auth)/verify-email/page.tsx` | 이메일 인증 결과 페이지 |
| `app/api/auth/[...nextauth]/route.ts` | Auth.js v5 핸들러 |
| `app/api/auth/register/route.ts` | 회원가입 API (Credentials 가입용) |
| `app/api/auth/verify/route.ts` | 이메일 토큰 검증 API |
| `components/features/auth/LoginForm.tsx` | 로그인 폼 (react-hook-form + Zod) |
| `components/features/auth/RegisterForm.tsx` | 회원가입 폼 |
| `components/features/auth/SocialLoginButtons.tsx` | Google OAuth 버튼 |
| `lib/auth.ts` | Auth.js 설정(`authOptions`), `auth()` 헬퍼 노출 |
| `lib/validations/auth.ts` | Zod 스키마(`registerSchema`, `loginSchema`) |
| `lib/services/rate-limit.ts` | 로그인 실패 카운터 서비스 |
| `lib/services/email.ts` | 인증 메일 발송 (Resend 권장) |
| `prisma/schema.prisma` | `User`, `Account`, `Session`, `VerificationToken`, `LoginAttempt` 모델 추가 |

### 수정 예상 파일

| 경로 | 변경 사항 |
|------|----------|
| `app/layout.tsx` | SessionProvider 래핑 |
| `middleware.ts` (신규/수정) | 보호된 라우트 가드 |
| `.env.example` | `AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `DATABASE_URL`, `RESEND_API_KEY` 추가 |

---

## What NOT to Build (Exclusions)

MVP 범위에서 **제외**되는 항목입니다. 추후 별도 SPEC으로 다룹니다.

| 제외 항목 | 이유 |
|-----------|------|
| 비밀번호 재설정 메일 (Forgot Password) | 인터뷰 Confirmed Scope에서 명시적으로 제외 |
| 2FA (이중 인증) | MVP 범위 외 |
| Passkey / WebAuthn | MVP 범위 외 |
| 매직 링크 로그인 | MVP 범위 외 |
| GitHub OAuth | MVP 범위 외 (Google OAuth만 지원) |
| 비밀번호 정책 고도화 (특수문자 필수, 사전 단어 차단 등) | 인터뷰에서 "일반 수준"으로 합의 |
| 사용자 프로필 편집 (닉네임/아바타 변경) | 별도 SPEC(profile) 도메인 |
| 계정 삭제 / 탈퇴 플로우 | 별도 SPEC |
| 관리자에 의한 강제 차단 / 영구 정지 | 관리자 대시보드 SPEC에서 다룸 |
| Redis 기반 Rate Limit | MVP는 DB 기반으로 구현, 트래픽 증가 시 별도 SPEC |

---

## Technical Approach

### 핵심 라이브러리

- **Auth.js v5 (next-auth ^5.0.0)**: Next.js 16 App Router 공식 인증 솔루션
- **@auth/prisma-adapter ^2.x**: Prisma와 Auth.js 연동 어댑터
- **bcrypt ^5.x** 또는 **@node-rs/bcrypt**: 비밀번호 해시 (cost=12)
- **zod ^3.x**: 입력 검증 스키마
- **react-hook-form**: 폼 상태 관리
- **resend** 또는 **nodemailer**: 이메일 발송 (인증 메일)

### 인증 전략

- **Credentials Provider**: 이메일/비밀번호 검증 → bcrypt 비교 → JWT 발급
- **Google Provider**: OAuth 2.0 → Prisma Adapter가 `Account`/`User` 자동 관리
- **Session Strategy**: JWT (`strategy: 'jwt'`) — DB Session보다 가볍고 Serverless 환경에 적합

### Rate Limit 구현

MVP 단계에서는 `LoginAttempt` 테이블에 (IP, email, attempted_at) 기록 후 15분 윈도우 카운트. 트래픽 증가 시 Redis 기반으로 전환.

### 보안 고려사항

- 비밀번호 해시는 절대 응답에 포함하지 않는다.
- JWT 시크릿(`AUTH_SECRET`)은 환경변수로 관리하며 최소 32바이트 이상.
- 인증 이메일 토큰은 암호학적으로 안전한 난수(crypto.randomBytes)로 생성한다.
- 모든 인증 폼은 CSRF 보호(Auth.js 기본 제공)를 활성화한다.

---

**다음 단계**: `plan.md`에서 구현 작업 분해 및 데이터 모델을 정의하고, `acceptance.md`에서 Given/When/Then 시나리오를 상세화한다.
