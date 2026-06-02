"use client";

// 공감 버튼(로컬 카운터)과 공유 버튼(Web Share API / 클립보드 폴백)
// 클라이언트 상태만 사용 — 서버 저장 없음(MVP mock)

import { useState } from "react";

interface EmpathyShareButtonsProps {
  // mock 초기 공감 수 (정적 데이터에서 받거나 고정값 사용)
  initialCount: number;
  mbtiCode: string;
  nickname: string;
}

export function EmpathyShareButtons({ initialCount, mbtiCode, nickname }: EmpathyShareButtonsProps) {
  const [count, setCount] = useState(initialCount);
  const [clicked, setClicked] = useState(false);
  const [shared, setShared] = useState(false);

  // 공감 클릭 — 로컬 카운터만 증가(새로고침 시 초기화)
  const handleEmpathy = () => {
    if (!clicked) {
      setCount((c) => c + 1);
      setClicked(true);
    }
  };

  // 공유 버튼 — Web Share API 우선, 미지원 시 클립보드 복사
  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = `나의 MBTI: ${mbtiCode} ${nickname}`;
    const text = `MBTI 테스트 결과 확인해봐! ${mbtiCode} - ${nickname}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // 사용자 취소 시 무시
      }
    } else {
      // Web Share API 미지원 — 클립보드에 URL 복사
      try {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
        // 클립보드 접근 실패 시 무시
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
      {/* 공감 버튼 */}
      <button
        type="button"
        onClick={handleEmpathy}
        aria-label="이거 완전 나야 공감하기"
        className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow transition-all ${
          clicked
            ? "bg-pink-600 text-white ring-2 ring-pink-400"
            : "border border-pink-300 bg-white text-pink-600 hover:bg-pink-50"
        }`}
      >
        <span aria-hidden="true">💗</span>
        <span>이거 완전 나야</span>
        <span className="ml-1 rounded-full bg-pink-100 px-2 py-0.5 text-xs font-bold text-pink-700">
          {count.toLocaleString()}
        </span>
      </button>

      {/* 공유 버튼 */}
      <button
        type="button"
        onClick={handleShare}
        aria-label="결과 공유하기"
        className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow transition hover:bg-gray-50"
      >
        <span aria-hidden="true">📤</span>
        <span>{shared ? "링크 복사됨!" : "결과 공유하기"}</span>
      </button>
    </div>
  );
}
