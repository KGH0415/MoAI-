# SPEC-MBTI-001: 인수 기준 (Acceptance Criteria)

본 문서는 SPEC-MBTI-001의 모든 요구사항이 충족되었음을 검증하기 위한 Given/When/Then 시나리오를 정의합니다. 각 시나리오는 자동화 가능한 형태로 작성되었으며, Vitest 단위/통합 테스트 또는 Playwright E2E 테스트로 구현됩니다.

---

## 인수 시나리오

### AC-1: MBTI 미선택 사용자 로그인 후 선택 화면 이동

**Given**:
- 데이터베이스에 사용자 `picker@example.com`가 존재하며 `User.mbti`가 `null`
- 해당 사용자의 자격증명이 유효함

**When**:
- 사용자가 로그인 페이지(`/login`)에서 올바른 이메일/비밀번호로 로그인

**Then**:
- 로그인이 성공하고 세션 쿠키가 발급된다
- 사용자는 MBTI 선택 화면(`/mbti`)으로 이동한다
- 커뮤니티 홈(`/`) 또는 결과 화면(`/mbti/result`)으로 이동하지 않는다

**And**:
- 선택 화면이 렌더링된다(`MbtiSelector` 표시)

---

### AC-2: 선택 화면에 16개 MBTI 버튼 표시

**Given**:
- 사용자가 인증된 상태이며 `User.mbti`가 `null`
- 정적 데이터 `lib/data/mbti.ts`가 16개 유형을 모두 포함

**When**:
- 사용자가 `/mbti` 선택 화면에 접속

**Then**:
- 16개의 MBTI 선택 버튼이 모두 렌더링된다(`ISTJ`, `ISFJ`, `INFJ`, `INTJ`, `ISTP`, `ISFP`, `INFP`, `INTP`, `ESTP`, `ESFP`, `ENFP`, `ENTP`, `ESTJ`, `ESFJ`, `ENFJ`, `ENTJ`)
- 각 버튼 레이블에 MBTI 4글자 코드가 표시된다
- 버튼 개수는 정확히 16개이다

**And**:
- 한 번에 하나만 선택할 수 있는 UI 상태이다

---

### AC-3: MBTI 선택 시 저장 및 결과 화면 이동

**Given**:
- 사용자가 인증된 상태이며 `User.mbti`가 `null`
- 사용자가 `/mbti` 선택 화면에 있음

**When**:
- 사용자가 `INTJ` 버튼을 클릭

**Then**:
- 저장 경로(Server Action 또는 `POST /api/mbti`)가 호출된다
- 인증된 사용자 본인 레코드의 `User.mbti`가 `"INTJ"`로 업데이트된다
- 응답이 성공(200/204 또는 Server Action 정상 반환)이다

**And**:
- 사용자는 결과 화면(`/mbti` 결과 분기 또는 `/mbti/result`)으로 이동한다

---

### AC-4: 결과 화면에 정적 특징 요약 표시

**Given**:
- 사용자의 `User.mbti`가 `"INTJ"`
- `lib/data/mbti.ts`의 `INTJ` 항목이 `nickname`, `summary`, `traits`를 포함

**When**:
- 사용자가 결과 화면에 진입

**Then**:
- `INTJ`에 해당하는 별칭(`nickname`)이 표시된다
- `INTJ`의 요약(`summary`) 문단이 표시된다
- `INTJ`의 핵심 특징(`traits`) 항목들이 표시된다

**And**:
- 외부 API(구글/LLM) 호출이 발생하지 않는다(네트워크 호출 0회, 정적 데이터만 사용)

---

### AC-5: 이미 선택한 사용자 로그인 시 결과 화면 직행

**Given**:
- 데이터베이스에 사용자 `done@example.com`가 존재하며 `User.mbti`가 `"ENFP"`(유효 값)
- 해당 사용자의 자격증명이 유효함

**When**:
- 사용자가 로그인

**Then**:
- 로그인이 성공한다
- 사용자는 선택 화면을 거치지 않고 결과 화면으로 이동한다
- 결과 화면에 `ENFP`의 특징 요약이 표시된다

**And**:
- 16개 버튼 선택 화면(`MbtiSelector`)은 렌더링되지 않는다

---

### AC-6: 선택 완료 사용자의 /mbti 직접 진입

**Given**:
- 사용자가 인증된 상태이며 `User.mbti`가 `"ISTP"`(유효 값)

**When**:
- 사용자가 주소창에 `/mbti`를 직접 입력하여 진입

**Then**:
- 결과 화면이 렌더링된다(`ISTP` 특징 표시)
- 선택 화면으로 되돌아가지 않는다

**And**:
- 다시 선택을 강제당하지 않는다(MVP는 변경 플로우 미제공 — Exclusions 참조)

---

### AC-7: 유효하지 않은 mbti 값에 대한 안전한 폴백

**Given**:
- 다음 중 하나의 비정상 상태:
  - `User.mbti`에 16개 코드가 아닌 값(예: `"XXXX"`, `"intj"`, 레거시 문자열)이 저장됨
  - 결과 경로 URL에 알 수 없는 mbti 식별자가 포함됨
  - 하드코딩된 테스트 계정(`lib/auth.ts`의 `test-user`)처럼 DB에 실제 레코드가 없어 mbti 조회가 실패함

**When**:
- 사용자가 `/mbti`(또는 결과 경로)에 진입

