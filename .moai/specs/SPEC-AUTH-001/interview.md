# Interview: 회원가입 및 로그인 기능

## Round 1: Scope
Question: 회원가입/로그인의 지원 범위는 어떻게 되나요?
Answer: 이메일 + Google OAuth (이메일+비밀번호 가입/로그인 + Google 소셜 로그인)

Question: 세션 유지 방식은 무엇을 원하세요?
Answer: Auth.js 기본 세션 (JWT 기반 httpOnly + Secure 쿠키)

## Round 2: Constraints
Question: 비밀번호 정책은 어느 수준으로 설정할까요?
Answer: 일반 수준 — 최소 8자, 영문+숫자 필수, bcrypt(cost=12) 해시

Question: 이메일 인증과 계정 차단(rate limit)은 MVP에 포함할까요?
Answer: 이메일 인증 + 로그인 rate limit 포함 (5회 실패 시 15분 차단)

## Clarity Score
Initial: 5/10
Final: 8/10
Rounds completed: 2

## Confirmed Scope (Locked)
- **Authentication methods**: 이메일/비밀번호 + Google OAuth
- **Session**: Auth.js v5 JWT 기반 쿠키 (httpOnly, Secure, SameSite=Lax)
- **Password policy**: 최소 8자, 영문+숫자, bcrypt cost=12
- **Email verification**: 가입 후 인증 메일 발송, 미인증 시 글 작성 차단
- **Rate limiting**: 동일 IP/이메일 로그인 5회 실패 시 15분 차단
- **Out of scope (MVP)**: 비밀번호 재설정 메일, 2FA, Passkey, 매직링크, GitHub OAuth
