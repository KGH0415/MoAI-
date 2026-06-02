// MbtiResult 컴포넌트 렌더 테스트 (Vitest + Testing Library)
// REQ-MBTI-002 / AC-4 — 선택한 유형의 별칭/요약/특징 표시
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MbtiResult } from "@/components/features/mbti/MbtiResult";
import { MBTI_DATA } from "@/lib/data/mbti";

describe("MbtiResult", () => {
  const info = MBTI_DATA.INTJ;

  it("코드와 별칭을 표시한다", () => {
    render(<MbtiResult info={info} />);
    expect(screen.getByText("INTJ")).toBeInTheDocument();
    expect(screen.getByText(info.nickname)).toBeInTheDocument();
  });

  it("요약 문단을 표시한다", () => {
    render(<MbtiResult info={info} />);
    expect(screen.getByText(info.summary)).toBeInTheDocument();
  });

  it("핵심 특징 항목을 모두 표시한다", () => {
    render(<MbtiResult info={info} />);
    for (const trait of info.traits) {
      expect(screen.getByText(trait)).toBeInTheDocument();
    }
  });
});
