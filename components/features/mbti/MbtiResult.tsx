// @MX:NOTE: [AUTO] MBTI 결과 화면 (서버 컴포넌트). MbtiInfo를 props로 받아 5개 섹션으로 렌더링한다.
// 인터랙션(공감 버튼, 공유)이 필요한 부분만 EmpathyShareButtons 클라이언트 컴포넌트로 분리.
import Link from "next/link";
import type { MbtiInfo } from "@/lib/data/mbti";
import { resetMbti } from "@/app/mbti/actions";
import { EmpathyShareButtons } from "@/components/features/mbti/result/EmpathyShareButtons";

interface MbtiResultProps {
  info: MbtiInfo;
}

// 축 레이블 쌍 (낮은 쪽 → 높은 쪽)
const AXIS_LABELS = {
  e: { low: "내향 (I)", high: "외향 (E)" },
  n: { low: "감각 (S)", high: "직관 (N)" },
  t: { low: "감정 (F)", high: "사고 (T)" },
  j: { low: "인식 (P)", high: "판단 (J)" },
};

export function MbtiResult({ info }: MbtiResultProps) {
  // 시그니처 색상 기반 인라인 스타일 (Tailwind 동적 클래스 미지원)
  const accentHex = info.color.hex;

  return (
    // 결과 페이지 배경은 흰색 — 전역 무지개 그라데이션을 덮는다(유형 선택 후 화면)
    <article className="mx-auto min-h-screen max-w-2xl space-y-6 bg-white px-4 py-8">
      {/* ── 섹션 1: 히어로 ── */}
      <section
        className="rounded-2xl p-6 shadow-sm"
        style={{ background: `${accentHex}18`, borderLeft: `4px solid ${accentHex}` }}
        aria-label="MBTI 유형 소개"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p
              className="text-5xl font-extrabold tracking-tight"
              style={{ color: accentHex }}
            >
              {info.code}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">{info.nickname}</h1>
            <p className="mt-2 text-base italic text-gray-600">"{info.catchphrase}"</p>
          </div>
          {/* 멤버 수 칩 */}
          <span
            className="self-start rounded-full px-3 py-1 text-sm font-semibold"
            style={{ background: `${accentHex}22`, color: accentHex }}
          >
            이 유형 {info.memberCount.toLocaleString()}명
          </span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-gray-700">{info.summary}</p>

        {/* 색상 뱃지 */}
        <div className="mt-3 flex items-center gap-2">
          <span
            className="inline-block h-4 w-4 rounded-full border border-gray-200"
            style={{ backgroundColor: accentHex }}
            aria-hidden="true"
          />
          <span className="text-xs text-gray-500">시그니처 컬러: {info.color.name}</span>
        </div>
      </section>

      {/* ── 섹션 2: 한눈에 보기 ── */}
      <section className="space-y-4" aria-label="한눈에 보기">
        <h2 className="text-lg font-bold text-gray-900">한눈에 보기</h2>

        {/* 한줄 요약 */}
        <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm font-medium text-gray-700">
          {info.oneLine}
        </p>

        {/* 강점 / 약점 카드 */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-green-800">강점</h3>
            <ul className="space-y-1">
              {info.strengths.map((s) => (
                <li key={s} className="flex items-start gap-1.5 text-sm text-green-900">
                  <span className="mt-0.5 text-green-500" aria-hidden="true">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-red-800">약점</h3>
            <ul className="space-y-1">
              {info.weaknesses.map((w) => (
                <li key={w} className="flex items-start gap-1.5 text-sm text-red-900">
                  <span className="mt-0.5 text-red-400" aria-hidden="true">△</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 4축 바 */}
        <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-700">성격 축 분석</h3>
          {(["e", "n", "t", "j"] as const).map((axis) => {
            const val = info.axes[axis];
            const label = AXIS_LABELS[axis];
            return (
              <div key={axis} className="space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{label.low}</span>
                  <span>{label.high}</span>
                </div>
                <div
                  className="relative h-3 overflow-hidden rounded-full bg-gray-200"
                  role="meter"
                  aria-valuenow={val}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${label.high} 성향: ${val}%`}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${val}%`, backgroundColor: accentHex }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 섹션 3: 깊이 있는 분석 (아코디언) ── */}
      <section aria-label="깊이 있는 분석">
        <details className="group rounded-xl border border-gray-200 bg-white">
          <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-base font-semibold text-gray-800 hover:bg-gray-50">
            깊이 있는 분석 펼쳐보기
            <span className="ml-2 text-gray-400 transition-transform group-open:rotate-180" aria-hidden="true">▼</span>
          </summary>
          <div className="divide-y divide-gray-100 px-5 pb-5">
            <DetailRow label="스트레스 반응" text={info.stress} />
            <DetailRow label="성장 포인트" text={info.growth} />
            <DetailRow label="연애 스타일" text={info.loveStyle} />
            <DetailRow label="우정 스타일" text={info.friendStyle} />
            <div className="pt-4">
              <span className="block text-sm font-medium text-gray-500">어울리는 직업</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {info.careers.map((career) => (
                  <span
                    key={career}
                    className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"
                  >
                    {career}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </details>
      </section>

      {/* ── 섹션 4: 궁합 ── */}
      <section className="space-y-3" aria-label="궁합">
        <h2 className="text-lg font-bold text-gray-900">궁합</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* 잘 맞는 유형 */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-emerald-800">잘 맞는 유형</h3>
            <div className="flex flex-wrap gap-2">
              {info.compatible.map((code) => (
                <Link
                  key={code}
                  href="/mbti/community"
                  className="rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 transition hover:bg-emerald-200"
                  aria-label={`${code} 조합 토론방으로 이동`}
                >
                  {code} → 이 조합 토론방
                </Link>
              ))}
            </div>
          </div>
          {/* 안 맞는 유형 */}
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <h3 className="mb-2 text-sm font-semibold text-rose-800">안 맞는 유형</h3>
            <div className="flex flex-wrap gap-2">
              {info.incompatible.map((code) => (
                <Link
                  key={code}
                  href="/mbti/community"
                  className="rounded-full border border-rose-300 bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 transition hover:bg-rose-200"
                  aria-label={`${code} 조합 토론방으로 이동`}
                >
                  {code} → 이 조합 토론방
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 섹션 5: 공감·밈 ── */}
      <section className="space-y-4" aria-label="공감 밈">
        <h2 className="text-lg font-bold text-gray-900">이 유형이라면 공감하는 순간</h2>

        {/* 밈 카드 목록 */}
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {info.memes.map((meme, idx) => (
            <li
              key={idx}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium text-gray-800"
            >
              {meme}
            </li>
          ))}
        </ul>

        {/* 유명인/캐릭터 */}
        <div>
          <h3 className="mb-2 text-sm font-semibold text-gray-600">이 유형으로 알려진 인물</h3>
          <div className="flex flex-wrap gap-2">
            {info.celebrities.map((name) => (
              <span
                key={name}
                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-700"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        {/* 공감·공유 버튼 */}
        <EmpathyShareButtons
          initialCount={Math.floor(info.memberCount / 3)}
          mbtiCode={info.code}
          nickname={info.nickname}
        />
      </section>

      {/* ── 하단 버튼 행 ── */}
      <div className="flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row">
        {/* 뒤로가기 — 쿠키 삭제 후 /mbti(선택 화면) 이동 */}
        <form action={resetMbti} className="flex-1">
          <button
            type="submit"
            className="w-full rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            뒤로가기
          </button>
        </form>
        {/* 모임 입장하기 — 커뮤니티 페이지로 이동 */}
        <Link
          href="/mbti/community"
          className="flex flex-1 items-center justify-center rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          모임 입장하기
        </Link>
      </div>
    </article>
  );
}

// 깊이 있는 분석 내 행 컴포넌트
function DetailRow({ label, text }: { label: string; text: string }) {
  return (
    <div className="pt-4">
      <span className="block text-sm font-medium text-gray-500">{label}</span>
      <p className="mt-1 text-sm leading-relaxed text-gray-800">{text}</p>
    </div>
  );
}
