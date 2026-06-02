"use client";

// @MX:NOTE: [AUTO] 16개 MBTI 버튼 그리드(REQ-MBTI-001). 클릭 시 saveMbti(쿠키 저장)를 호출한 뒤 /mbti로 이동·새로고침한다.
// 분기의 단일 진실 공급원은 /mbti 서버 컴포넌트이므로, 저장 후 push("/mbti")+refresh로 결과 화면 재분기를 유도한다.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MBTI_CODES, MBTI_DATA } from "@/lib/data/mbti";
import { saveMbti } from "@/app/mbti/actions";

export function MbtiSelector() {
  const router = useRouter();
  // 중복 클릭(빠른 더블 클릭) 방지 — 저장 진행 중에는 모든 버튼 비활성화
  const [pending, setPending] = useState(false);

  const handleSelect = async (code: string) => {
    if (pending) return;
    setPending(true);

    const result = await saveMbti(code);
    if (!result.ok) {
      // 저장 실패 시 선택 화면 유지(쿠키 미설정) — 사용자가 다시 시도할 수 있도록 활성화
      setPending(false);
      return;
    }

    // 저장 성공 — /mbti 서버 컴포넌트가 결과 화면으로 재분기하도록 이동·새로고침
    router.push("/mbti");
    router.refresh();
  };

  return (
    <section className="mx-auto max-w-2xl space-y-6 p-6">
      <header className="space-y-1 text-center">
        <h1 className="text-xl font-semibold text-gray-900">MBTI를 선택하세요</h1>
        <p className="text-sm text-gray-500">자신의 유형을 하나 선택하면 특징을 확인할 수 있어요.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {MBTI_CODES.map((code) => (
          <button
            key={code}
            type="button"
            disabled={pending}
            onClick={() => handleSelect(code)}
            aria-label={`${code} · ${MBTI_DATA[code].nickname}`}
            className="flex flex-col items-center rounded-md border border-blue-600 bg-blue-600 px-3 py-3 text-center shadow-sm transition hover:border-blue-700 hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="text-base font-semibold text-white">{code}</span>
            <span className="mt-1 text-xs text-white">{MBTI_DATA[code].nickname}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
