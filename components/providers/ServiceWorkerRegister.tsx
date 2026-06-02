"use client";

import { useEffect } from "react";

// PWA 서비스 워커 등록 — 클라이언트 전용
// 프로덕션 빌드에서만 /sw.js를 등록하여 개발 중 캐시로 인한 혼란을 방지한다.
export function ServiceWorkerRegister() {
  useEffect(() => {
    // 브라우저가 서비스 워커를 지원하지 않으면 아무것도 하지 않음
    if (!("serviceWorker" in navigator)) return;

    // 개발 모드에서는 등록을 건너뜀(HMR/캐시 충돌 방지)
    if (process.env.NODE_ENV !== "production") return;

    // 페이지 load 이후 등록 — 초기 렌더 성능에 영향 최소화
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // 등록 실패는 앱 동작에 치명적이지 않으므로 조용히 무시
      });
    };

    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  // 렌더링 결과 없음 — 부수효과 전용 컴포넌트
  return null;
}
