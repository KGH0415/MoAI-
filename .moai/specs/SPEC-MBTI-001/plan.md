# SPEC-MBTI-001: 구현 계획 (Plan)

## 개요

본 문서는 SPEC-MBTI-001(로그인 후 MBTI 선택 및 특징 표시)의 구현 계획을 정의합니다. Next.js 16 App Router, React 19 Server Components, Prisma 6, PostgreSQL 16, Auth.js v5(JWT 세션) 스택을 기반으로 MBTI 도메인 MVP를 구축합니다. 개발 방식은 TDD(RED-GREEN-REFACTOR)이며, 각 작업 단위는 테스트 파일을 먼저 작성합니다(커밋당 최소 80% 커버리지).

---

## 기술 스택 및 라이브러리

### 핵심 의존성 (이미 프로젝트에 존재)

| 라이브러리 | 역할 |
|------------|------|
| `next` (16.x) | App Router, Server Components, Server Actions |
| `next-auth` (v5) | 세션(`auth()` 헬퍼)로 현재 사용자 식별 |
| `@prisma/client` / `prisma` (6.x) | `User.mbti` 영속화 + 마이그레이션 |
| `zod` (^3.x) | mbti enum 검증 |
| `react-hook-form` | (선택) 선택 폼 상태 — MVP는 단순 버튼 클릭으로 충분 |

> 신규 외부 의존성은 추가하지 않는다(정적 데이터·서버 컴포넌트만으로 구현, 단순성 원칙).

### 신규 환경변수

- 없음. 외부 API를 사용하지 않으므로 API 키/시크릿 추가가 필요 없다(Exclusions: 실제 검색/LLM 제외).

---

## 데이터 모델 (Prisma Schema 변경)

