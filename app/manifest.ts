// PWA 매니페스트 — Next.js 16 메타데이터 라우트
// /manifest.webmanifest 로 자동 노출된다.
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MBTI모임 커뮤니티",
    short_name: "MBTI모임",
    description: "MBTI로 만나는 사람들 — 진단과 커뮤니티를 한 곳에서",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    // viewport themeColor와 일치(무지개 스펙트럼 중간 톤)
    theme_color: "#6366f1",
    lang: "ko",
    icons: [
      // SVG — 모든 크기 대응(설치 가능성 보강용)
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      // PNG 192/512 — 안드로이드 설치(any)
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      // 마스커블 전용 — 안드로이드 적응형 아이콘 대응(별도 엔트리)
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
