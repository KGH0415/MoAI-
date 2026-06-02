// (auth) 라우트 그룹 레이아웃 — 서버 컴포넌트
// 로그인/회원가입 페이지에 무지개 그라데이션 배경을 자동 적용한다.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="rainbow-bg">{children}</div>;
}