**Then**:
- 애플리케이션이 충돌하거나 예외를 던지지 않는다
- `getMbtiInfo()`가 `null`을 반환하여 결과 화면이 렌더링되지 않는다
- 사용자는 선택 화면으로 폴백된다(미선택과 동일하게 취급)

**And**:
- 저장 경로(`POST /api/mbti` 또는 Server Action)에 16개 enum 밖의 값을 전송하면 HTTP 400(또는 동등 오류)으로 거부된다
- 잘못된 값으로 `User.mbti`가 갱신되지 않는다

---

### AC-8: 비인증 사용자의 /mbti 접근 차단

**Given**:
- 로그인하지 않은(세션 없음) 방문자

**When**:
- 방문자가 `/mbti`에 접근

**Then**:
- 로그인 페이지(`/login`)로 리다이렉트된다
- 선택 화면도 결과 화면도 렌더링되지 않는다

**And**:
- 어떤 사용자 레코드도 조회/갱신되지 않는다

---

## 엣지 케이스 (Edge Cases)

| 케이스 | 기대 동작 |
|--------|----------|
| 16개 버튼 중 중복 클릭(빠른 더블 클릭) | 마지막 1회만 유효; 동일 값 저장은 멱등 처리(같은 결과) |
| 저장 도중 네트워크 실패 | `User.mbti`가 갱신되지 않고 사용자에게 오류 안내; 선택 화면 유지 |
| 소문자/혼합 케이스 코드(`"Intj"`)가 URL로 들어옴 | enum 불일치 → REQ-MBTI-006 폴백(선택 화면). 자동 대문자 변환은 하지 않음(MVP 단순성) |
| 정적 데이터에 일부 유형 누락(데이터 무결성 결함) | 단위 테스트(AC 데이터 검증)에서 16개 완비를 강제하여 사전 차단 |
| 이미 선택한 사용자가 저장 API를 다시 호출 | MVP는 변경 미제공이나, 동일/다른 값 재전송 시 정책은 plan.md에서 거부 또는 멱등 중 택일 |
| 테스트 계정(`test-user`, DB 레코드 없음)이 `/mbti` 진입 | mbti 조회 실패 → 선택 화면 폴백, 예외 없음(AC-7과 동일 처리) |

---

## 품질 게이트 기준

### 성능

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| `/mbti` 진입(서버 컴포넌트 DB 1쿼리) 응답 (P95) | < 300ms | mbti 조회 포함, Vitest/측정 |
| 특징 요약 렌더 | 정적 데이터 즉시(네트워크 0회) | 외부 호출 미발생 검증 |
| 선택값 저장 응답 (P95) | < 300ms | 단일 update 쿼리 |

### 정확성 / 데이터 무결성

| 항목 | 기준 |
|------|------|
| 정적 데이터 완전성 | `MBTI_DATA`가 16개 코드를 모두 포함(누락/중복 없음) |
| 필수 필드 | 각 유형이 `code`, `nickname`, `summary`, `traits`(비어있지 않음)를 가짐 |
| enum 단일 소스 | 저장 검증과 폴백 판정이 동일 Zod enum을 사용 |
| 외부 호출 금지 | 구글/LLM API 호출 0회(정적 데이터만) |

### 품질

| 항목 | 기준 |
|------|------|
| 테스트 커버리지 | MBTI 도메인 전체 80% 이상(커밋당 최소 80%), 핵심 로직(`lib/data/mbti.ts`, `lib/validations/mbti.ts`) 100% 권장 |
| TypeScript | strict mode, 0 type errors |
| ESLint | 0 errors, 0 warnings |
| Prettier | 모든 파일 포맷 통과 |

---

## Definition of Done (완료 정의)

다음 항목이 모두 충족되어야 SPEC-MBTI-001을 완료로 간주합니다:

- [ ] AC-1 ~ AC-8 모든 인수 시나리오가 자동화 테스트로 검증됨
- [ ] Vitest 단위/통합 테스트 통과 (`pnpm test`)
- [ ] Playwright E2E 테스트 통과 — 최소 "미선택 로그인 → 선택 → 결과" 핵심 플로우
- [ ] 테스트 커버리지 80% 이상 (`pnpm test --coverage`)
- [ ] TRUST 5 품질 게이트 모두 통과
  - Tested: 80%+ 커버리지, 정적 데이터 16개 완전성 테스트 포함
  - Readable: ESLint 0 warnings, 명확한 네이밍
  - Unified: Prettier 포맷 통과
  - Secured: 본인 레코드만 갱신(세션 `user.id` 기준), enum 검증으로 임의값 차단
  - Trackable: 모든 커밋에 `SPEC-MBTI-001` 참조
- [ ] `prisma/schema.prisma`의 `User`에 `mbti String?` 추가 및 마이그레이션 적용
- [ ] `lib/data/mbti.ts` 16개 유형 정적 데이터 완비
- [ ] `lib/validations/mbti.ts` Zod enum 정의 및 저장/폴백에서 단일 사용
- [ ] Exclusions에 명시된 항목(실제 검색 API, LLM, 진단 퀴즈, 변경 플로우, 이미지)이 구현되지 않았음을 확인(스코프 준수)
- [ ] 기존 커뮤니티 홈(`app/page.tsx`) 미변경 확인
- [ ] 외부 API 호출이 발생하지 않음을 확인(네트워크 호출 0회)

---

**다음 단계**: 본 acceptance.md를 기반으로 `/moai run SPEC-MBTI-001` 실행 시 TDD RED 단계의 테스트 코드가 작성됩니다.
