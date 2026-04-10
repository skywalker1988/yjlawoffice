/** 상담안내 페이지 히어로 배너 + 핵심 지표 섹션 */
import { STATS } from "./consultationConstants";

const HERO_MIN_HEIGHT = 400;

export default function ConsultationHero() {
  return (
    <>
      {/* 히어로 배너 */}
      <section
        className="relative flex items-center justify-center"
        style={{
          height: "60vh",
          minHeight: HERO_MIN_HEIGHT,
          background: "linear-gradient(135deg, var(--bg-dark) 0%, var(--bg-dark-alt, #1a2332) 50%, var(--bg-dark) 100%)",
        }}
      >
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.3)" }} />
        <div className="relative text-center" style={{ maxWidth: 700, padding: "0 24px", zIndex: 2 }}>
          <div className="sep mx-auto reveal" style={{ marginBottom: 40 }} />
          <h1
            className="font-serif reveal"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 300, letterSpacing: "0.2em", color: "#fff", marginBottom: 16 }}
          >
            상담안내
          </h1>
          <p className="font-en reveal" style={{ fontSize: 13, letterSpacing: "0.3em", color: "var(--white-40)", marginBottom: 24 }}>
            CONSULTATION
          </p>
          <p className="reveal" style={{ fontSize: 15, color: "var(--white-60)", fontWeight: 300, lineHeight: 1.9 }}>
            사건의 핵심을 파악하여 명확한 해결책을 제시해 드립니다
          </p>
        </div>
      </section>

      {/* 핵심 지표 */}
      <section style={{ background: "#fff", borderBottom: "1px solid var(--border-subtle)" }}>
        <div className="container" style={{ paddingTop: 48, paddingBottom: 48 }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 stagger">
            {STATS.map((s, i) => (
              <div key={i} className="reveal text-center" style={{ padding: "24px 16px" }}>
                <p className="font-en" style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 300, color: "var(--accent-gold)", marginBottom: 8 }}>
                  {s.value}
                </p>
                <p style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 300 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
