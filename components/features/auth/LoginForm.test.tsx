// LoginForm 로그인 성공 후 리다이렉트 테스트 (Vitest + Testing Library)
// SPEC-MBTI-001 REQ-MBTI-004 — 미전달 시 /mbti로 이동(기존 "/" 에서 변경)
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// next-auth/react signIn 모킹 — 성공 시 error 없는 결과 반환
const signInMock = vi.fn();
vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

// next/navigation 라우터 모킹
const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

import { LoginForm } from "@/components/features/auth/LoginForm";

async function submitValidCredentials() {
  fireEvent.input(screen.getByLabelText("이메일"), {
    target: { value: "11@naver.com" },
  });
  fireEvent.input(screen.getByLabelText("비밀번호"), {
    target: { value: "1" },
  });
  fireEvent.click(screen.getByRole("button", { name: "로그인" }));
}

describe("LoginForm 로그인 성공 리다이렉트", () => {
  beforeEach(() => {
    signInMock.mockReset();
    signInMock.mockResolvedValue({ error: null });
    pushMock.mockClear();
    refreshMock.mockClear();
  });

  it("callbackUrl 미전달 시 /mbti로 이동한다(REQ-MBTI-004)", async () => {
    render(<LoginForm />);
    await submitValidCredentials();

    await vi.waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/mbti");
    });
  });

  it("callbackUrl 전달 시 해당 URL로 이동한다", async () => {
    render(<LoginForm callbackUrl="/dashboard" />);
    await submitValidCredentials();

    await vi.waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/dashboard");
    });
  });
});
