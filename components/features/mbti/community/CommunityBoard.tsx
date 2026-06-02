"use client";

// MBTI 모임 게시판 — 종이 질감 디자인(클라이언트 컴포넌트).
// 인기 모임방/게시글 더보기, 오늘의 일기 CRUD, 토스트 알림을 React 상태로 구현.
// 모든 데이터는 mock — DB(PostgreSQL) 미연결 환경 MVP.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface Room {
  n: string;
  tag: string;
  cls: string;
  count: number;
}
interface Post {
  t: string;
  like: number;
  cmt: number;
}

const ROOMS: Room[] = [
  { n: "새벽 감성 글쓰기 모임", tag: "INFP", cls: "", count: 312 },
  { n: "조용한 사람들의 수다방", tag: "I 공통", cls: "", count: 287 },
  { n: "T가 본 F의 세계", tag: "토론", cls: "t-neutral", count: 241 },
  { n: "플레이리스트 공유방", tag: "감성", cls: "t-sage", count: 198 },
  { n: "퇴근 후 같이 책 읽기", tag: "INFP", cls: "", count: 176 },
  { n: "내향인 여행 메이트 구함", tag: "여행", cls: "t-sage", count: 154 },
  { n: "오늘의 짤 자랑방", tag: "유머", cls: "t-neutral", count: 142 },
  { n: "연애 고민 들어주는 방", tag: "연애", cls: "", count: 131 },
  { n: "갓생 살고 싶은 P들 모여", tag: "P 공통", cls: "t-sage", count: 118 },
  { n: "새벽 3시 감정 일기방", tag: "INFP", cls: "", count: 96 },
];

const POSTS: Post[] = [
  { t: "혼자 있는 시간이 진짜 충전되는 사람?", like: 482, cmt: 96 },
  { t: "INFP 연애할 때 이런 적 있으신가요", like: 351, cmt: 73 },
  { t: "우리끼리만 통하는 말 모아봅니다", like: 298, cmt: 54 },
  { t: "감정 쓰레기통 되는 거 어떻게 끊나요", like: 264, cmt: 88 },
  { t: "갑자기 잠수 타고 싶을 때 다들 있죠", like: 241, cmt: 61 },
  { t: "머릿속 시뮬레이션 1일 100회 하는 사람", like: 219, cmt: 47 },
  { t: "칭찬 받으면 오히려 어색한 거 나만?", like: 188, cmt: 39 },
  { t: "좋아하는 사람한테 못 다가가는 이유", like: 170, cmt: 52 },
  { t: "오늘 회사에서 울 뻔한 썰 풉니다", like: 156, cmt: 33 },
  { t: "INFP가 추천하는 인생 영화 모음", like: 143, cmt: 71 },
];

const SCOPES = ["나만 보기", "같은 MBTI에게 공개", "전체 공개"];

