// 로그인 페이지 — (auth) 라우트 그룹, searchParams에서 callbackUrl 추출 후 LoginForm에 전달
import Link from "next/link";
import { LoginForm } from "@/components/features/auth/LoginForm";

export const metadata = {
  title: "로그인",
};

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  // Next.js 16에서 searchParams는 Promise — await 필요
  const { callbackUrl } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* 카드 컨테이너 */}
        <div className="rounded-lg bg-white p-8 shadow-md">
          <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
            로그인
          </h1>

          {/* callbackUrl을 LoginForm에 전달 — 로그인 성공 후 리다이렉트에 사용 */}
          <LoginForm callbackUrl={callbackUrl} />

          <p className="mt-4 text-center text-sm text-gray-600">
            계정이 없으신가요?{" "}
            <Link
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600"
            >
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
