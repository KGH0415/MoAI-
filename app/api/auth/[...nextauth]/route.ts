// Auth.js v5 catch-all 라우트 — GET/POST 핸들러 re-export
// lib/auth.ts의 handlers를 그대로 내보내는 최소 래퍼
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
