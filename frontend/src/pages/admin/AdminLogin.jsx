/** 관리자 로그인 — 스플릿 스크린 레이아웃 (좌: 배경영상 히어로, 우: 인증 폼) */
import { useState, useEffect } from "react";
import "./AdminLogin.css";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const MAX_ATTEMPTS = 5;
const LOCK_DURATION_SEC = 15 * 60;

export default function AdminLogin({ onLogin }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("admin");
  const [clock, setClock] = useState(new Date());
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockRemain, setLockRemain] = useState(0);

  const [heroVideo, setHeroVideo] = useState("/videos/manhattan-panoramic.mp4");

  // 활성 히어로 영상 로드 (localStorage 캐시 우선, API 갱신)
  useEffect(() => {
    const cached = localStorage.getItem("activeHeroVideo");
    if (cached) setHeroVideo(cached);
    fetch("/api/sb/hero-videos/active")
      .then(r => r.json())
      .then(json => {
        if (json.data?.url) {
          setHeroVideo(json.data.url);
          localStorage.setItem("activeHeroVideo", json.data.url);
        }
      })
      .catch(() => {});
  }, []);

  // 관리자 페이지에서 활성 영상 변경 시 실시간 반영
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "activeHeroVideo" && e.newValue) {
        setHeroVideo(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // 실시간 시계 (1초 간격)
  useEffect(() => {
    const id = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // 잠금 카운트다운
  useEffect(() => {
    if (!locked) return;
    const id = setInterval(() => {
      setLockRemain((prev) => {
        if (prev <= 1) { setLocked(false); setAttempts(0); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [locked]);

  const hh = String(clock.getHours()).padStart(2, "0");
  const mm = String(clock.getMinutes()).padStart(2, "0");
  const dateStr = `${DAY_NAMES[clock.getDay()]}, ${MONTH_NAMES[clock.getMonth()]} ${clock.getDate()}, ${clock.getFullYear()}`;

  const submit = (e) => {
    e.preventDefault();
    if (locked) return;
    if (pw === "1234") {
      onLogin();
    } else {
      const next = attempts + 1;
      setAttempts(next);
      if (next >= MAX_ATTEMPTS) {
        setLocked(true);
        setLockRemain(LOCK_DURATION_SEC);
        setErr("로그인 시도가 너무 많습니다. 15분 후 다시 시도해주세요.");
      } else {
        setErr("비밀번호가 틀렸습니다.");
      }
    }
  };

  const lockMin = Math.ceil(lockRemain / 60);
  const hasError = !!err;

  return (
    <div className="admin-login">
      {/* ── 좌측 히어로 패널 ── */}
      <div className="admin-login__left">
        <video
          key={heroVideo}
          autoPlay
          muted
          loop
          playsInline
          src={heroVideo}
          className="admin-login__left-video"
        />
        <div className="admin-login__left-overlay" />

        {/* 상단: 버전 배지 + 시계 */}
        <div className="admin-login__top">
          <div className="admin-login__version">1.00</div>
          <div className="admin-login__clock">{hh}:{mm}</div>
          <div className="admin-login__date">{dateStr}</div>
        </div>

        {/* 하단: 브랜딩 */}
        <div className="admin-login__brand">
          <div className="admin-login__brand-name">YOUNJEONG</div>
          <div className="admin-login__brand-addr">
            서울 서초구 서초대로 327<br />
            SH키움스퀘어 5층
          </div>
          <div className="admin-login__brand-links">
            <span className="admin-login__brand-link">ERP</span>
            <span className="admin-login__brand-sep" />
            <span className="admin-login__brand-link">CMS</span>
            <span className="admin-login__brand-sep" />
            <span className="admin-login__brand-link">ANALYTICS</span>
          </div>
        </div>
      </div>

      {/* ── 우측 인증 폼 패널 ── */}
      <div className="admin-login__right">
        <a href="/" className="admin-login__home-link">홈페이지</a>

        <div className="admin-login__form-wrap">
          <div className="admin-login__label">ADMINISTRATION</div>
          <h1 className="admin-login__heading">관리자 인증</h1>

          {/* 역할 전환 탭 */}
          <div className="admin-login__tabs">
            <button
              type="button"
              className={`admin-login__tab ${tab === "admin" ? "admin-login__tab--active" : "admin-login__tab--inactive"}`}
              onClick={() => setTab("admin")}
            >
              관리자
            </button>
            <button
              type="button"
              className={`admin-login__tab ${tab === "staff" ? "admin-login__tab--active" : "admin-login__tab--inactive"}`}
              onClick={() => setTab("staff")}
            >
              직원
            </button>
          </div>

          {/* 인증 폼 */}
          <form onSubmit={submit}>
            <div className="admin-login__pw-label">PASSWORD</div>
            <input
              type="password"
              className={`admin-login__input ${hasError ? "admin-login__input--error" : ""}`}
              value={pw}
              onChange={(e) => { setPw(e.target.value); setErr(""); }}
              disabled={locked}
              autoFocus
            />

            {err && (
              <div className="admin-login__error">
                {locked
                  ? `로그인 시도가 너무 많습니다. ${lockMin}분 후 다시 시도해주세요.`
                  : err}
              </div>
            )}

            <button type="submit" className="admin-login__btn" disabled={locked}>
              AUTHENTICATE
            </button>
          </form>

          {/* 하단 푸터 */}
          <div className="admin-login__footer">
            <div className="admin-login__footer-line">YOUNJEONG LAW OFFICE</div>
            <div className="admin-login__footer-line">CONFIDENTIAL ACCESS</div>
          </div>
        </div>
      </div>
    </div>
  );
}
