---
id: SPEC-MBTI-001
version: 0.1.0
status: draft
created: 2026-06-02
updated: 2026-06-02
author: S-103895
priority: P1
issue_number: 0
---

# SPEC-MBTI-001: 로그인 후 MBTI 선택 및 특징 표시

## HISTORY

| 버전 | 일시 | 작성자 | 변경 내역 |
|------|------|--------|----------|
| 0.1.0 | 2026-06-02 | S-103895 | 초기 SPEC 작성. Confirmed Scope (Locked) 4개 항목 기반 EARS 형식 요구사항 정의. 정적 데이터 출처, User.mbti 영속화, 미선택 사용자 리다이렉트, /mbti 전용 경로 결정을 그대로 반영. |
| 0.1.1 | 2026-06-02 | 구현 시 DB 미연결로 User.mbti DB 저장 대신 쿠키 영속화로 대체(사용자 승인). REQ는 동일, 저장 매체만 변경. |

---

## Overview

로그인에 성공한 사용자가 자신의 MBTI를 직접 선택하고, 선택한 유형에 대한 특징 요약을 확인할 수 있는 기능을 추가한다. 사용자는 16개 MBTI 유형을 버튼 형태로 보고 그중 하나를 선택하며, 선택값은 `User` 모델의 `mbti` 필드에 영속화된다. 아직 MBTI를 선택하지 않은(`user.mbti == null`) 사용자만 로그인 후 선택 화면으로 안내되고, 이미 선택을 마친 사용자는 곧바로 결과(특징) 화면으로 이동한다.

각 MBTI 유형의 특징 요약은 외부 API(구글 검색, LLM)를 호출하지 않고 코드/JSON에 미리 작성한 정적 데이터(`lib/data/mbti.ts`)로 제공한다. 이는 실시간 구글 검색이 별도 API 키와 비용을 요구하므로 MVP 단계에서는 사전 정의된 정적 요약 텍스트로 대체하기로 인터뷰에서 합의한 결정이다. 본 기능은 `/mbti` 전용 경로에 신설되며, 기존 커뮤니티 홈(`app/page.tsx`)은 변경하지 않는다. 이 SPEC은 MBTI 도메인의 MVP 범위로, MBTI 진단 퀴즈, 동적 특징 생성, 선택값 변경/수정 등은 명시적으로 제외한다.

---

## Requirements

### Ubiquitous Requirements (보편)

#### REQ-MBTI-001: 16개 MBTI 선택 화면
The system **shall** display all 16 MBTI types (`ISTJ`, `ISFJ`, `INFJ`, `INTJ`, `ISTP`, `ISFP`, `INFP`, `INTP`, `ESTP`, `ESFP`, `ENFP`, `ENTP`, `ESTJ`, `ESFJ`, `ENFJ`, `ENTJ`) as selectable buttons on the MBTI selection screen so the user can pick exactly one type.

- **EARS 패턴**: Ubiquitous
- **상세**:
  - 16개 버튼을 그리드 형태로 표시한다(`MbtiSelector` 컴포넌트).
  - 각 버튼 레이블은 MBTI 4글자 코드를 표시하며, 보조 라벨(예: "ISTJ · 청렴결백한 논리주의자")을 함께 노출할 수 있다.
  - 16개 유형 목록과 표시 순서는 정적 데이터(`lib/data/mbti.ts`)에서 가져온다.
  - 한 번에 하나의 유형만 선택할 수 있다.

#### REQ-MBTI-002: 선택한 MBTI 특징 요약 표시
The system **shall** display the static characteristic summary corresponding to the user's selected MBTI type on the result/main screen.

- **EARS 패턴**: Ubiquitous
- **상세**:
  - 특징 요약은 사전 정의된 정적 데이터(`lib/data/mbti.ts`)에서 조회한다. 외부 API를 호출하지 않는다.
  - 각 유형 데이터는 최소한 `code`, `nickname`(별칭), `summary`(요약 문단), `traits`(핵심 특징 항목 배열)를 포함한다.
  - 결과 화면(`MbtiResult` 컴포넌트)은 선택한 유형의 별칭, 요약, 핵심 특징을 사람이 읽기 쉬운 형태로 렌더링한다.

### Event-Driven Requirements (이벤트 기반)

#### REQ-MBTI-003: MBTI 선택값 영속화
**When** the user selects one of the 16 MBTI buttons on the selection screen, the system **shall** persist the selected value into the authenticated user's `User.mbti` field and then navigate the user to the result/main screen.

