// user 서비스 테스트 — TDD 방식으로 구현보다 먼저 작성
// Prisma 클라이언트를 모킹하여 DB 의존성 없이 단위 테스트 수행
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmailConflictError, registerUser, verifyPassword } from "./user";

// lib/db 모듈 전체를 모킹 — 실제 DB 연결 없이 테스트 가능
vi.mock("@/lib/db", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    verificationToken: {
      create: vi.fn(),
    },
  },
}));

// bcrypt 모킹 — 해시 연산은 느리므로 테스트에서 단순 대체
vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2b$12$hashedpassword"),
    compare: vi.fn(),
  },
}));

// 모킹된 db와 bcrypt 인스턴스 참조
import db from "@/lib/db";
import bcrypt from "bcrypt";

// =============================================
// registerUser 테스트
// =============================================
describe("registerUser", () => {
  // 각 테스트 전 모킹 초기화
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // AC-3: 이메일 중복 시 409 에러
  it("이미 사용 중인 이메일로 가입 시 EmailConflictError를 던져야 한다", async () => {
    // 기존 유저가 존재하는 상황 모킹
    vi.mocked(db.user.findUnique).mockResolvedValue({
      id: "existing-id",
      email: "user@example.com",
      emailVerified: null,
      passwordHash: "hash",
      name: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      registerUser({ email: "user@example.com", password: "SecurePass123" })
    ).rejects.toThrow(EmailConflictError);
  });

  // AC-1: 성공적인 회원가입
  it("유효한 입력으로 가입 시 passwordHash 없는 사용자 객체를 반환해야 한다", async () => {
    // 중복 없음 — findUnique는 null 반환
    vi.mocked(db.user.findUnique).mockResolvedValue(null);

    // DB에 생성된 사용자 모킹 (passwordHash 포함된 DB 레코드)
    vi.mocked(db.user.create).mockResolvedValue({
      id: "new-user-id",
      email: "newuser@example.com",
      emailVerified: null,
      passwordHash: "$2b$12$hashedpassword",
      name: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // VerificationToken 생성 모킹
    vi.mocked(db.verificationToken.create).mockResolvedValue({
      identifier: "newuser@example.com",
      token: "random-token",
      expires: new Date(),
    });

    const result = await registerUser({
      email: "newuser@example.com",
      password: "SecurePass123",
    });

    // 반환값에 passwordHash가 없어야 한다 (보안 요구사항)
    expect(result).not.toHaveProperty("passwordHash");
    expect(result.email).toBe("newuser@example.com");
    expect(result.id).toBe("new-user-id");
  });

  it("bcrypt hash가 cost=12로 호출되어야 한다", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    vi.mocked(db.user.create).mockResolvedValue({
      id: "id",
      email: "user@example.com",
      emailVerified: null,
      passwordHash: "$2b$12$hashedpassword",
      name: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.verificationToken.create).mockResolvedValue({
      identifier: "user@example.com",
      token: "token",
      expires: new Date(),
    });

    await registerUser({ email: "user@example.com", password: "SecurePass123" });

    // bcrypt hash가 cost=12로 호출되었는지 확인
    expect(bcrypt.hash).toHaveBeenCalledWith("SecurePass123", 12);
  });

  it("회원가입 후 verificationToken이 생성되어야 한다", async () => {
    vi.mocked(db.user.findUnique).mockResolvedValue(null);
    vi.mocked(db.user.create).mockResolvedValue({
      id: "id",
      email: "user@example.com",
      emailVerified: null,
      passwordHash: "$2b$12$hashedpassword",
      name: null,
      image: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(db.verificationToken.create).mockResolvedValue({
      identifier: "user@example.com",
      token: "token",
      expires: new Date(),
    });

    await registerUser({ email: "user@example.com", password: "SecurePass123" });

    // VerificationToken 생성 호출 확인
    expect(db.verificationToken.create).toHaveBeenCalledOnce();
  });
});

// =============================================
// verifyPassword 테스트
// =============================================
describe("verifyPassword", () => {
  it("일치하는 비밀번호는 true를 반환해야 한다", async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
    const result = await verifyPassword("password", "$2b$12$hash");
    expect(result).toBe(true);
  });

  it("일치하지 않는 비밀번호는 false를 반환해야 한다", async () => {
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);
    const result = await verifyPassword("wrongpassword", "$2b$12$hash");
    expect(result).toBe(false);
  });
});
