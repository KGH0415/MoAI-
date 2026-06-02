"use server";

// @MX:NOTE: [AUTO] MBTI 선택값을 DB가 아닌 쿠키에 영속화한다(MVP). PostgreSQL 미연결 상태이므로 User.mbti DB 저장 대신 쿠키를 사용(사용자 승인 deviation).
// @MX:REASON: .env가 플레이스홀더이고 DB가 연결되지 않아 db.user.update가 불가능. 하드코딩 테스트 계정(test-user, DB 레코드 없음)도 쿠키로 end-to-end 동작해야 한다.

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { mbtiSchema } from "@/lib/validations/mbti";

// 선택값 저장 쿠키 이름
const MBTI_COOKIE = "mbti";

export interface SaveMbtiResult {
  ok: boolean;
  error?: string;
}

// @MX:ANCHOR: [AUTO] MBTI 영속화 단일 진입점(쿠키 변형). 선택 화면이 호출하는 유일한 저장 경로.
// @MX:REASON: 저장 전 인증·enum 검증을 강제하는 보안 계약. 클라이언트가 보낸 임의 값을 신뢰하지 않고 mbtiSchema 통과 시에만 쿠키를 설정한다(REQ-MBTI-003/006).
export async function saveMbti(code: string): Promise<SaveMbtiResult> {
  // 인증 검사 — 세션이 없으면 거부(타인/익명 저장 차단)
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "unauthorized" };
  }

  // enum 검증 — 16개 코드가 아니면 쿠키를 설정하지 않고 거부
  const parsed = mbtiSchema.safeParse(code);
  if (!parsed.success) {
    return { ok: false, error: "invalid_code" };
  }

  // @MX:WARN: [AUTO] 쿠키 설정 경로 — 반드시 검증(mbtiSchema) 통과 후에만 실행한다.
  // @MX:REASON: 검증 없이 쿠키를 설정하면 무효/위조 값이 /mbti 결과 분기로 유입될 수 있다. httpOnly로 클라이언트 스크립트 접근을 차단.
  const cookieStore = await cookies();
  cookieStore.set(MBTI_COOKIE, parsed.data, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return { ok: true };
}

// @MX:NOTE: [AUTO] mbti 쿠키 삭제 — 로그인 직후 호출되어 매 로그인마다 선택 화면을 강제한다.
// 이전 선택값(쿠키)을 비우면 /mbti 서버 컴포넌트가 결과 화면 대신 MbtiSelector로 분기한다.
export async function clearMbti(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(MBTI_COOKIE);
}

// @MX:NOTE: [AUTO] 결과 화면의 "뒤로가기" 버튼용 — 선택값(쿠키)을 비우고 /mbti로 리다이렉트해 선택 화면을 다시 띄운다.
// clearMbti와 달리 redirect를 포함하므로 서버 컴포넌트의 <form action={resetMbti}>에서 직접 사용한다.
export async function resetMbti(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(MBTI_COOKIE);
  // 쿠키가 비워진 상태로 /mbti 재진입 → MbtiSelector로 분기
  redirect("/mbti");
}
