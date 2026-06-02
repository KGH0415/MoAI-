// @MX:NOTE: [AUTO] /mbti 진입점(Server Component). mbti 값을 JWT/DB가 아닌 쿠키에서 읽는다(MVP — PostgreSQL 미연결).
// @MX:REASON: DB가 연결되지 않아 db.user 조회가 불가능하고, lib/auth.ts 세션 화이트리스트에도 mbti가 없다. 쿠키를 단일 소스로 사용해 선택/결과를 분기한다(사용자 승인 deviation, REQ는 동일).

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { getMbtiInfo } from "@/lib/data/mbti";
import { MbtiSelector } from "@/components/features/mbti/MbtiSelector";
import { MbtiResult } from "@/components/features/mbti/MbtiResult";

// 선택값 쿠키 이름 — actions.ts와 동일
const MBTI_COOKIE = "mbti";

export default async function MbtiPage() {
  // 비인증 사용자는 로그인 페이지로 리다이렉트(REQ-MBTI-005 / AC-8)
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // @MX:WARN: [AUTO] mbti 조회·분기 — 쿠키 부재/무효 값에서도 예외를 던지지 않고 선택 화면으로 폴백해야 한다.
  // @MX:REASON: 테스트 계정(DB 레코드 없음)·레거시/위조 쿠키 등으로 무효 값이 들어와도 크래시 없이 미선택과 동일하게 처리(REQ-MBTI-006 / AC-7).
  const cookieStore = await cookies();
  const code = cookieStore.get(MBTI_COOKIE)?.value;
  const info = getMbtiInfo(code ?? "");

  // 미선택 또는 무효 값 → 선택 화면 폴백, 유효 값 → 결과 화면
  if (info === null) {
    return <MbtiSelector />;
  }
  return <MbtiResult info={info} />;
}
