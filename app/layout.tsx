// 루트 레이아웃 — 서버 컴포넌트, SessionProvider로 클라이언트 세션 공유
import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";

export const metadata: Metadata = {
  title: "인증 앱",
  description: "Next.js 16 + Auth.js v5 인증 예제",
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
      </body>
    </html>
  );
}
