/**
 * 업무분야 개요 페이지 — 건설·부동산 전문 로펌 소개 + 각 상세 페이지 연결
 * 의뢰인 고민 공감 → 성공 사례 → 전문성 차별화 → 분야 선택
 */
import { Link } from "react-router-dom";
import {
  Building2, Home, ArrowRight, Phone, ChevronRight,
  AlertTriangle, CheckCircle2, Shield, Clock, Users, Target,
} from "lucide-react";
import useReveal from "../hooks/useReveal";

/* ── 의뢰인 고민 ── */
const PAIN_POINTS = [
  { icon: AlertTriangle, text: "공사대금을 받지 못해 자금난에 처해 있다" },
  { icon: AlertTriangle, text: "재개발 조합에서 불합리한 결정을 통보받았다" },
  { icon: AlertTriangle, text: "하자보수 책임을 둘러싼 분쟁이 장기화되고 있다" },
  { icon: AlertTriangle, text: "건축허가가 반려되어 사업이 중단될 위기다" },
  { icon: AlertTriangle, text: "부동산 매매 후 예상치 못한 법적 문제가 발생했다" },
  { icon: AlertTriangle, text: "임차인과의 분쟁으로 건물 관리가 어려워졌다" },
];

/* ── 핵심 성공 사례 ── */
const CASE_RESULTS = [
  { amount: "47억", unit: "원", label: "공사대금 청구 전액 인용", category: "건설 소송" },
  { amount: "40%", unit: "증액", label: "토지수용 보상금 증액 달성", category: "부동산" },
  { amount: "98%", unit: "승소", label: "하자보수 손해배상 청구 승소", category: "건설 분쟁" },
  { amount: "3개월", unit: "해결", label: "재개발 인가취소 소송 승소", category: "재개발" },
];

/* ── 전문 로펌 차별점 ── */
const ADVANTAGES = [
  {
    icon: Target,
    title: "건설·부동산만 집중합니다",
    desc: "모든 분야를 조금씩 다루는 것이 아닌, 건설·부동산 분야만을 깊이 파고들어 축적한 전문성으로 승소 가능성을 높입니다.",
  },
  {
    icon: Shield,
    title: "현장을 이해하는 변호사",
    desc: "계약서의 법률 용어뿐 아니라, 공사 현장의 기술적 쟁점까지 이해하여 실질적이고 현실적인 법률 전략을 수립합니다.",
  },
  {
    icon: Clock,
    title: "신속한 초기 대응",
    desc: "건설·부동산 분쟁은 시간이 곧 비용입니다. 초기 상담 후 48시간 내 사건 분석과 전략 보고서를 제공합니다.",
  },
  {
    icon: Users,
    title: "원스톱 법률 서비스",
    desc: "계약 자문부터 소송, 중재, 행정쟁송까지 하나의 팀이 일관되게 처리하여 사건의 연속성과 효율을 보장합니다.",
  },
];

/* ── 분야 카드 ── */
const AREAS = [
  {
    to: "/practice/construction",
    image: "/construction-hero3.jpg",
    label: "CONSTRUCTION LAW",
    title: "건설 법률",
    desc: "공사도급계약, 클레임, 하자분쟁, 건설중재 등 건설 프로젝트 전 과정의 법률 서비스",
    highlights: ["공사대금·클레임 분쟁", "건설계약 검토·자문", "건설 행정·인허가", "국제 건설 중재"],
  },
  {
    to: "/practice/realestate",
    image: "/realestate-hero.jpg",
    label: "REAL ESTATE LAW",
    title: "부동산 법률",
    desc: "부동산 개발 인허가, 재개발·재건축, 거래·투자, 임대차 분쟁 등 부동산 전 분야의 법률 서비스",
    highlights: ["개발사업 법률자문·소송", "재개발·재건축 사업", "부동산 매매·투자", "임대차·등기·수용"],
  },
];

