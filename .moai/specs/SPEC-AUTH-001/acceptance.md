# SPEC-AUTH-001: 인수 기준 (Acceptance Criteria)

본 문서는 SPEC-AUTH-001의 모든 요구사항이 충족되었음을 검증하기 위한 Given/When/Then 시나리오를 정의합니다. 각 시나리오는 자동화 가능한 형태로 작성되었으며, Vitest 통합 테스트 또는 Playwright E2E 테스트로 구현됩니다.

---

## 인수 시나리오

### AC-1: 이메일 회원가입 성공

**Given**:
- 사용자는 회원가입 페이지(`/register`)에 접속한 상태
- 데이터베이스에 `newuser@example.com` 이메일을 가진 사용자가 존재하지 않음
- Resend API가 정상 동작 중

**When**:
- 사용자가 이메일 `newuser@example.com`, 비밀번호 `SecurePass123`을 입력하고 "가입" 버튼을 클릭

**Then**:
- HTTP 201 또는 200 응답이 반환된다
- `User` 테이블에 새 레코드가 생성된다 (`email = newuser@example.com`)
- `passwordHash` 필드는 bcrypt 해시 형태이며 평문 비밀번호가 저장되지 않는다 (cost factor = 12)
- `emailVerified` 필드는 `NULL` 상태이다
- `VerificationToken` 테이블에 24시간 TTL의 토큰이 생성된다
- 인증 이메일이 `newuser@example.com`으로 발송된다 (Resend 호출 확인)

**And**:
- 사용자는 "이메일을 확인해주세요" 안내 페이지로 리다이렉트된다
- 가입 직후 자동 로그인되지 않는다(인증 후 로그인 전제)

---

### AC-2: 약한 비밀번호로 가입 실패

**Given**:
- 사용자는 회원가입 페이지에 접속한 상태
- Zod 스키마 `registerSchema`가 활성화되어 있음

**When**:
- 사용자가 다음 비밀번호 중 하나를 입력하고 가입 시도:
  - `short1` (7자, 8자 미만)
  - `password` (영문만, 숫자 없음)
  - `12345678` (숫자만, 영문 없음)

**Then**:
- HTTP 400 응답이 반환된다
- `User` 레코드가 생성되지 않는다
- 응답 본문에 검증 실패 메시지가 포함된다 ("비밀번호는 최소 8자, 영문과 숫자를 포함해야 합니다")

**And**:
- 폼 UI에 필드별 오류 메시지가 표시된다
- 인증 이메일이 발송되지 않는다

---

### AC-3: 중복 이메일 가입 실패

**Given**:
- 데이터베이스에 `existing@example.com` 사용자가 이미 존재함

**When**:
- 사용자가 동일한 이메일 `existing@example.com`과 유효한 비밀번호 `ValidPass123`으로 가입 시도

**Then**:
- HTTP 409 (Conflict) 응답이 반환된다
- 새로운 `User` 레코드가 생성되지 않는다
- 응답 메시지: "이미 사용 중인 이메일입니다"

**And**:
- 기존 사용자의 비밀번호 해시가 변경되지 않는다
- 인증 이메일이 발송되지 않는다
- 기존 사용자에게 알림이 가지 않는다(보안: 계정 존재 여부를 외부에 노출하지 않는 응답 메시지도 검토)

---

### AC-4: 이메일/비밀번호 로그인 성공

**Given**:
- 데이터베이스에 `verified@example.com` 사용자가 존재함
- 해당 사용자의 `emailVerified` 필드가 `NOT NULL` (인증 완료 상태)
- 비밀번호 해시는 `correctPassword123`을 bcrypt(cost=12)로 해싱한 값

**When**:
- 사용자가 로그인 페이지에서 `verified@example.com`, `correctPassword123` 입력 후 "로그인" 클릭

**Then**:
- HTTP 200 응답이 반환된다
- Set-Cookie 헤더로 JWT 세션 쿠키가 발급된다
- 쿠키 속성: `httpOnly`, `Secure`, `SameSite=Lax`
- JWT payload에 `userId`, `email`, `emailVerified` 필드가 포함된다

**And**:
- 사용자는 홈 피드(`/`) 또는 `callbackUrl`로 리다이렉트된다
- `LoginAttempt` 테이블에 `success=true` 레코드가 기록된다

---

### AC-5: 잘못된 비밀번호 로그인 실패

**Given**:
- 데이터베이스에 `verified@example.com` 사용자가 존재함
- 해당 IP/이메일의 최근 15분 실패 카운트가 0

