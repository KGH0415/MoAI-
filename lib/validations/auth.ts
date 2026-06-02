// auth 유효성 검사 스키마 — Zod 기반 입력 검증
// AC-2: 비밀번호는 최소 8자, 영문+숫자 포함 강제
import { z } from "zod";

// 비밀번호 유효성 검사 규칙
const passwordSchema = z
  .string()
  .min(8, "비밀번호는 최소 8자, 영문과 숫자를 포함해야 합니다")
  .refine(
    (pw) => /[a-zA-Z]/.test(pw),
    "비밀번호는 최소 8자, 영문과 숫자를 포함해야 합니다"
  )
  .refine(
    (pw) => /[0-9]/.test(pw),
    "비밀번호는 최소 8자, 영문과 숫자를 포함해야 합니다"
  );

// 이메일 정규화 변환 — 입력값을 trim + toLowerCase 후 RFC-5322 검증
const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("유효한 이메일 주소를 입력해주세요");

// 회원가입 입력 스키마
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  // name은 선택 필드 — 미입력 시 null
  name: z.string().trim().optional(),
});

// 로그인 입력 스키마 — 비밀번호 형식 검증 없음 (서버에서 bcrypt 비교)
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

// 타입 추론 내보내기 — 프론트엔드 폼과 API 라우터에서 공유 사용
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
