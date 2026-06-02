// lib/data/mbti.ts 정적 데이터 모듈 단위 테스트 (Vitest)
// REQ-MBTI-001 / REQ-MBTI-002 / REQ-MBTI-006 검증
import { describe, it, expect } from "vitest";
import {
  MBTI_CODES,
  MBTI_DATA,
  getMbtiInfo,
  type MbtiCode,
} from "@/lib/data/mbti";

// SPEC-MBTI-001 acceptance.md에 명시된 16개 코드 (표시 순서와 무관한 완전성 검증용)
const EXPECTED_CODES: MbtiCode[] = [
  "ISTJ",
  "ISFJ",
  "INFJ",
  "INTJ",
  "ISTP",
  "ISFP",
  "INFP",
  "INTP",
  "ESTP",
  "ESFP",
  "ENFP",
  "ENTP",
  "ESTJ",
  "ESFJ",
  "ENFJ",
  "ENTJ",
];

describe("MBTI 정적 데이터 완전성", () => {
  it("MBTI_CODES는 정확히 16개를 가진다", () => {
    expect(MBTI_CODES).toHaveLength(16);
  });

  it("MBTI_CODES에 중복이 없다", () => {
    expect(new Set(MBTI_CODES).size).toBe(16);
  });

  it("16개 코드를 모두 포함한다(누락 없음)", () => {
    for (const code of EXPECTED_CODES) {
      expect(MBTI_CODES).toContain(code);
    }
  });

  it("MBTI_DATA는 16개 키를 모두 가진다", () => {
    expect(Object.keys(MBTI_DATA)).toHaveLength(16);
  });

  it("각 항목은 비어있지 않은 필수 필드(code/nickname/summary/traits)를 가진다", () => {
    for (const code of MBTI_CODES) {
      const info = MBTI_DATA[code];
      expect(info.code).toBe(code);
      expect(info.nickname.length).toBeGreaterThan(0);
      expect(info.summary.length).toBeGreaterThan(0);
      expect(info.traits.length).toBeGreaterThan(0);
      // traits 항목 각각도 비어있지 않아야 한다
      for (const trait of info.traits) {
        expect(trait.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("getMbtiInfo", () => {
  it("유효한 코드는 해당 정보를 반환한다", () => {
    const info = getMbtiInfo("INTJ");
    expect(info).not.toBeNull();
    expect(info?.code).toBe("INTJ");
  });

  it("알 수 없는 코드는 null을 반환한다(REQ-MBTI-006)", () => {
    expect(getMbtiInfo("XXXX")).toBeNull();
  });

  it("소문자/잘못된 케이스는 null을 반환한다(자동 대문자 변환 없음)", () => {
    expect(getMbtiInfo("intj")).toBeNull();
    expect(getMbtiInfo("Intj")).toBeNull();
  });

  it("빈 문자열은 null을 반환한다", () => {
    expect(getMbtiInfo("")).toBeNull();
  });
});
