/** 사무소 소개 페이지 — 윤정 법률사무소 개요, 핵심 가치, 연혁 */
import useReveal from "../hooks/useReveal";

const VALUES = [
  {
    title: "신뢰",
    subtitle: "TRUST",
    desc: "진행 상황을 투명하게 공유하고 의사결정의 모든 과정에 의뢰인을 참여시킵니다.",
    icon: "🤝",
  },
  {
    title: "전문성",
    subtitle: "EXPERTISE",
    desc: "민사·형사·가사·행정·조세 등 다양한 분야에서 실무 경험을 축적했습니다.",
    icon: "⚖️",
  },
  {
    title: "헌신",
    subtitle: "DEDICATION",
    desc: "의뢰인의 사건을 비즈니스처럼 정교하게 관리하며, 최선의 결론을 만들기 위해 함께합니다.",
    icon: "🏛️",
  },
  {
    title: "혁신",
    subtitle: "INNOVATION",
    desc: "법률 기술과 데이터 분석을 활용한 선진적 법률 서비스를 지향합니다.",
    icon: "💡",
  },
];

const HISTORY_ITEMS = [
  { year: "2020", text: "윤정 법률사무소 설립" },
  { year: "2021", text: "기업자문 전담팀 구성" },
  { year: "2022", text: "행정소송 전문 분야 확대" },
  { year: "2023", text: "법률 AI 시스템 도입" },
  { year: "2024", text: "지식관리 플랫폼 구축" },
  { year: "2025", text: "디지털 법률 서비스 고도화" },
];

export default function AboutPage() {
  const ref = useReveal();

  return (
    <div ref={ref}>
      {/* ==================== 히어로 ==================== */}
      <section
        className="relative flex items-center justify-center"
        style={{
          height: "60vh",
          minHeight: 400,
          background: "linear-gradient(135deg, #0f1923 0%, #1a2332 50%, #0f1923 100%)",
        }}
      >
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.3)" }} />
        <div className="relative text-center" style={{ maxWidth: 700, padding: "0 24px", zIndex: 2 }}>
          <div className="sep mx-auto reveal" style={{ marginBottom: 40 }} />
          <h1
            className="font-serif reveal"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 300, letterSpacing: "0.2em", color: "#fff", marginBottom: 16 }}
          >
            사무소 소개
          </h1>
          <p className="font-en reveal" style={{ fontSize: 13, letterSpacing: "0.3em", color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
            ABOUT YOUNJEONG LAW OFFICE
          </p>
          <p className="reveal" style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", fontWeight: 300, lineHeight: 1.9 }}>
            진실된 마음으로 의뢰인의 목소리에 귀를 기울이며,<br />최선의 법률적 해법을 제시합니다.
          </p>
        </div>
      </section>

      {/* ==================== 소개 문구 ==================== */}
      <section className="section" style={{ background: "#fff" }}>
        <div className="container" style={{ maxWidth: 800 }}>
          <div className="text-center reveal" style={{ marginBottom: 64 }}>
            <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.25em", color: "var(--accent-gold)", marginBottom: 20 }}>
              OUR PHILOSOPHY
            </p>
            <h2 className="font-serif" style={{ fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 300, color: "#1a1a1a", lineHeight: 1.8, marginBottom: 24 }}>
              신뢰를 기반으로<br />결과를 만드는 로펌
            </h2>
            <p style={{ fontSize: 15, color: "#666", lineHeight: 2, fontWeight: 300 }}>
              윤정 법률사무소는 의뢰인의 사건을 비즈니스처럼 정교하게 관리합니다.
              첫 상담부터 판결 이후까지, 리스크를 줄이고 최선의 결론을 만들기 위해 함께합니다.
            </p>
          </div>

          {/* 핵심 가치 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger" style={{ marginBottom: 80 }}>
            {VALUES.map((v, i) => (
              <div
                key={i}
                className="reveal"
                style={{ padding: "36px 32px", border: "1px solid rgba(0,0,0,0.06)", background: "#fafaf9" }}
              >
                <p style={{ fontSize: 32, marginBottom: 12 }}>{v.icon}</p>
                <h3 style={{ fontSize: 18, fontWeight: 500, color: "#1a1a1a", marginBottom: 4 }}>{v.title}</h3>
                <p className="font-en" style={{ fontSize: 10, letterSpacing: "0.2em", color: "#bbb", marginBottom: 16 }}>{v.subtitle}</p>
                <p style={{ fontSize: 14, color: "#666", lineHeight: 1.8, fontWeight: 300 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 연혁 ==================== */}
      <section style={{ background: "#f9f9f8", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="container" style={{ paddingTop: 80, paddingBottom: 80, maxWidth: 800 }}>
          <div className="text-center reveal" style={{ marginBottom: 48 }}>
            <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.25em", color: "var(--accent-gold)", marginBottom: 14 }}>
              HISTORY
            </p>
            <h2 className="font-serif" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", fontWeight: 300, color: "#1a1a1a" }}>
              사무소 연혁
            </h2>
          </div>
          <div style={{ maxWidth: 500, margin: "0 auto" }}>
            {HISTORY_ITEMS.map((item, i) => (
              <div
                key={i}
                className="reveal flex items-start gap-6"
                style={{ padding: "20px 0", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
              >
                <span className="font-en" style={{ fontSize: 18, fontWeight: 300, color: "var(--accent-gold)", minWidth: 60 }}>
                  {item.year}
                </span>
                <span style={{ fontSize: 15, color: "#444", fontWeight: 300, paddingTop: 2 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
