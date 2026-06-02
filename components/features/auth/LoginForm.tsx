"use client";

// @MX:NOTE: [AUTO] 로그인 폼 — react-hook-form + zod(loginSchema) 유효성 검사 후 signIn("credentials") 호출
// 제출 흐름: 입력값 검증(클라이언트) → signIn("credentials", { redirect: false }) → 에러 시 제네릭 메시지 표시, 성공 시 callbackUrl로 이동

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

interface LoginFormProps {
  // 로그인 성공 후 리다이렉트 대상 URL — 미전달 시 홈("/")으로 이동
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl }: LoginFormProps) {
  // 인증 실패 시 표시할 제네릭 에러 메시지
  const [authError, setAuthError] = useState<string | null>(null);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // @MX:NOTE: [AUTO] onSubmit — signIn 결과의 error 여부로 분기: 에러 시 제네릭 메시지, 성공 시 callbackUrl 이동
  const onSubmit = async (data: LoginInput) => {
    setAuthError(null);

    // redirect: false — 직접 결과를 받아 처리
    // 비밀번호 값은 next-auth 내부에서만 사용, 클라이언트 상태에 저장하지 않음
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      // AC-5: 잘못된 자격증명 시 제네릭 메시지 표시 (사용자 존재 여부 노출 방지)
      setAuthError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }

    // 성공 — callbackUrl 또는 홈으로 이동
    router.push(callbackUrl ?? "/");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* 인증 실패 에러 메시지 */}
      {authError && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-md bg-red-50 p-3 text-sm text-red-700"
        >
          {authError}
        </div>
      )}

      {/* 이메일 필드 */}
      <div className="space-y-1">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          이메일
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.email
              ? "border-red-500 bg-red-50"
              : "border-gray-300 bg-white"
          }`}
          {...register("email")}
        />
        {errors.email && (
          <p
            id="login-email-error"
            role="alert"
            className="text-xs text-red-600"
          >
            {errors.email.message}
          </p>
        )}
      </div>

      {/* 비밀번호 필드 */}
      <div className="space-y-1">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          비밀번호
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-required="true"
          aria-invalid={!!errors.password}
          aria-describedby={
            errors.password ? "login-password-error" : undefined
          }
          className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.password
              ? "border-red-500 bg-red-50"
              : "border-gray-300 bg-white"
          }`}
          {...register("password")}
        />
        {errors.password && (
          <p
            id="login-password-error"
            role="alert"
            className="text-xs text-red-600"
          >
            {errors.password.message}
          </p>
        )}
      </div>

      {/* 제출 버튼 — 제출 중 비활성화 */}
      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "로그인 중..." : "로그인"}
      </button>

      {/* @MX:TODO 소셜 로그인 버튼 (REQ-AUTH-003) */}
    </form>
  );
}
