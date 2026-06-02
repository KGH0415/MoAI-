// 홈 페이지 — 서버 컴포넌트, auth()로 세션 직접 조회
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";

export default async function HomePage() {
  // 서버에서 세션 조회 — 클라이언트 왕복 없음
  const session = await auth();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">인증 앱</h1>

      {session?.user ? (
        // 로그인 상태: 사용자 정보 및 로그아웃 폼 표시
        <div className="flex flex-col items-center gap-4">
          <p className="text-gray-700">
            안녕하세요,{" "}
            <span className="font-semibold">{session.user.email}</span>
          </p>
          {/* Server Action을 통한 로그아웃 — signOut은 서버 함수 */}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              로그아웃
            </button>
          </form>
        </div>
      ) : (
        // 비로그인 상태: 로그인/회원가입 링크
        <nav className="flex gap-4" aria-label="인증 메뉴">
          <Link
            href="/login"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            로그인
          </Link>
          <Link
            href="/register"
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            회원가입
          </Link>
        </nav>
      )}
    </main>
  );
}
