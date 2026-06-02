import { PrismaClient } from "@prisma/client";

// Next.js 개발 핫 리로드 시 PrismaClient 인스턴스 중복 생성 방지를 위한 전역 캐시 패턴
// 프로덕션에서는 globalThis에 캐시되지 않으므로 매번 새 인스턴스 생성

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

const db: PrismaClient = globalThis.prismaGlobal ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  // 개발 환경에서만 전역 캐시에 저장 (핫 리로드 대응)
  globalThis.prismaGlobal = db;
}

export default db;
