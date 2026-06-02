// lib/validations/mbti.ts Zod enum 검증 단위 테스트 (Vitest)
// REQ-MBTI-003 / REQ-MBTI-006 — 저장 검증과 폴백 판정이 동일 enum을 단일 소스로 사용
import { describe, it, expect } from "vitest";
import { mbtiSchema } from "@/lib/validations/mbti";
import { MBTI_CODES } from "@/lib/data/mbti";

describe("mbtiSchema", () => {
  it("16개 유효 코드는 모두 통과한다", () => {
    for (const code of MBTI_CODES) {
      expect(mbtiSchema.safeParse(code).success).toBe(true);
    }
  });

  it("16개 코드가 아닌 값은 거부한다", () => {
    expect(mbtiSchema.safeParse("XXXX").success).toBe(false);
  });

  it("소문자 코드는 거부한다(자동 대문자 변환 없음)", () => {
    expect(mbtiSchema.safeParse("intj").success).toBe(false);
  });

  it("빈 문자열은 거부한다", () => {
    expect(mbtiSchema.safeParse("").success).toBe(false);
  });

  it("문자열이 아닌 값은 거부한다", () => {
    expect(mbtiSchema.safeParse(123).success).toBe(false);
    expect(mbtiSchema.safeParse(null).success).toBe(false);
    expect(mbtiSchema.safeParse(undefined).success).toBe(false);
  });
});
