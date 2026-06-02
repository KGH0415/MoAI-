// 사용자 서비스 — 회원가입, 비밀번호 검증 비즈니스 로직
import crypto from "crypto";
import bcrypt from "bcrypt";
import db from "@/lib/db";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

// =============================================
// 커스텀 에러 클래스
// =============================================

// 이메일 중복 시 발생하는 타입화된 에러 — API 라우터에서 409로 매핑
export class EmailConflictError extends Error {
  constructor(email: string) {
    super(`이미 사용 중인 이메일입니다: ${email}`);
    this.name = "EmailConflictError";
  }
}

// @MX:TODO: 유효하지 않은 입력값 에러 타입 추가 (현재는 Zod 에러 그대로 throw)

// =============================================
// 반환 타입 정의 — passwordHash 절대 노출 금지
// =============================================

export type SafeUser = {
  id: string;
  email: string;
  emailVerified: Date | null;
  name: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// =============================================
// registerUser — 회원가입 핵심 로직
// @MX:ANCHOR: [AUTO] 회원가입 진입점 — 여러 API 라우트 및 서비스에서 호출
// @MX:REASON: 이 함수는 validation → 중복체크 → 해싱 → DB 저장 → 토큰 발급 전체를 담당하는 단일 진입점이므로 계약 변경 시 모든 호출부에 영향
// =============================================
export async function registerUser(input: RegisterInput): Promise<SafeUser> {
  // 1. Zod 스키마 검증 (이미 상위에서 검증했을 수 있지만 서비스 레이어에서도 재검증)
  const validated = registerSchema.parse(input);

  // 2. 이메일 중복 확인 — 소문자 변환은 스키마에서 이미 처리됨
  const existingUser = await db.user.findUnique({
    where: { email: validated.email },
  });

  if (existingUser) {
    throw new EmailConflictError(validated.email);
  }

  // 3. bcrypt 해싱 — cost factor 12 (보안과 성능의 균형)
  const passwordHash = await bcrypt.hash(validated.password, 12);

  // 4. 사용자 생성 — emailVerified는 null (이메일 인증 전)
  const user = await db.user.create({
    data: {
      email: validated.email,
      passwordHash,
      name: validated.name ?? null,
      emailVerified: null,
    },
  });

  // 5. 이메일 인증 토큰 생성 (24시간 유효)
  // @MX:TODO: Resend를 통한 인증 이메일 발송 구현 (REQ-AUTH-004)
  const tokenBytes = crypto.randomBytes(32);
  const token = tokenBytes.toString("base64url");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간

  await db.verificationToken.create({
    data: {
      identifier: user.email,
      token,
      expires,
    },
  });

  // 6. passwordHash를 제외한 안전한 사용자 객체 반환 (명시적 필드 선택)
  const safeUser: SafeUser = {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified,
    name: user.name,
    image: user.image,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };

  return safeUser;
}

// =============================================
// verifyPassword — bcrypt 비교 래퍼
// @MX:WARN: [AUTO] bcrypt.compare는 상수 시간 비교를 보장하지만, 직접 문자열 비교는 절대 사용 금지
// @MX:REASON: 타이밍 공격(timing attack) 방지를 위해 반드시 bcrypt.compare를 통해 비교해야 함. 문자열 ==, === 비교는 단락 평가(short-circuit)로 인해 취약
// =============================================
export async function verifyPassword(
  plainPassword: string,
  hash: string
): Promise<boolean> {
  // bcrypt.compare는 내부적으로 상수 시간 비교 수행
  return bcrypt.compare(plainPassword, hash);
}
