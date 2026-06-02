// 루트 레이아웃 — 서버 컴포넌트, SessionProvider로 클라이언트 세션 공유
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ServiceWorkerRegister } from "@/components/providers/ServiceWorkerRegister";

export const metadata: Metadata = {
  title: "MBTI모임 커뮤니티",
  description: "MBTI로 만나는 사람들 — Next.js 16 + Auth.js v5",
  // PWA 매니페스트 연결 (app/manifest.ts가 /manifest.webmanifest로 노출됨)
  manifest: "/manifest.webmanifest",
  // iOS 홈 화면 추가(Add to Home Screen) 지원
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MBTI모임",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/apple-touch-icon.png",
  },
};

// 모바일 반응형 + PWA 테마 색상
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // 무지개 스펙트럼 중간 톤(인디고) — 매니페스트 theme_color와 일치
  themeColor: "#6366f1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {/* 클라이언트 컴포넌트에서 useSession 훅 사용을 위한 SessionProvider 래핑 */}
        <SessionProvider>{children}</SessionProvider>
        {/* PWA 서비스 워커 등록 (프로덕션에서만 동작) */}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
