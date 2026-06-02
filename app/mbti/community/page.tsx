// @MX:NOTE: [AUTO] MBTI 커뮤니티 게시판 페이지(서버 컴포넌트). 로그인 필수, mbti 쿠키 필수.
// 인증/쿠키 확인 후 CommunityBoard(클라이언트)에 유형 코드·닉네임을 전달한다.
// 게시판 데이터는 mock — DB(PostgreSQL) 미연결 환경 MVP.

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { getMbtiInfo } from "@/lib/data/mbti";
import { CommunityBoard } from "@/components/features/mbti/community/CommunityBoard";

export default async function MbtiCommunityPage() {
  // 비인증 사용자 — 로그인 페이지로 리다이렉트
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  // mbti 쿠키 확인 — 없거나 무효하면 선택 화면으로 이동
  const cookieStore = await cookies();
  const code = cookieStore.get("mbti")?.value;
  const info = getMbtiInfo(code ?? "");
  if (info === null) {
    redirect("/mbti");
  }

  return <CommunityBoard mbtiCode={info.code} nickname={info.nickname} />;
}
