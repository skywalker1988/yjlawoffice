/** 업무분야 페이지 — 윤정 법률사무소 주요 업무 영역 소개 */
import { Link } from "react-router-dom";
import useReveal from "../hooks/useReveal";

const PRACTICES = [
  {
    icon: "⚖️",
    title: "민사 소송",
    subtitle: "CIVIL LITIGATION",
    desc: "손해배상, 계약 분쟁, 부동산, 채권추심 등 민사 전반에 걸친 소송 대리 및 자문 서비스를 제공합니다.",
    details: ["손해배상 청구", "계약 분쟁 해결", "부동산 관련 소송", "채권추심 및 강제집행"],
  },
  {
    icon: "🔒",
    title: "형사 변호",
    subtitle: "CRIMINAL DEFENSE",
    desc: "수사 단계부터 재판까지 의뢰인의 권리를 보호하며, 최선의 변호를 제공합니다.",
    details: ["수사 단계 변호", "공판 변호", "피해자 대리", "범죄 피해 구제"],
  },
  {
    icon: "👨‍👩‍👧",
    title: "가사 법률",
    subtitle: "FAMILY LAW",
    desc: "이혼, 상속, 양육권 등 가사 분야에서 의뢰인의 권익을 세심하게 보호합니다.",
    details: ["이혼 소송 및 조정", "재산분할", "양육권·면접교섭", "상속·유언"],
  },
  {
    icon: "🏢",
    title: "기업 법무",
    subtitle: "CORPORATE LAW",
    desc: "기업의 설립부터 운영, M&A까지 기업 활동 전반에 대한 법률 자문을 제공합니다.",
    details: ["기업 설립 및 구조조정", "M&A 자문", "계약서 검토 및 작성", "컴플라이언스"],
  },
  {
    icon: "🏛️",
    title: "행정 소송",
    subtitle: "ADMINISTRATIVE LAW",
    desc: "행정처분 취소, 인허가 쟁송, 국가배상 등 행정법 분야의 전문 법률 서비스를 제공합니다.",
    details: ["행정처분 취소소송", "인허가 관련 쟁송", "국가배상 청구", "공법상 당사자소송"],
  },
  {
    icon: "💰",
    title: "조세 법률",
    subtitle: "TAX LAW",
    desc: "세무 조사 대응, 조세 불복, 세금 관련 분쟁 해결 등 조세 분야 법률 서비스를 제공합니다.",
    details: ["세무 조사 대응", "조세 불복 심판·소송", "세금 관련 분쟁", "절세 컨설팅"],
  },
  {
    icon: "🏠",
    title: "부동산",
    subtitle: "REAL ESTATE",
    desc: "부동산 거래, 임대차, 재개발·재건축 등 부동산 관련 법률 서비스를 제공합니다.",
    details: ["매매·임대차 분쟁", "재개발·재건축", "등기 관련 소송", "건축 분쟁"],
  },
  {
    icon: "📝",
    title: "계약서 작성·검토",
    subtitle: "CONTRACT REVIEW",
    desc: "각종 계약서의 작성, 검토, 수정을 통해 법적 리스크를 사전에 차단합니다.",
    details: ["계약서 작성·검토", "약관 검토", "MOU 작성", "국제 계약"],
  },
  {
    icon: "📮",
    title: "내용증명",
    subtitle: "CERTIFIED MAIL",
    desc: "채권 추심, 계약 해지 등 법적 효력이 있는 내용증명 작성 및 발송을 대행합니다.",
    details: ["채권 추심 내용증명", "계약 해지 통보", "권리 주장 서면", "답변서 작성"],
  },
  {
    icon: "🤝",
    title: "합의 대행",
    subtitle: "SETTLEMENT NEGOTIATION",
    desc: "소송 전 합의 및 협상을 통해 의뢰인에게 최적의 결과를 도출합니다.",
    details: ["소송 전 합의 대행", "손해배상 협상", "분쟁 조정", "화해 절차"],
  },
  {
    icon: "💼",
    title: "종합 법률상담",
    subtitle: "GENERAL CONSULTATION",
    desc: "다양한 법률 문제에 대한 종합적인 상담 및 자문 서비스를 제공합니다.",
    details: ["초기 법률 상담", "법률 의견서 작성", "리스크 진단", "분쟁 예방 자문"],
  },
];

export default function PracticePage() {
  const ref = useReveal();

  return (
    <div ref={ref}>
      {/* 히어로 */}
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
            업무분야
          </h1>
          <p className="font-en reveal" style={{ fontSize: 13, letterSpacing: "0.3em", color: "rgba(255,255,255,0.4)" }}>
            PRACTICE AREAS
          </p>
        </div>
      </section>

      {/* 업무분야 목록 */}
      <section className="section" style={{ background: "#fff" }}>
        <div className="container" style={{ maxWidth: 960 }}>
          <div className="text-center reveal" style={{ marginBottom: 64 }}>
            <p style={{ fontSize: 15, color: "#666", lineHeight: 2, fontWeight: 300, maxWidth: 600, margin: "0 auto" }}>
              윤정 법률사무소는 다양한 법률 분야에서 축적된 경험과 전문성을 바탕으로
              의뢰인에게 최적의 법률 솔루션을 제공합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 stagger">
            {PRACTICES.map((p, i) => (
              <div
                key={i}
                className="reveal group"
                style={{
                  padding: "40px 32px",
                  border: "1px solid rgba(0,0,0,0.06)",
                  background: "#fafaf9",
                  transition: "all 0.3s",
                }}
              >
                <div className="flex items-center gap-4" style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 36 }}>{p.icon}</span>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 500, color: "#1a1a1a" }}>{p.title}</h3>
                    <p className="font-en" style={{ fontSize: 10, letterSpacing: "0.2em", color: "#bbb" }}>{p.subtitle}</p>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: "#666", lineHeight: 1.9, fontWeight: 300, marginBottom: 20 }}>
                  {p.desc}
                </p>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {p.details.map((d, j) => (
                    <li
                      key={j}
                      style={{
                        fontSize: 13,
                        color: "#888",
                        padding: "6px 0",
                        borderTop: j === 0 ? "1px solid rgba(0,0,0,0.06)" : "none",
                        borderBottom: "1px solid rgba(0,0,0,0.04)",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <span style={{ color: "var(--accent-gold)", fontSize: 10 }}>●</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center reveal" style={{ marginTop: 80 }}>
            <p style={{ fontSize: 15, color: "#666", marginBottom: 24, fontWeight: 300 }}>
              법률 문제로 고민이 있으신가요?
            </p>
            <Link
              to="/consultation"
              className="inline-block font-en transition-all duration-300 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]"
              style={{
                border: "1px solid rgba(0,0,0,0.15)",
                color: "#1a1a1a",
                padding: "14px 40px",
                fontSize: 13,
                letterSpacing: "0.15em",
                textDecoration: "none",
              }}
            >
              상담 예약하기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
