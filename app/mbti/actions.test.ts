// app/mbti/actions.ts saveMbti Server Action 테스트 (Vitest)
// REQ-MBTI-003 / REQ-MBTI-006 — 쿠키 영속화(DB 미사용), enum 검증, 인증 검사
import { describe, it, expect, vi, beforeEach } from "vitest";

// next/headers cookies()를 모킹 — set 호출 여부를 추적
const cookieSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: cookieSet,
  })),
}));

// lib/auth의 auth()를 모킹 — 세션 존재/부재 시나리오 제어
const authMock = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => authMock(),
}));

import { saveMbti } from "@/app/mbti/actions";

describe("saveMbti Server Action", () => {
  beforeEach(() => {
    cookieSet.mockClear();
    authMock.mockReset();
    // 기본값: 인증된 세션
    authMock.mockResolvedValue({ user: { id: "test-user" } });
  });

  it("인증된 사용자 + 유효 코드 → 쿠키를 설정하고 성공을 반환한다", async () => {
    const result = await saveMbti("INTJ");

    expect(result.ok).toBe(true);
    expect(cookieSet).toHaveBeenCalledTimes(1);
    const [name, value, options] = cookieSet.mock.calls[0];
    expect(name).toBe("mbti");
    expect(value).toBe("INTJ");
    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
  });

  it("enum 밖 값 → 쿠키를 설정하지 않고 오류를 반환한다(REQ-MBTI-006)", async () => {
    const result = await saveMbti("XXXX");

    expect(result.ok).toBe(false);
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it("소문자 코드 → 거부하고 쿠키를 설정하지 않는다", async () => {
    const result = await saveMbti("intj");

    expect(result.ok).toBe(false);
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it("비인증 사용자 → 거부하고 쿠키를 설정하지 않는다", async () => {
    authMock.mockResolvedValue(null);

    const result = await saveMbti("INTJ");

    expect(result.ok).toBe(false);
    expect(cookieSet).not.toHaveBeenCalled();
  });
});
