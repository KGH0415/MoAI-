// MbtiSelector 컴포넌트 렌더/선택 테스트 (Vitest + Testing Library)
// REQ-MBTI-001 / REQ-MBTI-003 / AC-2 / AC-3 — 16개 버튼 렌더, 클릭 시 저장 핸들러 호출
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MBTI_CODES } from "@/lib/data/mbti";

// saveMbti Server Action 모킹
const saveMbtiMock = vi.fn();
vi.mock("@/app/mbti/actions", () => ({
  saveMbti: (code: string) => saveMbtiMock(code),
}));

// next/navigation 라우터 모킹
const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

import { MbtiSelector } from "@/components/features/mbti/MbtiSelector";

describe("MbtiSelector", () => {
  beforeEach(() => {
    saveMbtiMock.mockReset();
    saveMbtiMock.mockResolvedValue({ ok: true });
    pushMock.mockClear();
    refreshMock.mockClear();
  });

  it("16개의 MBTI 버튼을 모두 렌더링한다", () => {
    render(<MbtiSelector />);
    for (const code of MBTI_CODES) {
      expect(screen.getByRole("button", { name: new RegExp(code) })).toBeInTheDocument();
    }
  });

  it("버튼 개수는 정확히 16개이다", () => {
    render(<MbtiSelector />);
    expect(screen.getAllByRole("button")).toHaveLength(16);
  });

  it("버튼 클릭 시 해당 코드로 saveMbti를 호출한다", async () => {
    render(<MbtiSelector />);

    fireEvent.click(screen.getByRole("button", { name: /INTJ/ }));

    await vi.waitFor(() => {
      expect(saveMbtiMock).toHaveBeenCalledWith("INTJ");
    });
  });

  it("저장 성공 시 /mbti로 이동하고 새로고침한다", async () => {
    render(<MbtiSelector />);

    fireEvent.click(screen.getByRole("button", { name: /ENFP/ }));

    // 비동기 저장 완료 대기
    await vi.waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/mbti");
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("저장 실패 시 이동하지 않고 선택 화면을 유지한다(엣지 케이스)", async () => {
    saveMbtiMock.mockResolvedValue({ ok: false, error: "invalid_code" });
    render(<MbtiSelector />);

    fireEvent.click(screen.getByRole("button", { name: /INTJ/ }));

    // 실패 후 버튼이 다시 활성화되어 재시도 가능해야 한다(상태 갱신 대기)
    await vi.waitFor(() => {
      expect(screen.getByRole("button", { name: /INTJ/ })).not.toBeDisabled();
    });
    expect(saveMbtiMock).toHaveBeenCalledWith("INTJ");
    expect(pushMock).not.toHaveBeenCalled();
  });
});