export default function PracticePage() {
  const ref = useReveal();

  return (
    <div ref={ref}>
      {/* ━━━ 히어로 ━━━ */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{ height: "80vh", minHeight: 600 }}>
        <div className="absolute inset-0" style={{ backgroundImage: "url(/construction-hero3.jpg)", backgroundSize: "cover", backgroundPosition: "center 30%" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(10,15,20,0.90) 0%, rgba(17,29,42,0.80) 40%, rgba(22,36,51,0.82) 70%, rgba(13,21,32,0.92) 100%)" }} />
        <div className="absolute bottom-0 left-0 right-0" style={{ height: 120, background: "linear-gradient(to top, #fff, transparent)" }} />

        <div className="relative text-center" style={{ maxWidth: 750, padding: "0 24px", zIndex: 2 }}>
          <div className="reveal" style={{ marginBottom: 28 }}>
            <span className="font-en inline-block" style={{ fontSize: 11, letterSpacing: "0.35em", color: "var(--accent-gold)", borderBottom: "1px solid rgba(176,141,87,0.4)", paddingBottom: 8 }}>
              CONSTRUCTION & REAL ESTATE LAW FIRM
            </span>
          </div>
          <h1 className="font-serif-kr reveal" style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 300, color: "#fff", lineHeight: 1.4, marginBottom: 20 }}>
            건설·부동산 분쟁,
            <br /><span style={{ color: "var(--accent-gold)", fontWeight: 500 }}>결과</span>로 증명합니다
          </h1>
          <p className="reveal" style={{ fontSize: 15, color: "var(--white-60)", lineHeight: 1.9, fontWeight: 300, maxWidth: 520, margin: "0 auto 36px" }}>
            공사 현장부터 법정까지, 건설·부동산만 파고든 전문성으로
            <br />의뢰인의 권리와 이익을 지켜드립니다
          </p>
          <div className="reveal flex flex-wrap justify-center gap-3">
            <Link to="/consultation" className="inline-flex items-center gap-2 transition-all duration-300 hover:opacity-90" style={{ background: "var(--accent-gold)", color: "#fff", padding: "15px 36px", fontSize: 14, fontWeight: 500 }}>
              <Phone size={15} /> 무료 상담 예약
            </Link>
            <a href="tel:02-594-5583" className="inline-flex items-center gap-2 transition-all duration-300 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]" style={{ border: "1px solid var(--white-15)", color: "var(--white-40)", padding: "15px 36px", fontSize: 14 }}>
              02-594-5583
            </a>
          </div>
        </div>
      </section>

      {/* ━━━ 성공 사례 숫자 (히어로 바로 아래, 임팩트) ━━━ */}
      <section style={{ background: "#fff", padding: "0 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", transform: "translateY(-48px)" }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 reveal" style={{ background: "var(--bg-dark)", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            {CASE_RESULTS.map((r, i) => (
              <div key={i} className="text-center" style={{ padding: "32px 16px", borderRight: i < 3 ? "1px solid var(--white-08)" : "none" }}>
                <p className="font-en" style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--accent-gold)", marginBottom: 8 }}>{r.category}</p>
                <p className="font-serif" style={{ fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 500, color: "#fff", lineHeight: 1 }}>
                  {r.amount}<span style={{ fontSize: "0.5em", fontWeight: 300, color: "var(--white-60)" }}> {r.unit}</span>
                </p>
                <p style={{ fontSize: 12, color: "var(--white-40)", marginTop: 6 }}>{r.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ 의뢰인 고민 공감 ━━━ */}
      <section style={{ background: "#fff", padding: "40px 24px 80px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div className="text-center reveal" style={{ marginBottom: 48 }}>
            <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.4rem, 3vw, 1.9rem)", fontWeight: 400, color: "var(--text-primary)", lineHeight: 1.5 }}>
              이런 문제로 고민하고 계신가요?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
            {PAIN_POINTS.map((p, i) => (
              <div key={i} className="reveal flex items-center gap-4" style={{ padding: "18px 24px", background: "var(--bg-primary)", borderLeft: "3px solid var(--accent-gold)" }}>
                <p style={{ fontSize: 14, color: "var(--gray-600)", fontWeight: 400, lineHeight: 1.6 }}>"{p.text}"</p>
              </div>
            ))}
          </div>
          <p className="text-center reveal" style={{ marginTop: 32, fontSize: 15, color: "var(--accent-gold)", fontWeight: 500 }}>
            윤정 법률사무소는 이 모든 문제의 해결책을 갖고 있습니다.
          </p>
        </div>
      </section>

      {/* ━━━ 왜 전문 로펌인가 ━━━ */}
      <section style={{ background: "var(--bg-primary)", padding: "var(--section-py) 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="text-center reveal" style={{ marginBottom: 56 }}>
            <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.3em", color: "var(--accent-gold)", marginBottom: 12 }}>WHY SPECIALIST</p>
            <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.4rem, 3vw, 1.9rem)", fontWeight: 400, color: "var(--text-primary)" }}>
              왜 건설·부동산 <em style={{ fontStyle: "normal", color: "var(--accent-gold)" }}>전문</em> 로펌이어야 하는가
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger">
            {ADVANTAGES.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className="reveal flex gap-5" style={{ padding: "32px 28px", background: "#fff", border: "1px solid var(--border-subtle)" }}>
                  <div style={{ width: 52, height: 52, background: "var(--accent-gold-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={24} strokeWidth={1.5} color="var(--accent-gold)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>{a.title}</h3>
                    <p style={{ fontSize: 13.5, color: "var(--gray-500)", lineHeight: 1.8, fontWeight: 300 }}>{a.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ━━━ 분야 선택 카드 ━━━ */}
      <section style={{ background: "#fff", padding: "var(--section-py) 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="text-center reveal" style={{ marginBottom: 56 }}>
            <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.3em", color: "var(--accent-gold)", marginBottom: 12 }}>PRACTICE AREAS</p>
            <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.4rem, 3vw, 1.9rem)", fontWeight: 400, color: "var(--text-primary)" }}>
              전문 분야를 선택하세요
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 stagger">
            {AREAS.map((area, i) => (
              <Link key={i} to={area.to} className="reveal group block" style={{ textDecoration: "none", overflow: "hidden", border: "1px solid var(--border-subtle)", transition: "all 0.4s ease", boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}>
                <div className="relative overflow-hidden" style={{ height: 260 }}>
                  <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${area.image})`, backgroundSize: "cover", backgroundPosition: "center" }} />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.55) 100%)" }} />
                  <div className="absolute bottom-0 left-0 right-0" style={{ padding: "28px 28px" }}>
                    <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.3em", color: "var(--accent-gold)", marginBottom: 6 }}>{area.label}</p>
                    <h2 className="font-serif-kr" style={{ fontSize: 28, fontWeight: 500, color: "#fff" }}>{area.title}</h2>
                  </div>
                </div>
                <div style={{ padding: "28px 28px 32px" }}>
                  <p style={{ fontSize: 14, color: "var(--gray-500)", lineHeight: 1.8, fontWeight: 300, marginBottom: 20 }}>{area.desc}</p>
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px" }}>
                    {area.highlights.map((h, j) => (
                      <li key={j} className="flex items-center gap-2" style={{ fontSize: 13.5, color: "var(--gray-600)", padding: "5px 0" }}>
                        <CheckCircle2 size={14} color="var(--accent-gold)" strokeWidth={2} />{h}
                      </li>
                    ))}
                  </ul>
                  <span className="inline-flex items-center gap-2 font-en transition-all duration-300 group-hover:gap-3" style={{ fontSize: 12, letterSpacing: "0.12em", color: "var(--accent-gold)" }}>
                    자세히 보기 <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ CTA ━━━ */}
      <section style={{ background: "linear-gradient(160deg, #0f1923 0%, #1a2a3a 100%)", padding: "80px 24px" }}>
        <div className="text-center reveal" style={{ maxWidth: 600, margin: "0 auto" }}>
          <div className="sep mx-auto" style={{ marginBottom: 32 }} />
          <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.4rem, 3vw, 1.9rem)", fontWeight: 300, color: "#fff", marginBottom: 16, lineHeight: 1.5 }}>
            분쟁은 시간이 지날수록 불리해집니다
          </h2>
          <p style={{ fontSize: 15, color: "var(--white-60)", lineHeight: 1.8, fontWeight: 300, marginBottom: 12 }}>
            초기 대응이 사건의 결과를 결정합니다.
          </p>
          <p style={{ fontSize: 14, color: "var(--white-40)", lineHeight: 1.8, fontWeight: 300, marginBottom: 36 }}>
            상담은 무료이며, 48시간 내 사건 분석 보고서를 제공해드립니다.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/consultation" className="inline-flex items-center gap-2 transition-all duration-300 hover:opacity-90" style={{ background: "var(--accent-gold)", color: "#fff", padding: "16px 40px", fontSize: 15, fontWeight: 600 }}>
              <Phone size={16} /> 지금 무료 상담받기
            </Link>
            <a href="tel:02-594-5583" className="inline-flex items-center gap-2 transition-all duration-300 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]" style={{ border: "1px solid var(--white-15)", color: "var(--white-40)", padding: "16px 40px", fontSize: 15 }}>
              02-594-5583
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