- **EARS 패턴**: Event-Driven
- **상세**:
  - 저장은 인증된 사용자 본인의 레코드에 대해서만 수행한다(세션의 `user.id` 기준).
  - 저장 경로는 Server Action 또는 `app/api/mbti/route.ts` 중 하나로 구현한다(구현 판단은 plan.md 참조).
  - 저장 전 입력값은 16개 허용 코드 enum으로 검증한다(Zod enum).
  - 저장 성공 시 결과 화면(`/mbti` 또는 `/mbti/result`)으로 이동한다.

#### REQ-MBTI-004: 로그인 후 미선택 사용자 리다이렉트
**When** a user completes login while their `User.mbti` is `null`, the system **shall** redirect the user to the MBTI selection screen (`/mbti`) instead of the community home.

- **EARS 패턴**: Event-Driven
- **상세**:
  - 로그인 직후 분기는 `LoginForm.tsx`의 리다이렉트 로직 또는 `/mbti` 서버 컴포넌트의 진입 검사에서 수행한다.
  - 기존 커뮤니티 홈(`app/page.tsx`)으로의 일반 진입은 변경하지 않는다(미선택 사용자라도 홈을 직접 열람하는 것은 본 SPEC의 강제 차단 대상이 아니며, 강제 리다이렉트 범위는 로그인 직후 및 `/mbti` 진입으로 한정한다).
  - `callbackUrl`이 지정된 경우의 우선순위는 plan.md에서 정의한다.

### State-Driven Requirements (상태 기반)

#### REQ-MBTI-005: 선택 여부에 따른 /mbti 화면 분기
**While** the authenticated user's `User.mbti` is `null`, the system **shall** render the selection screen when the user navigates to `/mbti`; **while** the user's `User.mbti` holds a valid MBTI code, the system **shall** render the result/main screen showing that type's summary.

- **EARS 패턴**: State-Driven
- **상세**:
  - `/mbti` 진입 시 서버 컴포넌트가 현재 사용자의 `mbti` 값을 DB에서 조회하여 분기한다.
  - 미선택 상태: `MbtiSelector`(선택 화면)를 렌더링한다.
  - 선택 완료 상태: `MbtiResult`(결과 화면)로 렌더링하거나 `/mbti/result`로 라우팅한다(단일 페이지+상태 분기 또는 별도 결과 페이지 중 택일, plan.md 참조).
  - 비인증 사용자가 `/mbti`에 접근하면 로그인 페이지(`/login`)로 리다이렉트한다.

### Unwanted Behavior Requirements (원치 않는 동작)

#### REQ-MBTI-006: 알 수 없는 MBTI 값에 대한 안전한 폴백
**If** the `mbti` value present in the URL or in the `User.mbti` field is not one of the 16 valid MBTI codes (unknown, malformed, or legacy value), **then** the system **shall not** crash, and **shall** treat the user as not having selected (fall back to the selection screen) and never render an undefined characteristic summary.

- **EARS 패턴**: Unwanted Behavior
- **상세**:
  - 정적 데이터 조회 시 키가 존재하지 않으면 `MbtiResult`를 렌더링하지 않고 선택 화면으로 폴백한다.
  - 저장 API/Action는 16개 enum에 없는 값을 거부하고 HTTP 400(또는 동등한 오류)을 반환한다.
  - 하드코딩된 테스트 계정(`lib/auth.ts`의 `test-user`)처럼 DB에 실제 레코드가 없는 세션의 경우에도, mbti 조회가 `null`/실패하면 안전하게 선택 화면으로 폴백한다(예외를 던지지 않는다).

---

## Acceptance Criteria 요약

상세 시나리오는 `acceptance.md`를 참조한다. 핵심 통과 기준:

- AC-1: MBTI 미선택 사용자가 로그인하면 `/mbti` 선택 화면으로 이동한다.
- AC-2: 선택 화면에 16개 MBTI 버튼이 모두 표시된다.
- AC-3: 버튼 하나를 선택하면 `User.mbti`에 값이 저장되고 결과 화면으로 이동한다.
- AC-4: 결과 화면에 선택한 유형의 정적 특징 요약이 표시된다.
- AC-5: 이미 MBTI를 선택한 사용자가 로그인하면 선택 화면을 건너뛰고 바로 결과 화면을 본다.
- AC-6: 선택 완료 사용자가 `/mbti`에 진입하면 결과 화면이 렌더링된다(선택 화면으로 되돌아가지 않는다).
- AC-7: URL 또는 DB의 mbti 값이 유효하지 않으면 충돌 없이 선택 화면으로 폴백한다.
- AC-8: 비인증 사용자가 `/mbti`에 접근하면 로그인 페이지로 리다이렉트된다.