기존 `User` 모델(`@@map("users")`)에 nullable 필드 1개를 추가한다:

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  passwordHash  String?
  name          String?
  image         String?
  mbti          String?   // 선택한 MBTI 4글자 코드. 미선택 시 null (REQ-MBTI-003/004)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("users")
}
```

마이그레이션:

```bash
pnpm prisma migrate dev --name add_user_mbti
```

> nullable 컬럼 추가이므로 기존 데이터에 안전하다. 기존 사용자는 모두 `mbti = null`(미선택) 상태가 되어 다음 로그인 시 선택 화면으로 안내된다(REQ-MBTI-004).

---

## 정적 데이터 모듈 설계 (`lib/data/mbti.ts`)

개념 형태(구현은 GREEN 단계에서):

- `export type MbtiCode`: 16개 코드의 문자열 리터럴 유니온.
- `export interface MbtiInfo { code: MbtiCode; nickname: string; summary: string; traits: string[] }`.
- `export const MBTI_CODES: readonly MbtiCode[]`: 표시 순서를 가진 16개 코드 배열(컴포넌트/검증에서 단일 소스로 사용).
- `export const MBTI_DATA: Record<MbtiCode, MbtiInfo>`: 16개 항목 전부.
- `export function getMbtiInfo(code: string): MbtiInfo | null`: 유효하지 않으면 `null`(REQ-MBTI-006 폴백).

특징: 외부 호출 없음, 캐싱 없음, 단일 데이터 소스.

---

## 작업 분해 (Task Breakdown) — TDD 순서 (테스트 먼저)

### Phase 1: 데이터 모델 변경 (Priority High)

- **T1-1 (RED)**: `User.mbti` 관련 동작을 검증할 통합 테스트의 픽스처/기대 정의(빈 mbti = 미선택).
- **T1-2 (GREEN)**: `prisma/schema.prisma`의 `User`에 `mbti String?` 추가.
- **T1-3 (GREEN)**: `pnpm prisma migrate dev --name add_user_mbti` 실행 및 Prisma Client 재생성.

### Phase 2: 정적 데이터 모듈 (Priority High)

- **T2-1 (RED)**: `lib/data/mbti.test.ts` 작성
  - `MBTI_DATA`가 16개 코드를 모두 포함(누락/중복 없음).
  - 각 항목이 `code`/`nickname`/`summary`/비어있지 않은 `traits`를 가짐.
  - `getMbtiInfo("INTJ")` → 정상 객체, `getMbtiInfo("XXXX")`/`getMbtiInfo("intj")` → `null`.
- **T2-2 (GREEN)**: `lib/data/mbti.ts` 구현(타입 + 16개 데이터 + `getMbtiInfo`).
- **T2-3 (REFACTOR)**: 데이터 구조 정리, `@MX:NOTE` 추가(정적 데이터 출처/외부 API 미사용 명시).

### Phase 3: 검증 스키마 (Priority High)

- **T3-1 (RED)**: `lib/validations/mbti.test.ts` 작성 — 16개 코드는 통과, 그 외는 거부.
- **T3-2 (GREEN)**: `lib/validations/mbti.ts`에 `mbtiSchema = z.enum([...MBTI_CODES])` 정의(코드 배열을 단일 소스로 재사용).

### Phase 4: 선택값 저장 경로 (Priority High)

> 결정 포인트: **Server Action** 또는 **`app/api/mbti/route.ts`**. MVP 권장은 Server Action(폼/컴포넌트와 결합 단순, 별도 fetch 불필요). API 라우트가 더 명확하다면 그것으로 대체.

- **T4-1 (RED)**: 저장 경로 테스트 작성(`app/api/mbti/route.test.ts` 또는 Server Action 테스트)
  - 인증된 사용자 + 유효 코드 → 본인 `User.mbti` 갱신 성공.
  - enum 밖 값 → 400(또는 거부) + 미갱신.
  - 비인증 → 거부.
- **T4-2 (GREEN)**: 저장 경로 구현
  - 세션 `auth()`로 `user.id` 확인(없으면 거부).
  - `mbtiSchema`로 입력 검증.
  - `db.user.update({ where: { id }, data: { mbti } })`.
- **T4-3 (REFACTOR)**: `@MX:ANCHOR`/`@MX:WARN` 적용(본인 레코드만 갱신, 인증 검사 강제).

### Phase 5: /mbti 진입 분기 (Server Component) (Priority High)

- **T5-1 (RED)**: `app/mbti/page.tsx` 진입 분기 테스트
  - 비인증 → `/login` 리다이렉트.
  - `mbti == null` → 선택 화면 렌더.
  - `mbti == "INTJ"`(유효) → 결과 화면 렌더.
  - `mbti == "XXXX"`(무효) → 선택 화면 폴백(예외 없음).
- **T5-2 (GREEN)**: `app/mbti/page.tsx` 구현
  - `auth()` → 미인증이면 `redirect("/login")`.
  - 세션 `user.id`로 DB 조회(`select: { mbti: true }`) — Technical Approach 옵션 A.
  - `getMbtiInfo(mbti)` 결과로 분기: `null`이면 `MbtiSelector`, 유효하면 `MbtiResult`(또는 `/mbti/result`).
- **T5-3 (REFACTOR)**: 분기 로직 단순화, `@MX:NOTE`(mbti를 토큰이 아닌 DB에서 읽는 이유: 화이트리스트/stale 회피).

### Phase 6: UI 컴포넌트 (Priority High)

- **T6-1 (RED)**: `components/features/mbti/MbtiSelector.test.tsx`
  - 16개 버튼 렌더, 클릭 시 저장 핸들러 호출.
- **T6-2 (GREEN)**: `MbtiSelector.tsx`(Client Component) — `MBTI_CODES` 기반 16개 버튼 그리드 + 선택 시 저장 경로 호출 후 결과로 이동.
- **T6-3 (RED)**: `components/features/mbti/MbtiResult.test.tsx`
  - 주어진 `MbtiInfo`의 `nickname`/`summary`/`traits` 렌더 검증.
- **T6-4 (GREEN)**: `MbtiResult.tsx` — 별칭/요약/특징 표시.
- **T6-5 (REFACTOR)**: Tailwind/shadcn 정리, 접근성(버튼 라벨) 보강.

### Phase 7: 로그인 후 리다이렉트 연결 (Priority Medium)

- **T7-1 (RED)**: `LoginForm.tsx` 로그인 성공 분기 테스트 — `mbti == null` 시 `/mbti`로 이동, 선택 완료 시에도 `/mbti`(서버 컴포넌트가 결과로 분기)로 이동.
- **T7-2 (GREEN)**: `LoginForm.tsx`의 `router.push(callbackUrl ?? "/")`를 `/mbti` 우선으로 조정.
  - 단일 진실 공급원은 `/mbti` 서버 컴포넌트 분기이므로 `LoginForm`은 `/mbti`로만 보낸다(세부 분기는 서버 컴포넌트가 담당).
- **T7-3 (REFACTOR)**: `callbackUrl` 우선순위 정책 확정 및 주석.

### Phase 8: E2E (Priority High)

- **T8-1**: Playwright — "미선택 사용자 로그인 → /mbti 선택 화면 → INTJ 클릭 → 결과 화면에 INTJ 특징 표시"(AC-1~AC-4).
- **T8-2**: Playwright — "이미 선택한 사용자 로그인 → 결과 화면 직행"(AC-5~AC-6).
- **T8-3**: Playwright — "비인증 /mbti 접근 → /login 리다이렉트"(AC-8).

---

## MX 태그 계획 (mx_plan)

@MX 태그는 GREEN 단계 진입 시 추가합니다(`code_comments: ko` 기준 한국어 작성).

### @MX:ANCHOR (불변 계약)

| 위치 | 사유 |
|------|------|
| 저장 경로(`app/api/mbti/route.ts` 핸들러 또는 Server Action) | MBTI 영속화 단일 진입점. 본인 레코드만 갱신하는 보안 계약 |
| `lib/data/mbti.ts` `getMbtiInfo()` | 선택 화면/결과 화면/폴백이 공통 의존하는 조회 진입점 |

### @MX:WARN (위험 지대 — @MX:REASON 동반)

| 위치 | 사유 |
|------|------|
| 저장 경로 인증 검사 | 세션 `user.id` 누락 시 타인 레코드 갱신 위험. `auth()` 확인 없이 update 금지 |
| `app/mbti/page.tsx` DB 조회 분기 | 테스트 계정/무효 값 등 mbti 조회 실패 시 예외 대신 폴백 필수(REQ-MBTI-006) |

### @MX:NOTE (의도/맥락 전달)

| 위치 | 내용 |
|------|------|
| `lib/data/mbti.ts` 상단 | 특징은 정적 데이터. 외부 API(구글/LLM) 미사용 — MVP 합의 사항 |
| `app/mbti/page.tsx` DB 조회부 | mbti를 JWT가 아닌 DB에서 읽는 이유: `lib/auth.ts` 세션 화이트리스트 미포함 + stale 회피(Technical Approach 옵션 A) |
| `lib/validations/mbti.ts` | 저장 검증과 폴백 판정이 동일 enum을 단일 소스로 사용 |

### @MX:TODO (RED 단계 미완 항목)

- `MbtiSelector.tsx`: `@MX:TODO 16개 버튼 렌더/클릭 테스트 통과 전`
- 저장 경로: `@MX:TODO enum 밖 값 거부 테스트 통과 전`

---

## 위험 분석 및 완화 전략

### 리스크 1: 세션에 mbti가 없어 stale/추가 조회 발생
- **영향**: `/mbti` 진입마다 DB 1쿼리.
- **완화**: 서버 컴포넌트 단일 쿼리(`select: { mbti: true }`)로 부담 최소. 토큰 확장(옵션 B)은 stale·보안 경계 확장 비용이 더 커서 채택하지 않음.

### 리스크 2: 테스트 계정(`test-user`)은 DB 레코드가 없음
- **영향**: mbti 조회가 사용자 없음으로 실패 → 예외 가능성.
- **완화**: 조회 실패/`null`을 미선택과 동일하게 폴백 처리(REQ-MBTI-006, AC-7). 예외를 던지지 않음.

### 리스크 3: 정적 데이터 무결성 결함(유형 누락/오타)
- **영향**: 특정 유형 선택 시 결과 미표시.
- **완화**: `lib/data/mbti.test.ts`에서 16개 완전성 + 필수 필드 비어있지 않음을 강제(RED에서 차단).

### 리스크 4: 저장 경로 권한 누락(타인 레코드 갱신)
- **영향**: 보안 취약점.
- **완화**: 세션 `user.id`만으로 `where`를 구성. 클라이언트가 보낸 userId를 신뢰하지 않음. `@MX:WARN`으로 명시.

### 리스크 5: 무효 mbti 값이 URL/DB에 유입
- **영향**: undefined 특징 렌더 또는 크래시.
- **완화**: `getMbtiInfo`가 `null` 반환 → 선택 화면 폴백. 저장 시 enum 거부(400).

### 리스크 6: 로그인 리다이렉트 분기 중복(LoginForm + 서버 컴포넌트)
- **영향**: 분기 로직 산재로 불일치 가능.
- **완화**: 단일 진실 공급원을 `/mbti` 서버 컴포넌트로 두고 `LoginForm`은 `/mbti`로만 이동시킨다.

---

## 마일스톤 (우선순위 기반)

| 마일스톤 | 포함 작업 | 우선순위 |
|----------|----------|----------|
| **M1: 데이터 기반** | T1-1 ~ T1-3 (User.mbti + 마이그레이션) | Priority High |
| **M2: 정적 데이터 + 검증** | T2-1 ~ T3-2 | Priority High |
| **M3: 저장 경로** | T4-1 ~ T4-3 | Priority High |
| **M4: /mbti 진입 분기** | T5-1 ~ T5-3 | Priority High |
| **M5: UI 컴포넌트** | T6-1 ~ T6-5 | Priority High |
| **M6: 로그인 리다이렉트 연결** | T7-1 ~ T7-3 | Priority Medium |
| **M7: E2E 완비** | T8-1 ~ T8-3 | Priority High |

> 순서: M1 → M2 → (M3 ∥ M4) → M5 → M6 → M7. M3/M4는 독립적으로 진행 가능하며, 테스트는 각 마일스톤마다 RED 우선으로 점진 작성한다.

---

## 검증 게이트 (Quality Gates)

- **TRUST 5**: Tested(80%+ coverage, 정적 데이터 16개 완전성 테스트), Readable(ESLint 0 warnings), Unified(Prettier 통과), Secured(본인 레코드만 갱신·enum 검증), Trackable(SPEC-MBTI-001 커밋 메시지 참조)
- **LSP**: TypeScript strict mode, 0 type errors, 0 ESLint errors
- **Test Coverage**: 80% 이상(`lib/data/mbti.ts`, `lib/validations/mbti.ts`는 100% 권장)
- **외부 호출 금지**: 구글/LLM API 호출 0회 검증
- **스코프 준수**: 기존 `app/page.tsx` 미변경, Exclusions 항목 미구현 확인