// 붙여넣은 원본 디자인 CSS를 .infp-board 하위로 스코프 처리(전역 오염 방지).
const CSS = `
.infp-board{
  --paper:#F3ECE0; --paper-deep:#EAE0D0; --card:#FBF7EF; --ink:#2C2823;
  --ink-soft:#6E6458; --ink-faint:#A89C8B; --line:#DDD2C0; --plum:#7C4A63;
  --plum-soft:#A66E89; --plum-wash:#F0E2E9; --sage:#6E7E5E; --sage-wash:#E6EADD;
  --danger:#A6492F; --serif:'Gowun Batang', serif; --sans:'Gowun Dodum', sans-serif;
  font-family:var(--sans);
  /* 배경은 전역 무지개 그라데이션(body)에 맡기고 투명 처리 — 전체 페이지 통일 */
  background:transparent;
  color:var(--ink);
  line-height:1.7;
  -webkit-font-smoothing:antialiased;
  padding-bottom:80px;
  min-height:100vh;
}
.infp-board *{box-sizing:border-box;margin:0;padding:0}
.infp-board .wrap{max-width:720px;margin:0 auto;padding:0 22px}

.infp-board header{
  position:sticky;top:0;z-index:50;
  background:rgba(243,236,224,0.85);
  backdrop-filter:saturate(150%) blur(10px);
  border-bottom:1px solid var(--line);
}
.infp-board .hbar{display:flex;align-items:center;justify-content:space-between;padding:16px 0}
.infp-board .brand{display:flex;align-items:center;gap:10px}
.infp-board .back{
  font-family:var(--sans);font-size:12.5px;color:var(--ink-soft);text-decoration:none;
  border:1px solid var(--line);border-radius:999px;padding:5px 13px;transition:.18s;white-space:nowrap;
}
.infp-board .back:hover{border-color:var(--plum-soft);color:var(--plum)}
.infp-board .brand .type{
  font-family:var(--serif);font-weight:700;font-size:18px;color:var(--plum);
  border:1.5px solid var(--plum);border-radius:999px;padding:2px 14px;line-height:1.4;
  cursor:pointer;transition:.2s;
}
.infp-board .brand .type:hover{background:var(--plum);color:#fff}
.infp-board .online{display:flex;align-items:center;gap:7px;font-size:13px;color:var(--ink-soft)}
.infp-board .dot{width:7px;height:7px;border-radius:50%;background:var(--sage);box-shadow:0 0 0 0 rgba(110,126,94,.6);animation:ib-pulse 2.4s infinite}
@keyframes ib-pulse{0%{box-shadow:0 0 0 0 rgba(110,126,94,.5)}70%{box-shadow:0 0 0 7px rgba(110,126,94,0)}100%{box-shadow:0 0 0 0 rgba(110,126,94,0)}}

.infp-board .hero{padding:44px 0 30px;text-align:center}
.infp-board .hero .badge{font-size:12.5px;color:var(--plum);letter-spacing:.18em;text-transform:uppercase}
.infp-board .hero h1{font-family:var(--serif);font-weight:700;font-size:34px;line-height:1.25;margin:10px 0 8px}
.infp-board .hero p{color:var(--ink-soft);font-size:14.5px}

.infp-board section{margin-top:18px;opacity:0;transform:translateY(16px);animation:ib-rise .7s ease forwards}
.infp-board section:nth-of-type(1){animation-delay:.05s}
.infp-board section:nth-of-type(2){animation-delay:.18s}
.infp-board section:nth-of-type(3){animation-delay:.31s}
@keyframes ib-rise{to{opacity:1;transform:none}}
.infp-board .sec-head{display:flex;align-items:center;gap:11px;margin:30px 0 16px}
.infp-board .sec-head .ico{
  width:34px;height:34px;flex:none;border-radius:10px;display:grid;place-items:center;
  background:var(--plum-wash);color:var(--plum);font-size:18px;
}
.infp-board .sec-head .ico.s2{background:var(--sage-wash);color:var(--sage)}
.infp-board .sec-head .ico.s3{background:#F2E7D7;color:#9A6B2F}
.infp-board .sec-head h2{font-family:var(--serif);font-weight:700;font-size:21px;line-height:1.2}
.infp-board .sec-head .sub{font-size:12.5px;color:var(--ink-faint);margin-top:1px}

.infp-board .rooms{display:flex;flex-direction:column;gap:10px}
.infp-board .room{
  display:flex;align-items:center;gap:16px;background:var(--card);
  border:1px solid var(--line);border-radius:16px;padding:15px 17px;
  transition:transform .18s ease, box-shadow .18s ease, border-color .18s;
}
.infp-board .room:hover{transform:translateY(-2px);box-shadow:0 8px 22px -14px rgba(44,40,35,.4);border-color:var(--plum-soft)}
.infp-board .rank{font-family:var(--serif);font-weight:700;font-size:26px;width:30px;text-align:center;flex:none;color:var(--ink-faint);line-height:1}
.infp-board .room:nth-child(-n+3) .rank,.infp-board .post:nth-child(-n+3) .rank{color:var(--plum)}
.infp-board .room .body{flex:1;min-width:0}
.infp-board .room .name{font-size:15px;font-weight:400;color:var(--ink)}
.infp-board .room .meta{display:flex;align-items:center;gap:9px;margin-top:5px;font-size:12.5px;color:var(--ink-soft)}
.infp-board .tag{font-size:11.5px;padding:2px 10px;border-radius:999px;background:var(--plum-wash);color:var(--plum);letter-spacing:.02em}
.infp-board .tag.t-sage{background:var(--sage-wash);color:var(--sage)}
.infp-board .tag.t-neutral{background:var(--paper-deep);color:var(--ink-soft)}
.infp-board .enter{
  flex:none;font-family:var(--sans);font-size:13px;color:var(--plum);
  background:transparent;border:1.4px solid var(--plum);border-radius:999px;
  padding:7px 18px;cursor:pointer;transition:.18s;
}
.infp-board .enter:hover{background:var(--plum);color:#fff}
.infp-board .enter:active{transform:scale(.95)}

.infp-board .posts{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden}
.infp-board .post{display:flex;align-items:center;gap:15px;padding:14px 18px;cursor:pointer;transition:background .15s}
.infp-board .post + .post{border-top:1px solid var(--line)}
.infp-board .post:hover{background:var(--plum-wash)}
.infp-board .post .rank{font-size:20px;width:24px}
.infp-board .post .title{flex:1;min-width:0;font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.infp-board .post .stat{flex:none;font-size:12.5px;color:var(--ink-soft);display:flex;gap:11px;white-space:nowrap}
.infp-board .post .stat span{display:inline-flex;align-items:center;gap:4px}

.infp-board .more{
  margin-top:12px;width:100%;font-family:var(--sans);font-size:13px;color:var(--ink-soft);
  background:transparent;border:1px dashed var(--line);border-radius:12px;padding:11px;
  cursor:pointer;transition:.18s;letter-spacing:.02em;text-decoration:none;display:block;text-align:center;
}
.infp-board .more:hover{border-color:var(--plum-soft);color:var(--plum)}

.infp-board .diary{
  background:var(--card);border:1px solid var(--line);border-radius:18px;
  padding:22px;position:relative;
  box-shadow:0 14px 30px -22px rgba(44,40,35,.5);
}
.infp-board .diary::before{content:"";position:absolute;left:22px;top:14px;bottom:14px;width:1px;background:var(--plum-wash)}
.infp-board .diary .date{font-family:var(--serif);font-size:15px;color:var(--plum);margin-bottom:4px;padding-left:14px}
.infp-board .diary .hint{font-size:12.5px;color:var(--ink-faint);margin-bottom:14px;padding-left:14px}
.infp-board textarea{
  width:100%;min-height:120px;resize:vertical;font-family:var(--sans);font-size:15px;line-height:1.85;
  color:var(--ink);background:transparent;border:none;outline:none;padding:0 0 0 14px;
}
.infp-board textarea::placeholder{color:var(--ink-faint)}
.infp-board .diary-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:16px;flex-wrap:wrap;padding-left:14px}
.infp-board select{
  font-family:var(--sans);font-size:13px;color:var(--ink-soft);background:var(--paper);
  border:1px solid var(--line);border-radius:10px;padding:7px 10px;cursor:pointer;
}
.infp-board .acts{display:flex;gap:8px}
.infp-board .btn{font-family:var(--sans);font-size:13.5px;border-radius:10px;padding:8px 16px;cursor:pointer;border:1px solid transparent;transition:.18s;display:inline-flex;align-items:center;gap:6px}
.infp-board .btn:active{transform:scale(.96)}
.infp-board .btn-primary{background:var(--plum);color:#fff}
.infp-board .btn-primary:hover{background:#693e54}
.infp-board .btn-ghost{background:transparent;color:var(--ink-soft);border-color:var(--line)}
.infp-board .btn-ghost:hover{border-color:var(--plum-soft);color:var(--plum)}
.infp-board .btn-danger{background:transparent;color:var(--danger);border-color:#E2CBC0}
.infp-board .btn-danger:hover{background:var(--danger);color:#fff;border-color:var(--danger)}

.infp-board .saved{padding-left:14px}
.infp-board .saved .text{font-size:15px;line-height:1.9;color:var(--ink);white-space:pre-wrap;word-break:break-word}
.infp-board .saved .scope{display:inline-block;margin-top:14px;font-size:12px;color:var(--ink-faint);border:1px solid var(--line);border-radius:999px;padding:2px 11px}

.infp-board .footer-back{margin-top:26px;text-align:center}
.infp-board .footer-back a{display:inline-block;width:auto;padding:11px 26px}

.infp-board .toast{
  position:fixed;left:50%;bottom:28px;transform:translateX(-50%) translateY(20px);
  background:var(--ink);color:var(--paper);font-size:13.5px;padding:11px 20px;border-radius:999px;
  opacity:0;pointer-events:none;transition:.3s;z-index:99;
}
.infp-board .toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
`;

