// auth 유효성 검사 스키마 테스트 — TDD 방식으로 구현보다 먼저 작성
import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "./auth";

// =============================================
// registerSchema 테스트
// =============================================
describe("registerSchema", () => {
  // AC-2: 비밀번호 규칙 검증
  describe("비밀번호 규칙", () => {
    it("7자리 비밀번호는 실패해야 한다 (최소 8자 미만)", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "short1",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.errors.map((e) => e.message);
        expect(messages.some((m) => m.includes("8자"))).toBe(true);
      }
    });

    it("숫자 없는 비밀번호는 실패해야 한다 (password)", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "password",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.errors.map((e) => e.message);
        expect(messages.some((m) => m.includes("영문") || m.includes("숫자"))).toBe(true);
      }
    });

    it("영문 없는 비밀번호는 실패해야 한다 (12345678)", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "12345678",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.errors.map((e) => e.message);
        expect(messages.some((m) => m.includes("영문") || m.includes("숫자"))).toBe(true);
      }
    });

    it("유효한 비밀번호 SecurePass123은 통과해야 한다", () => {
      const result = registerSchema.safeParse({
        email: "user@example.com",
        password: "SecurePass123",
      });
      expect(result.success).toBe(true);
    });
  });

  // 이메일 소문자 변환 테스트
  describe("이메일 정규화", () => {
    it("대문자 이메일은 소문자로 변환되어야 한다", () => {
      const result = registerSchema.safeParse({
        email: "USER@EXAMPLE.COM",
        password: "SecurePass123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
      }
    });

    it("이메일 앞뒤 공백은 제거되어야 한다", () => {
      const result = registerSchema.safeParse({
        email: "  user@example.com  ",
        password: "SecurePass123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("user@example.com");
      }
    });

    it("유효하지 않은 이메일 형식은 실패해야 한다", () => {
      const result = registerSchema.safeParse({
        email: "not-an-email",
        password: "SecurePass123",
      });
      expect(result.success).toBe(false);
    });
  });
});

// =============================================
// loginSchema 테스트
// =============================================
describe("loginSchema", () => {
  it("유효한 자격증명은 통과해야 한다", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "anypassword",
    });
    expect(result.success).toBe(true);
  });

  it("이메일이 소문자로 변환되어야 한다", () => {
    const result = loginSchema.safeParse({
      email: "USER@EXAMPLE.COM",
      password: "anypassword",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("빈 비밀번호는 실패해야 한다", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("비밀번호가 없으면 실패해야 한다", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
    });
    expect(result.success).toBe(false);
  });
});
