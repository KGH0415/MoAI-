// @MX:NOTE: [AUTO] mbti 값 검증 스키마. 저장 경로(REQ-MBTI-003)와 폴백 판정(REQ-MBTI-006)이 동일 enum을 단일 소스로 사용한다.
// @MX:REASON: MBTI_CODES(정적 데이터)를 enum 소스로 재사용해 허용 코드 목록의 진실 공급원을 한 곳으로 유지한다.
import { z } from "zod";
import { MBTI_CODES, type MbtiCode } from "@/lib/data/mbti";

// MBTI_CODES를 그대로 enum 소스로 사용 — 16개 코드만 허용
export const mbtiSchema = z.enum([...MBTI_CODES] as [MbtiCode, ...MbtiCode[]]);

export type MbtiSchemaInput = z.infer<typeof mbtiSchema>;
