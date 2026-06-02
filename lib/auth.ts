// Auth.js v5 (NextAuth) 설정 — JWT 세션 전략, Credentials 제공자
// @MX:ANCHOR: [AUTO] 인증 시스템 진입점 — handlers/auth/signIn/signOut 모두 이곳에서 내보냄
// @MX:REASON: 모든 API 라우트, 미들웨어, 서버 컴포넌트가 이 파일의 exports에 의존하므로 계약 변경 시 전체 영향범위 검토 필요
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import db from "@/lib/db";
import { verifyPassword } from "@/lib/services/user";
import { loginSchema } from "@/lib/validations/auth";

// @MX:TODO: Google OAuth 제공자 추가 (REQ-AUTH-003)
// import Google from "next-auth/providers/google";

// @MX:TODO: PrismaAdapter 활성화 — Account/Session 모델 주석 해제 후 적용 (REQ-AUTH-003)
// import { PrismaAdapter } from "@auth/prisma-adapter";
// import db from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // @MX:TODO: OAuth/DB 세션 전략 도입 시 PrismaAdapter 활성화 (REQ-AUTH-003)
  // adapter: PrismaAdapter(db),

  session: {
    // JWT 전략 — DB 조회 없이 토큰만으로 세션 검증
    strategy: "jwt",
  },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },

      // @MX:WARN: [AUTO] authorize 함수 내 비밀번호 비교 — bcrypt.compare 사용 강제
      // @MX:REASON: 타이밍 공격 방지를 위해 verifyPassword(bcrypt.compare)를 통해서만 비교. 직접 문자열 비교 사용 금지
      async authorize(credentials) {
        // 입력값 검증 — 유효하지 않으면 null 반환 (에러 throw 금지)
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        // @MX:WARN: [AUTO] 하드코딩된 테스트 자격증명 — 운영 배포 전 반드시 제거
        // @MX:REASON: 개발/데모 목적의 임시 우회 로그인. DB 조회 없이 고정 계정으로 인증을 통과시키므로 운영 환경에 남으면 심각한 보안 취약점
        if (email === "11@naver.com" && password === "1") {
          return {
            id: "test-user",
            email: "11@naver.com",
            emailVerified: null,
          };
        }

        // 소문자 이메일로 사용자 조회
        const user = await db.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            emailVerified: true,
            passwordHash: true,
          },
        });

        // 사용자 없음 — 제네릭 메시지로 응답 (사용자 존재 여부 노출 방지)
        if (!user || !user.passwordHash) {
          return null;
        }

        // 비밀번호 검증 — 상수 시간 비교
        const isValid = await verifyPassword(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        // AC-5: 잘못된 자격증명 시 null 반환 — 클라이언트에서 "이메일 또는 비밀번호가 올바르지 않습니다" 표시
        // passwordHash는 토큰에 포함하지 않음 — 화이트리스트만 반환
        return {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified?.toISOString() ?? null,
        };
      },
    }),
  ],

  callbacks: {
    // @MX:NOTE: [AUTO] jwt 콜백 — userId와 emailVerified를 토큰에 주입
    // userId: 서버 컴포넌트에서 현재 사용자 식별에 사용
    // emailVerified: 이메일 미인증 사용자 접근 제한에 사용 (REQ-AUTH-004 준비)
    jwt({ token, user }) {
      if (user) {
        // 최초 로그인 시 user 객체에서 토큰으로 데이터 복사
        token.userId = user.id;
        token.emailVerified = (user as { emailVerified?: string | null }).emailVerified ?? null;
      }
      return token;
    },

    // @MX:NOTE: [AUTO] session 콜백 — 클라이언트에 노출할 필드 화이트리스트만 포함
    // 화이트리스트: userId, email, emailVerified — passwordHash 및 기타 민감 필드 절대 불포함
    session({ session, token }) {
      if (token) {
        session.user.id = token.userId as string;
        session.user.emailVerified = token.emailVerified
          ? new Date(token.emailVerified as string)
          : null;
      }
      return session;
    },

    // @MX:TODO: 미들웨어 보호 경로 + 쓰기 작업 차단 구현 시 authorized 콜백 추가 (REQ-AUTH-005)
  },

  pages: {
    signIn: "/login",
    // @MX:TODO: 에러 페이지 커스터마이징
    // error: "/auth/error",
  },
});

// Auth.js v5 세션 타입 확장 — TypeScript strict 모드 지원
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      emailVerified: Date | null;
      name?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    emailVerified?: string | null;
  }
}
