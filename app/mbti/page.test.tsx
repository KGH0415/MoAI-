// app/mbti/page.tsx 진입 분기 테스트 (Vitest)
// REQ-MBTI-005 / REQ-MBTI-006 / AC-6 / AC-7 / AC-8 — 인증·쿠키 값에 따른 선택/결과/리다이렉트 분기
import { describe, it, expect, vi, beforeEach } from "vitest";

// next/navigation redirect 모킹 — 실제 throw 대신 호출만 기록
const redirectMock = vi.fn();
vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

// next/headers cookies() 모킹 — get으로 쿠키 값 제어
const cookieGet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ get: cookieGet })),
}));

// lib/auth auth() 모킹
const authMock = vi.fn();
vi.mock("@/lib/auth", () => ({
  auth: () => authMock(),
}));

import MbtiPage from "@/app/mbti/page";
import { MbtiSelector } from "@/components/features/mbti/MbtiSelector";
import { MbtiResult } from "@/components/features/mbti/MbtiResult";

describe("MbtiPage 진입 분기", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    cookieGet.mockReset();
    authMock.mockReset();
    authMock.mockResolvedValue({ user: { id: "test-user" } });
    cookieGet.mockReturnValue(undefined);
  });

  it("비인증 사용자는 /login으로 리다이렉트한다(AC-8)", async () => {
    authMock.mockResolvedValue(null);

    await MbtiPage();

    expect(redirectMock).toHaveBeenCalledWith("/login");
  });

  it("쿠키 없음(미선택) → 선택 화면을 렌더링한다", async () => {
    cookieGet.mockReturnValue(undefined);

    const element = await MbtiPage();

    expect(element.type).toBe(MbtiSelector);
  });

  it("유효 코드 쿠키 → 결과 화면을 렌더링한다(AC-6)", async () => {
    cookieGet.mockReturnValue({ value: "INTJ" });

    const element = await MbtiPage();

    expect(element.type).toBe(MbtiResult);
    expect(element.props.info.code).toBe("INTJ");
  });

  it("무효 코드 쿠키 → 선택 화면으로 폴백한다(AC-7, 예외 없음)", async () => {
    cookieGet.mockReturnValue({ value: "XXXX" });

    const element = await MbtiPage();

    expect(element.type).toBe(MbtiSelector);
  });

  it("소문자 코드 쿠키 → 선택 화면으로 폴백한다(자동 변환 없음)", async () => {
    cookieGet.mockReturnValue({ value: "intj" });

    const element = await MbtiPage();

    expect(element.type).toBe(MbtiSelector);
  });
});
