/** HomePage — 윤정 법률사무소 메인 랜딩 페이지 */
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useReveal from "../hooks/useReveal";
import { api } from "../utils/api";

const STATS = [
  { value: "15+", label: "년 이상 실무 경험", icon: "⚖️" },
  { value: "1:1", label: "사건 맞춤 커뮤니케이션", icon: "🤝" },
  { value: "24H", label: "신속한 초기 응답", icon: "⏱️" },
  { value: "100%", label: "기밀 보장 원칙", icon: "🔒" },
];

const HIGHLIGHTS = [
  { title: "맞춤형 전략 수립", desc: "사건의 쟁점을 빠르게 분석해 의뢰인에게 최적화된 대응 전략을 제시합니다." },
  { title: "신뢰 중심 커뮤니케이션", desc: "진행 상황을 투명하게 공유하고 의사결정의 모든 과정에 의뢰인을 참여시킵니다." },
  { title: "풍부한 사건 수행 경험", desc: "민사·형사·가사·행정·조세 등 다양한 분야에서 실무 경험을 축적했습니다." },
];

export default function HomePage() {
  const [heroVideo, setHeroVideo] = useState("/videos/manhattan-panoramic.mp4");
  const ref = useReveal();

  useEffect(() => {
    const cached = localStorage.getItem("activeHeroVideo");
    if (cached) setHeroVideo(cached);
    api.get("/hero-videos/active")
      .then((json) => {
        if (json.data?.url) {
          setHeroVideo(json.data.url);
          localStorage.setItem("activeHeroVideo", json.data.url);
        }
      })
      .catch(err => console.error("[HomePage] 영상 로드 실패:", err));
  }, []);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "activeHeroVideo" && e.newValue) setHeroVideo(e.newValue);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return (
    <div ref={ref}>
      {/* ==================== HERO ==================== */}
      <section
        className="relative flex items-center justify-center overflow-hidden"
        style={{ height: "100vh", minHeight: 700 }}
      >
        <video
          key={heroVideo}
          autoPlay muted loop playsInline
          src={heroVideo}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "brightness(0.7) contrast(1.15) saturate(0.9)" }}
        />
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.5) 100%)" }} />

        <div className="relative text-center" style={{ maxWidth: 720, padding: "0 24px", zIndex: 2 }}>
          <div className="sep mx-auto reveal" style={{ marginBottom: 48 }} />
          <h1
            className="font-serif reveal"
            style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 300, letterSpacing: "0.2em", color: "#fff", marginBottom: 14, lineHeight: 1.2 }}
          >
            윤정 법률사무소
          </h1>
          <p className="font-en reveal" style={{ fontSize: "0.85rem", letterSpacing: "0.3em", color: "rgba(255,255,255,0.4)", marginBottom: 44, fontWeight: 400 }}>
            YOUNJEONG LAW OFFICE
          </p>
          <p className="font-serif-kr reveal" style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.9, marginBottom: 52, fontWeight: 300 }}>
            진실된 마음으로 의뢰인의 목소리에 귀를 기울이며,{"\n"}최선의 법률적 해법을 제시합니다
          </p>

          <div className="flex gap-4 justify-center flex-wrap reveal">
            <Link
              to="/consultation"
              className="view-more"
              style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)", padding: "14px 36px", fontSize: 14, letterSpacing: "0.1em" }}
            >
              상담 신청
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              to="/practice"
              className="view-more"
              style={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.15)", padding: "14px 36px", fontSize: 14, letterSpacing: "0.1em" }}
            >
              업무분야 보기
            </Link>
          </div>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3" style={{ zIndex: 2 }}>
          <span className="font-en" style={{ fontSize: 9, letterSpacing: "0.25em", color: "rgba(255,255,255,0.25)" }}>SCROLL DOWN</span>
          <div className="scroll-anim">
            <svg width="14" height="22" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" viewBox="0 0 14 22">
              <rect x="1" y="1" width="12" height="20" rx="6" />
              <line x1="7" y1="5" x2="7" y2="9" />
            </svg>
          </div>
        </div>
      </section>

      {/* ==================== Gradient ==================== */}
      <div style={{ height: 120, background: "linear-gradient(to bottom, #0a0a0a, #faf9f7)" }} />

      {/* ==================== 핵심 지표 ==================== */}
      <section className="section" style={{ background: "#fff" }}>
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 stagger" style={{ marginBottom: 72 }}>
            {STATS.map((s) => (
              <div key={s.label} className="reveal text-center" style={{ padding: "28px 20px", background: "#f9f9f8", border: "1px solid rgba(0,0,0,0.06)" }}>
                <p style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</p>
                <p className="font-en" style={{ fontSize: "clamp(1.8rem, 3vw, 2.4rem)", fontWeight: 300, color: "var(--accent-gold)" }}>{s.value}</p>
                <p style={{ fontSize: 13, color: "#999", marginTop: 4, fontWeight: 300 }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* 윤정의 접근 방식 */}
          <div className="reveal text-center" style={{ marginBottom: 48 }}>
            <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.25em", color: "var(--accent-gold)", marginBottom: 14 }}>OUR APPROACH</p>
            <h2 className="font-serif" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 300, color: "#1a1a1a", marginBottom: 16 }}>
              명확한 전략, 빠른 실행, 책임 있는 결과
            </h2>
            <p style={{ fontSize: 15, color: "#666", fontWeight: 300, maxWidth: 600, margin: "0 auto", lineHeight: 1.9 }}>
              윤정 법률사무소는 사건을 단순 처리하지 않습니다. 분쟁의 원인과 증거, 상대의 전략을 정밀 분석하여
              의뢰인에게 가장 실익이 큰 선택지를 제시합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger" style={{ marginBottom: 48 }}>
            {HIGHLIGHTS.map((h, i) => (
              <div key={i} className="reveal" style={{ padding: "32px 28px", border: "1px solid rgba(0,0,0,0.06)", background: "#fafaf9" }}>
                <h3 style={{ fontSize: 17, fontWeight: 500, color: "#1a1a1a", marginBottom: 12 }}>{h.title}</h3>
                <p style={{ fontSize: 14, color: "#666", lineHeight: 1.8, fontWeight: 300 }}>{h.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="reveal text-center" style={{ padding: "48px 0" }}>
            <p style={{ fontSize: 18, color: "#1a1a1a", fontWeight: 300, marginBottom: 24 }}>
              법률 문제로 고민이 있으신가요?
            </p>
            <Link
              to="/consultation"
              className="inline-block font-en transition-all duration-300 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]"
              style={{ border: "1px solid rgba(0,0,0,0.15)", color: "#1a1a1a", padding: "14px 44px", fontSize: 14, letterSpacing: "0.15em", textDecoration: "none" }}
            >
              상담 예약하기 →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