---

## Affected Files

### 생성 예상 파일

| 경로 | 역할 |
|------|------|
| `lib/data/mbti.ts` | 16개 MBTI 정적 데이터 + 타입 정의(`MbtiCode`, `MbtiInfo`), 코드→정보 조회 헬퍼 |
| `app/mbti/page.tsx` | `/mbti` 진입점 (Server Component). `User.mbti` 조회 후 선택/결과 분기 |
| `app/mbti/result/page.tsx` | 결과(특징) 화면 — 단일 페이지+상태 분기 채택 시 미생성 가능(plan.md 판단) |
| `components/features/mbti/MbtiSelector.tsx` | 16개 버튼 그리드 + 선택 핸들러 (Client Component) |
| `components/features/mbti/MbtiResult.tsx` | 선택한 유형의 별칭/요약/특징 표시 |
| `app/api/mbti/route.ts` | 선택값 저장 엔드포인트 (또는 Server Action으로 대체 가능) |
| `lib/validations/mbti.ts` | `mbti` 값 Zod enum 스키마(`mbtiSchema`) |
| `lib/data/mbti.test.ts` | 정적 데이터/헬퍼 단위 테스트 (Vitest) |
| `lib/validations/mbti.test.ts` | Zod enum 검증 단위 테스트 (Vitest) |
| `components/features/mbti/MbtiSelector.test.tsx` | 선택 컴포넌트 렌더/선택 테스트 |
| `components/features/mbti/MbtiResult.test.tsx` | 결과 컴포넌트 렌더 테스트 |
| `app/api/mbti/route.test.ts` | 저장 경로 통합 테스트 (Server Action 채택 시 해당 테스트로 대체) |

### 수정 예상 파일

| 경로 | 변경 사항 |
|------|----------|
| `prisma/schema.prisma` | `User` 모델에 `mbti String?` 필드 추가 + 마이그레이션 |
| `components/features/auth/LoginForm.tsx` | 로그인 성공 후 `user.mbti == null`이면 `/mbti`로 리다이렉트 분기 |
| `lib/auth.ts` | (선택) 리다이렉트 판단을 콜백에서 처리할 경우에만 조정 — MVP는 서버 컴포넌트 분기 권장으로 수정 최소화 |

---

## What NOT to Build (Exclusions)

MVP 범위에서 **제외**되는 항목입니다. 추후 별도 SPEC으로 다룹니다.

| 제외 항목 | 이유 |
|-----------|------|
| 실제 구글 검색 API 연동 | 별도 API 키/비용/쿼터 필요. MVP는 정적 데이터로 대체(Confirmed Scope) |
| LLM 기반 동적 특징 생성 | 외부 LLM API 비용/지연/비결정성. MVP는 사전 정의된 정적 요약 사용 |
| MBTI 진단/테스트 퀴즈 | 본 기능은 사용자가 직접 유형을 선택하는 방식. 문항 기반 진단은 범위 외 |
| 선택 후 MBTI 변경/재선택 | MVP는 1회 선택·표시에 집중. 변경 플로우는 별도 SPEC(추후) |
| 유형별 이미지/일러스트레이션 | 시각 에셋 제작/관리 범위 외. MVP는 텍스트 요약 중심 |
| 다국어 특징 요약 | MVP는 단일 언어(한국어) 정적 텍스트. i18n은 별도 SPEC |
| MBTI 기반 추천/매칭 기능 | 다른 사용자와의 매칭·추천은 별도 도메인 SPEC |
| 기존 커뮤니티 홈(`app/page.tsx`) 변경 | Confirmed Scope에서 홈은 그대로 유지하기로 합의 |

---

## Technical Approach

### 정적 데이터 모듈 형태

`lib/data/mbti.ts`는 16개 유형을 키로 갖는 단일 데이터 소스와 타입을 정의한다(개념 형태):

