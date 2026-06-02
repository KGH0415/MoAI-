"use client";

// @MX:NOTE: [AUTO] 회원가입 폼 — react-hook-form + zod(registerSchema) 유효성 검사 후 /api/auth/register POST
// 제출 흐름: 입력값 검증(클라이언트) → POST /api/auth/register → 201 성공 상태 표시 또는 에러 매핑

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";

export function RegisterForm() {
  // 서버 응답 성공 상태 — 폼 대신 성공 메시지 표시에 사용
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // 폼 전체 수준 에러 (409 중복 이메일 등)
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  // @MX:NOTE: [AUTO] onSubmit — 201: 성공 메시지, 400: 필드별 에러 매핑, 409: 폼 에러, 500: 폼 에러
  const onSubmit = async (data: RegisterInput) => {
    setFormError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 비밀번호 값은 서버로만 전달, 클라이언트 상태에 보관하지 않음
        body: JSON.stringify(data),
      });

      if (response.status === 201) {
        // AC-1: 회원가입 성공 시 성공 상태 표시
        const json = await response.json() as { message?: string };
        setSuccessMessage(json.message ?? "이메일을 확인해주세요.");
        return;
      }

      if (response.status === 409) {
        // 중복 이메일 — 폼 전체 수준 에러
        setFormError("이미 사용 중인 이메일입니다.");
        return;
      }

      if (response.status === 400) {
        // 필드별 유효성 에러 매핑
        const json = await response.json() as {
          error?: string;
          fields?: Record<string, string[]>;
        };
        if (json.fields) {
          (
            Object.entries(json.fields) as [keyof RegisterInput, string[]][]
          ).forEach(([field, messages]) => {
            setError(field, { message: messages[0] });
          });
        } else {
          setFormError(json.error ?? "입력값을 확인해주세요.");
        }
        return;
      }

      // 500 또는 기타 예상 외 에러
      setFormError("서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } catch {
      setFormError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    }
  };

  // 성공 상태 화면
  if (successMessage) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-md bg-green-50 p-4 text-sm text-green-800"
      >
        {successMessage}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* 폼 전체 수준 에러 메시지 */}
      {formError && (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-md bg-red-50 p-3 text-sm text-red-700"
        >
          {formError}
        </div>
      )}

      {/* 이메일 필드 */}
      <div className="space-y-1">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          이메일 <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-required="true"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.email
              ? "border-red-500 bg-red-50"
              : "border-gray-300 bg-white"
          }`}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" role="alert" className="text-xs text-red-600">
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
          비밀번호 <span aria-hidden="true" className="text-red-500">*</span>
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-required="true"
          aria-invalid={!!errors.password}
          aria-describedby={
            errors.password ? "password-error" : "password-hint"
          }
          className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.password
              ? "border-red-500 bg-red-50"
              : "border-gray-300 bg-white"
          }`}
          {...register("password")}
        />
        {errors.password ? (
          <p id="password-error" role="alert" className="text-xs text-red-600">
            {errors.password.message}
          </p>
        ) : (
          <p id="password-hint" className="text-xs text-gray-500">
            최소 8자, 영문과 숫자를 포함해야 합니다.
          </p>
        )}
      </div>

      {/* 이름 필드 (선택) */}
      <div className="space-y-1">
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          이름 <span className="text-gray-400 text-xs">(선택)</span>
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          className={`block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name
              ? "border-red-500 bg-red-50"
              : "border-gray-300 bg-white"
          }`}
          {...register("name")}
        />
        {errors.name && (
          <p id="name-error" role="alert" className="text-xs text-red-600">
            {errors.name.message}
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
        {isSubmitting ? "처리 중..." : "회원가입"}
      </button>
    </form>
  );
}
