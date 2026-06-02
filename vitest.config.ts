import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    // jsdom 환경으로 DOM API 사용 가능
    environment: "jsdom",
    // 전역 test/expect/describe 함수 자동 주입
    globals: true,
    // 테스트 실행 전 setup 파일 로드
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      // tsconfig paths와 동일하게 @ 별칭 설정
      "@": path.resolve(__dirname, "."),
    },
  },
});