- `type MbtiCode`: 16개 코드의 문자열 리터럴 유니온.
- `interface MbtiInfo`: `{ code: MbtiCode; nickname: string; summary: string; traits: string[] }`.
- `const MBTI_DATA: Record<MbtiCode, MbtiInfo>`: 16개 항목 전부 채운 정적 객체.
- `getMbtiInfo(code: string): MbtiInfo | null`: 키가 유효하지 않으면 `null` 반환(REQ-MBTI-006 폴백 근거).

이 모듈은 외부 의존성·네트워크 호출이 없으며, 캐싱 레이어를 두지 않는다(TRUST 5 Readable — 과도한 추상화 금지).

### 리다이렉트 전략 (REQ-MBTI-004 / REQ-MBTI-005)

두 진입 지점에서 분기를 처리한다:

1. **로그인 직후 분기 (REQ-MBTI-004)**: `LoginForm.tsx`는 현재 `signIn("credentials", { redirect: false })` 후 `router.push(callbackUrl ?? "/")`를 호출한다. 이를 `/mbti`로 우선 이동하도록 조정하되, `/mbti` 서버 컴포넌트가 다시 한번 선택 여부를 판별하므로 분기 로직의 단일 진실 공급원은 `/mbti` 진입 검사로 둔다.
2. **`/mbti` 진입 분기 (REQ-MBTI-005)**: `app/mbti/page.tsx`(Server Component)가 세션 → 사용자 `mbti` 조회 → 미선택이면 선택 화면, 선택 완료면 결과 화면으로 렌더링한다. 비인증이면 `/login`으로 리다이렉트한다.

미들웨어 강제 가드는 본 MVP의 필수가 아니다. 서버 컴포넌트 진입 검사만으로 요구사항을 충족하며, 과도한 미들웨어 도입을 지양한다.

### mbti 값이 세션/JWT에 도달하는 방법 (핵심 트레이드오프)

현재 `lib/auth.ts`의 JWT/세션 콜백은 클라이언트 노출 필드를 `id`, `email`, `emailVerified`로 **화이트리스트**한다. `mbti`는 토큰에 포함되어 있지 않다. 따라서 `/mbti` 화면에서 mbti를 읽는 방법은 두 가지다:

- **옵션 A (권장, MVP)**: `/mbti` 서버 컴포넌트에서 세션의 `user.id`로 DB를 직접 조회한다(`db.user.findUnique({ where: { id }, select: { mbti: true } })`). 토큰 스키마를 건드리지 않아 변경 영향이 작고, 선택 직후의 최신 값을 항상 반영한다.
  - 트레이드오프: 진입 시마다 1회 DB 조회가 발생한다(서버 컴포넌트 1쿼리, 부담 미미).
- **옵션 B**: JWT/세션 콜백에 `mbti`를 추가해 토큰에 싣는다.
  - 트레이드오프: 선택 직후 토큰이 갱신되기 전까지 stale 값이 노출될 수 있어 강제 세션 갱신 로직이 필요하고, `lib/auth.ts`의 화이트리스트(보안 경계)를 확장하게 된다.

MVP는 **옵션 A(서버 컴포넌트 DB 조회)** 를 채택한다. 단순하고 stale 문제가 없으며 `lib/auth.ts` 보안 경계를 변경하지 않는다.

### 데이터 모델 변경

`prisma/schema.prisma`의 `User` 모델(`@@map("users")`)에 nullable 필드를 추가한다:

```prisma
mbti String?  // 선택한 MBTI 4글자 코드. 미선택 시 null (REQ-MBTI-003/004)
```

마이그레이션은 nullable 컬럼 추가이므로 기존 데이터에 안전하다(`prisma migrate dev --name add_user_mbti`).

### 검증

`lib/validations/mbti.ts`에 16개 코드만 허용하는 Zod enum(`z.enum([...])`)을 정의하고, 저장 경로(REQ-MBTI-003)와 결과 조회 폴백(REQ-MBTI-006) 양쪽에서 동일 enum을 단일 진실 공급원으로 사용한다.

### 단순성 원칙 (TRUST 5 Readable)

본 기능은 MVP다. 실제 검색·LLM·캐싱·미들웨어 가드를 도입하지 않는다. 정적 데이터 1개 모듈, 서버 컴포넌트 1개 분기, 저장 경로 1개로 요구사항을 충족한다.

---

**다음 단계**: `plan.md`에서 TDD 기반 작업 분해 및 데이터 모델 변경을 정의하고, `acceptance.md`에서 Given/When/Then 시나리오를 상세화한다.
