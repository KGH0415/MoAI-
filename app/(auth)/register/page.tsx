// 회원가입 페이지 — (auth) 라우트 그룹, 카드 레이아웃으로 RegisterForm 렌더링
import Link from "next/link";
import { RegisterForm } from "@/components/features/auth/RegisterForm";

export const metadata = {
  title: "회원가입",
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* 카드 컨테이너 */}
        <div className="rounded-lg bg-white p-8 shadow-md">
          <h1 className="mb-6 text-center text-2xl font-bold text-gray-900">
            회원가입
          </h1>

          <RegisterForm />

          <p className="mt-4 text-center text-sm text-gray-600">
            이미 계정이 있으신가요?{" "}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600"
            >
              로그인
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
