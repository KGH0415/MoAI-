# Project Interview

## Round 1: Vision
Question: 이 애플리케이션이 무엇을 하고 누구를 위한 것인지 알려주세요.
Answer: 웹 기반 커뮤니티 서비스 — 게시판·댓글·좋아요 중심의 대화형 피드 형태. 브라우저에서 접근 가능한 커뮤니티.

## Round 2: Technology
Question: 주요 기술 스택을 선택해주세요.
Answer: TypeScript 풀스택 (Next.js 16 프론트엔드 + Node.js API + PostgreSQL)

## Round 3: Scope
Question: 커뮤니티 앱의 핵심 기능 범위는 어떻게 되나요?
Answer: 표준 커뮤니티 MVP — 회원 인증 + 게시글 CRUD + 댓글 + 좋아요 + 검색

## Derived Decisions
- Project Type: New Project (no existing source code)
- Primary Language: TypeScript
- Frontend Framework: Next.js 16 (App Router, React 19)
- Backend: Node.js (Next.js API Routes 또는 별도 Express/Fastify)
- Database: PostgreSQL (ORM: Prisma 권장)
- Authentication: NextAuth.js / Auth.js (OAuth + 이메일)
- Development Methodology: TDD (신규 프로젝트, Phase 3.7 자동 설정)
- Target Audience: 일반 사용자 (브라우저 접근, SEO 필요)

## Out of Scope (Explicit Non-Goals for MVP)
- 실시간 채팅 / WebSocket
- 팔로우/팔로잉 소셜 그래프
- 모바일 네이티브 앱
- 결제/구독
- 추천 알고리즘 (단순 최신순/인기순만)
