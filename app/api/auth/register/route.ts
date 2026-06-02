// 회원가입 API 라우트 — POST /api/auth/register
// @MX:ANCHOR: [AUTO] 회원가입 API 진입점 — 프론트엔드 폼, 테스트, 외부 클라이언트가 호출
// @MX:REASON: 유효성 검사 → 사용자 생성 → 응답 형식 결정 등 여러 레이어가 이 라우트에 의존하므로 계약 변경 시 전체 호출부 영향 검토 필요
import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { registerSchema } from "@/lib/validations/auth";
import { registerUser, EmailConflictError } from "@/lib/services/user";

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body: unknown = await request.json();

    // Zod 스키마 검증 — 이메일 소문자 변환 포함
    const input = registerSchema.parse(body);

    // 비즈니스 로직 — 중복 체크, 해싱, DB 저장, 인증 토큰 생성
    const user = await registerUser(input);

    // 201 Created — passwordHash 없는 안전한 사용자 객체 반환
    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          emailVerified: user.emailVerified,
          name: user.name,
          createdAt: user.createdAt,
        },
        message: "회원가입이 완료되었습니다. 이메일 인증을 진행해주세요.",
      },
      { status: 201 }
    );
  } catch (error) {
    // Zod 유효성 검사 실패 — 400 Bad Request + 필드별 에러 메시지
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "입력값이 유효하지 않습니다",
          fields: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // 이메일 중복 — 409 Conflict
    if (error instanceof EmailConflictError) {
      return NextResponse.json(
        { error: "이미 사용 중인 이메일입니다" },
        { status: 409 }
      );
    }

    // 예상치 못한 에러 — 내부 정보 노출 없이 500 반환
    // 프로덕션에서는 로깅 서비스(Sentry 등)에 에러를 전송해야 함
    console.error("[POST /api/auth/register] Unexpected error:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