export function CommunityBoard({
  mbtiCode,
  nickname,
}: {
  mbtiCode: string;
  nickname: string;
}) {
  const [showRooms, setShowRooms] = useState(false);
  const [showPosts, setShowPosts] = useState(false);
  const [diary, setDiary] = useState({ text: "", scope: "나만 보기", saved: false });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftScope, setDraftScope] = useState("나만 보기");
  const [toastMsg, setToastMsg] = useState("");
  const [toastShow, setToastShow] = useState(false);
  const [today, setToday] = useState("");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 날짜는 클라이언트에서만 계산 — SSR/CSR 하이드레이션 불일치 방지
  useEffect(() => {
    setToday(
      new Date().toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    );
  }, []);

  function toast(msg: string) {
    setToastMsg(msg);
    setToastShow(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastShow(false), 1900);
  }

  function startEdit() {
    setDraft(diary.text);
    setDraftScope(diary.scope);
    setEditing(true);
  }

  function save() {
    const v = draft.trim();
    if (!v) {
      toast("내용을 입력해주세요");
      return;
    }
    setDiary({ text: v, scope: draftScope, saved: true });
    setEditing(false);
    toast("일기가 저장되었어요 ✦");
  }

  function del() {
    if (!window.confirm("오늘의 일기를 삭제할까요?")) return;
    setDiary({ text: "", scope: "나만 보기", saved: false });
    setDraft("");
    setDraftScope("나만 보기");
    setEditing(false);
    toast("일기를 삭제했어요");
  }

  // 저장 전이거나 수정 중이면 입력 폼, 그 외에는 읽기 뷰
  const showForm = !diary.saved || editing;

  return (
    <div className="infp-board">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link
        href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Gowun+Dodum&display=swap"
        rel="stylesheet"
      />

      {/* ── 헤더 ── */}
      <header>
        <div className="wrap hbar">
          <div className="brand">
            {/* 뒤로가기 — 결과 페이지(/mbti)로 이동 */}
            <Link href="/mbti" className="back" aria-label="결과 페이지로 돌아가기">
              ← 뒤로
            </Link>
            <span
              className="type"
              onClick={() => toast("유형 선택 화면으로 이동")}
            >
              {mbtiCode} · {nickname}
            </span>
          </div>
          <div className="online">
            <span className="dot" /> 접속 1,204명
          </div>
        </div>
      </header>

      <div className="wrap">
        {/* 페이지 인트로 */}
        <div className="hero">
          <div className="badge">Gathering</div>
          <h1>
            잔잔한 사람들이
            <br />
            모이는 곳
          </h1>
          <p>오늘도 비슷한 결을 가진 사람들과 머물러보세요.</p>
        </div>

        {/* 1. 인기 모임방 */}
        <section>
          <div className="sec-head">
            <div className="ico">☉</div>
            <div>
              <h2>인기 모임방</h2>
              <div className="sub">지금 가장 활발한 방 TOP 10</div>
            </div>
          </div>
          <div className="rooms">
            {ROOMS.map((r, i) => (
              <div
                key={i}
                className={`room${i >= 3 ? (showRooms ? " extra" : " extra hidden") : ""}`}
                style={i >= 3 && !showRooms ? { display: "none" } : undefined}
              >
                <div className="rank">{i + 1}</div>
                <div className="body">
                  <div className="name">{r.n}</div>
                  <div className="meta">
                    <span className={`tag ${r.cls}`}>{r.tag}</span> 참여 {r.count}명
                  </div>
                </div>
                <button className="enter" onClick={() => toast(`「${r.n}」 입장!`)}>
                  입장
                </button>
              </div>
            ))}
          </div>
          {!showRooms && (
            <button className="more" onClick={() => setShowRooms(true)}>
              4 ~ 10위 모임방 더보기 ↓
            </button>
          )}
        </section>

        {/* 2. 인기 게시글 */}
        <section>
          <div className="sec-head">
            <div className="ico s2">✎</div>
            <div>
              <h2>인기 게시글</h2>
              <div className="sub">공감과 댓글이 많은 글 TOP 10</div>
            </div>
          </div>
          <div className="posts">
            {POSTS.map((p, i) => (
              <div
                key={i}
                className={`post${i >= 3 ? (showPosts ? " extra" : " extra hidden") : ""}`}
                style={i >= 3 && !showPosts ? { display: "none" } : undefined}
                onClick={() => toast(`게시글 열기: ${p.t}`)}
              >
                <div className="rank">{i + 1}</div>
                <div className="title">{p.t}</div>
                <div className="stat">
                  <span>♡ {p.like}</span>
                  <span>💬 {p.cmt}</span>
                </div>
              </div>
            ))}
          </div>
          {!showPosts && (
            <button className="more" onClick={() => setShowPosts(true)}>
              4 ~ 10위 게시글 더보기 ↓
            </button>
          )}
        </section>

        {/* 3. 오늘의 일기 */}
        <section>
          <div className="sec-head">
            <div className="ico s3">☷</div>
            <div>
              <h2>오늘의 일기</h2>
              <div className="sub">하루를 한 줄로 남겨보세요</div>
            </div>
          </div>
          <div className="diary">
            <div className="date">{today}</div>
            {showForm ? (
              <>
                <div className="hint">
                  {editing ? "일기를 수정하고 있어요" : "오늘 하루는 어땠나요?"}
                </div>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="떠오르는 생각을 편하게 적어보세요..."
                />
                <div className="diary-foot">
                  <select
                    value={draftScope}
                    onChange={(e) => setDraftScope(e.target.value)}
                  >
                    {SCOPES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <div className="acts">
                    {editing && (
                      <button className="btn btn-ghost" onClick={() => setEditing(false)}>
                        취소
                      </button>
                    )}
                    <button className="btn btn-primary" onClick={save}>
                      ✓ {editing ? "저장" : "등록"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="saved">
                <div className="text">{diary.text}</div>
                <span className="scope">{diary.scope}</span>
                <div className="diary-foot" style={{ paddingLeft: 0 }}>
                  <span style={{ fontSize: "12.5px", color: "var(--ink-faint)" }}>
                    오늘의 기록이 저장되었어요
                  </span>
                  <div className="acts">
                    <button className="btn btn-ghost" onClick={startEdit}>
                      ✎ 수정
                    </button>
                    <button className="btn btn-danger" onClick={del}>
                      🗑 삭제
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* 하단 뒤로가기 */}
        <div className="footer-back">
          <Link href="/mbti" className="more">
            ← 결과 페이지로 돌아가기
          </Link>
        </div>
      </div>

      {/* 토스트 */}
      <div className={`toast${toastShow ? " show" : ""}`}>{toastMsg}</div>
    </div>
  );
}