**When**:
- 사용자가 `verified@example.com`과 잘못된 비밀번호 `wrongPassword`로 로그인 시도

**Then**:
- HTTP 401 응답이 반환된다
- 세션 쿠키가 발급되지 않는다
- 응답 메시지는 모호하게 표현된다 ("이메일 또는 비밀번호가 올바르지 않습니다") — 계정 존재 여부 노출 방지

**And**:
- `LoginAttempt` 테이블에 `success=false`, `email=verified@example.com`, `ipAddress=<요청 IP>` 레코드가 기록된다
- 15분 내 누적 실패 카운트가 1 증가한다

---

### AC-6: Google OAuth 로그인 성공

**Given**:
- 사용자가 Google 계정(`googleuser@gmail.com`)으로 인증 가능한 상태
- Auth.js Google Provider가 올바르게 설정됨 (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` 유효)
- 콜백 URL `/api/auth/callback/google`이 Google Cloud Console에 등록됨

**When**:
- 사용자가 로그인 페이지의 "Google로 로그인" 버튼 클릭
- Google OAuth 동의 화면에서 권한 승인
- Google이 콜백 URL로 인증 코드와 함께 리다이렉트

**Then**:
- Auth.js가 Google 액세스 토큰을 교환하고 사용자 프로필 조회
- `User` 테이블에 `googleuser@gmail.com` 레코드가 존재하지 않으면 신규 생성
- `Account` 테이블에 `provider=google`, `providerAccountId=<Google sub>` 레코드 생성
- 신규 생성된 사용자는 `emailVerified`가 자동으로 현재 시각으로 설정된다 (Google이 이미 검증)
- JWT 세션 쿠키가 발급된다

**And**:
- 사용자는 홈 피드로 리다이렉트된다
- 동일한 이메일로 다음에 OAuth 로그인 시 기존 `User` 레코드에 연결된다 (중복 사용자 생성 없음)

---

### AC-7: 미인증 이메일로 로그인 시 안내

**Given**:
- 데이터베이스에 `unverified@example.com` 사용자가 존재함
- 해당 사용자의 `emailVerified` 필드가 `NULL`
- 비밀번호는 올바르게 매칭됨

**When**:
- 사용자가 `unverified@example.com`, 올바른 비밀번호로 로그인 시도

**Then**:
- 로그인 자체는 성공할 수도, 차단될 수도 있음 (구현 선택):
  - 선택 A(권장): 로그인 성공 + 세션 발급, 단 글쓰기 액션 차단
  - 선택 B: 로그인 차단 + 인증 메일 재발송 안내 페이지로 리다이렉트
- 어느 경우든 사용자에게 "이메일 인증이 필요합니다" 안내가 표시된다

**And**:
- 사용자가 글쓰기/댓글/좋아요 API를 호출하면 HTTP 403 응답을 받는다 (`error: "EMAIL_NOT_VERIFIED"`)
- UI 글쓰기 버튼이 비활성화되거나 클릭 시 인증 안내 모달이 표시된다
- 읽기 액션(피드 조회, 게시글 상세)은 정상 동작한다

---

### AC-8: 5회 실패 후 15분 차단

**Given**:
- 데이터베이스에 `target@example.com` 사용자가 존재함
- 동일 IP `192.168.1.100`에서 최근 15분 내 실패 횟수가 0

**When**:
- 동일 IP에서 `target@example.com`에 대해 잘못된 비밀번호로 5회 연속 로그인 시도

**Then**:
- 1~4회차: HTTP 401 응답, 일반적인 인증 실패 메시지
- 5회차: HTTP 401 응답 + 카운터가 5에 도달

**And (6회차 이후)**:
- 동일 IP 또는 동일 이메일로 추가 로그인 시도 시 HTTP 429 (Too Many Requests) 응답
- 응답 메시지: "로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요"
- 올바른 비밀번호를 입력해도 차단 윈도우 내에서는 거부된다
- `LoginAttempt` 테이블에서 첫 실패 시각으로부터 15분 경과 후 자동으로 차단 해제된다 (별도 cleanup job 불필요, 쿼리 시점 윈도우 계산)

**Verification Steps**:
1. 시간을 15분 1초 이후로 진행 (또는 mocking)
2. 동일 IP/이메일로 올바른 비밀번호 입력 시 정상 로그인 성공 확인

---

## 엣지 케이스 (Edge Cases)

| 케이스 | 기대 동작 |
|--------|----------|
| 이메일 대소문자 차이 (`User@example.com` vs `user@example.com`) | DB 저장 시 소문자로 정규화, 중복 검사도 소문자 기준 |
| 인증 토큰 만료 후 클릭 | "토큰이 만료되었습니다" 안내 + 재발송 버튼 표시 |
| 동일 토큰 재사용 시도 | HTTP 400, "유효하지 않은 토큰" 응답 (토큰은 단일 사용) |
| OAuth 콜백 중 오류 (사용자 거부) | 로그인 페이지로 리다이렉트 + 에러 토스트 |
| 가입 직후 인증 메일 미수신 시 재발송 요청 | 마지막 발송 후 60초 쿨다운 적용 |
| 세션 만료된 사용자가 API 호출 | HTTP 401 + 클라이언트가 로그인 페이지로 리다이렉트 |
| 비밀번호 필드에 공백 포함 (`  Pass1234  `) | trim 처리 후 검증; 가입/로그인 시 일관된 처리 |

---

## 성능 / 보안 게이트 기준

### 성능

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| 로그인 응답 시간 (P95) | < 500ms | bcrypt 비교 포함, Vitest benchmark |
| 가입 응답 시간 (P95) | < 800ms | 이메일 발송은 비동기 처리 후 측정 |
| Rate Limit 카운터 조회 | < 50ms | 인덱스 적중 확인 |

### 보안

| 항목 | 기준 |
|------|------|
| 비밀번호 해시 | bcrypt cost factor 12 이상 |
| JWT 시크릿 | 최소 32바이트 (256비트) 랜덤 |
| 세션 쿠키 속성 | `httpOnly`, `Secure`, `SameSite=Lax` 모두 설정 |
| CSRF 보호 | Auth.js 기본 CSRF 토큰 활성화 |
| 비밀번호 응답 노출 | API 응답에 `passwordHash` 절대 포함 금지 (Prisma `select` 명시) |
| 인증 토큰 생성 | `crypto.randomBytes(32)` 기반 base64url 인코딩 |
| OWASP Top 10 검토 | A01(인증), A02(암호화), A07(식별/인증 실패) 항목 통과 |

### 품질

| 항목 | 기준 |
|------|------|
| 테스트 커버리지 | 인증 도메인 전체 85% 이상, 핵심 로직(`auth.ts`, `rate-limit.ts`) 100% |
| TypeScript | strict mode, 0 type errors |
| ESLint | 0 errors, 0 warnings |
| Prettier | 모든 파일 포맷 통과 |

---

## Definition of Done (완료 정의)

다음 항목이 모두 충족되어야 SPEC-AUTH-001을 완료로 간주합니다:

- [ ] AC-1 ~ AC-8 모든 인수 시나리오가 자동화 테스트로 검증됨
- [ ] Vitest 단위/통합 테스트 통과 (`pnpm test`)
- [ ] Playwright E2E 테스트 통과 (`pnpm test:e2e`) — 최소 회원가입→로그인 핵심 플로우
- [ ] 테스트 커버리지 85% 이상 (`pnpm test --coverage` 확인)
- [ ] TRUST 5 품질 게이트 모두 통과
  - Tested: 85%+ 커버리지
  - Readable: ESLint 0 warnings, 명확한 네이밍
  - Unified: Prettier 포맷 통과
  - Secured: bcrypt cost=12, JWT secret 32+ bytes, OWASP 검토
  - Trackable: 모든 커밋에 `SPEC-AUTH-001` 참조
- [ ] `prisma/schema.prisma`에 `User`, `Account`, `Session`, `VerificationToken`, `LoginAttempt` 모델 추가 및 마이그레이션 적용
- [ ] `.env.example`에 신규 환경변수 모두 문서화
- [ ] `lib/auth.ts`의 핵심 함수에 MX 태그 적용 (@MX:ANCHOR, @MX:WARN, @MX:NOTE)
- [ ] Exclusions에 명시된 항목이 구현되지 않았음을 확인 (스코프 준수)
- [ ] 보안 검토: 비밀번호 평문 노출 없음, 시크릿 환경변수화 완료
- [ ] 사용자 문서: 로그인/가입 페이지 사용자 가이드 작성 (sync 단계)

---

**다음 단계**: 본 acceptance.md를 기반으로 `/moai run SPEC-AUTH-001` 실행 시 TDD RED 단계의 테스트 코드가 자동 생성됩니다.
