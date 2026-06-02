"use client";

// 루트 레이아웃은 서버 컴포넌트이므로 SessionProvider를 별도 클라이언트 래퍼로 분리
// next-auth/react의 SessionProvider를 그대로 재내보냄
export { SessionProvider } from "next-auth/react";
