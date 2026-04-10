/**
 * 부동산 법률 전문 페이지 — 재개발·재건축, 거래·투자, 임대차, 등기·수용
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Landmark, FileCheck, Home, MapPin, ChevronRight, CheckCircle2,
  ArrowRight, Phone, Quote, Scale, TrendingUp, Award, Users,
} from "lucide-react";
import useReveal from "../hooks/useReveal";

/* ── 부동산 사업 단계 3단계 ── */
const LIFECYCLE = [
  {
    phase: "01",
    title: "개발·인허가 단계",
    subtitle: "DEVELOPMENT & PERMITS",
    desc: "부동산 개발 사업의 법적 기반을 구축하고, 인허가 과정에서 발생하는 행정 쟁송을 대리합니다.",
    services: [
      "개발사업 인허가 자문·행정소송 대리",
      "재개발·재건축 조합 설립·인가 쟁송",
      "개발행위허가·지구단위계획 취소소송",
      "시행사·시공사 간 법률관계 자문",
      "PF·프로젝트 파이낸싱 법률 검토",
      "환경영향평가·토지이용규제 대응",
    ],
  },
  {
    phase: "02",
    title: "운영·관리 단계",
    subtitle: "MANAGEMENT & OPERATIONS",
    desc: "부동산 운영 과정에서 발생하는 법률 이슈에 대응합니다.",
    services: [
      "상가·주택 임대차 계약 관리",
      "임차인 분쟁 해결·명도",
      "관리비·수선 분쟁",
      "공유물 분할·공동소유 분쟁",
      "부동산 신탁·자산 관리",
      "건물 하자 보수 청구",
    ],
  },
  {
    phase: "03",
    title: "처분·분쟁해결 단계",
    subtitle: "DISPOSITION & DISPUTES",
    desc: "부동산 처분과 권리 분쟁을 법적으로 해결합니다.",
    services: [
      "매매 관련 분쟁·계약 해제",
      "등기 말소·회복 소송",
      "명의신탁 분쟁 해결",
      "경매·공매 대리",
      "토지수용·보상 분쟁",
      "부동산 관련 형사 사건",
    ],
  },
];

/* ── 부동산 서브 프랙티스 ── */
const PRACTICES = [
  {
    icon: Landmark,
    title: "재개발·재건축",
    subtitle: "URBAN REDEVELOPMENT",
    desc: "조합 설립부터 관리처분, 이전고시까지 정비사업 전 과정의 법률 자문을 수행합니다.",
    details: ["조합 설립·운영 자문", "관리처분계획 인가", "시행인가·사업시행계획", "분양 관련 법률 자문", "조합원 분쟁 해결", "도정법·도시개발법 쟁송"],
  },
  {
    icon: FileCheck,
    title: "부동산 거래·투자",
    subtitle: "TRANSACTIONS & INVESTMENT",
    desc: "매매, 경매, 투자 구조 설계 등 부동산 거래 전반의 법적 안전성을 확보합니다.",
    details: ["매매 계약 검토·체결", "부동산 경매·공매 대리", "부동산 투자 구조 자문", "PF·프로젝트 파이낸싱", "부동산 실사(Due Diligence)", "분양권·입주권 거래"],
  },
  {
    icon: Home,
    title: "임대차·관리",
    subtitle: "LEASING & MANAGEMENT",
    desc: "상가·주택 임대차 관련 분쟁부터 건물 관리 이슈까지 종합적으로 해결합니다.",
    details: ["상가 임대차 보호법 자문", "주택 임대차 분쟁", "보증금 반환 청구", "명도 소송·강제집행", "관리비 분쟁 해결", "전월세 분쟁 조정"],
  },
  {
    icon: MapPin,
    title: "등기·수용·보상",
    subtitle: "REGISTRATION & COMPENSATION",
    desc: "소유권 분쟁, 토지수용, 보상금 산정 등 권리 보전과 재산 보호를 전문적으로 수행합니다.",
    details: ["등기 말소·회복 소송", "소유권·용익물권 분쟁", "토지수용 재결 불복", "보상금 증액 소송", "명의신탁 해지·반환", "경계·면적 분쟁"],
  },
];

/* ── 실적 수치 ── */
const STATS = [
  { value: "200+", label: "부동산 사건 수행", icon: Scale },
  { value: "95%", label: "클라이언트 만족도", icon: TrendingUp },
  { value: "150억+", label: "누적 부동산 분쟁 규모", icon: Award },
  { value: "10년+", label: "부동산 분야 전문 경력", icon: Users },
];

/* ── 주요 실적 ── */
const TRACK_RECORDS = [
  { category: "재개발", text: "도시정비사업 시행인가 취소 소송 — 조합원 권익 보호 승소" },
  { category: "임대차", text: "대규모 상업시설 임대차 분쟁 — 임차인 권리 보전 성공" },
  { category: "매매분쟁", text: "수십억 원 규모 부동산 매매 계약 해제 소송 — 매수인 승소" },
  { category: "토지수용", text: "공공사업 토지수용 보상금 증액 소송 — 감정가 대비 40% 증액" },
  { category: "등기분쟁", text: "부동산 명의신탁 해지 및 소유권 이전등기 청구 — 전부 인용" },
  { category: "경매", text: "상가건물 경매 절차 대리 — 배당이의 소송 승소" },
];

/* ── 성공 사례 카드 ── */
const CASE_RESULTS = [
  { amount: "40%", unit: "증액", label: "토지수용 보상금 증액", detail: "공익사업 토지수용에서 감정평가 전략으로 보상금 대폭 증액" },
  { amount: "38억", unit: "원", label: "매매 계약해제 승소", detail: "하자 있는 부동산 매매의 계약해제 및 손해배상 전부 인용" },
  { amount: "100%", unit: "인용", label: "명의신탁 소유권 회복", detail: "부동산 명의신탁 해지 및 소유권이전등기 청구 전부 인용" },
  { amount: "3개월", unit: "해결", label: "재개발 인가취소 승소", detail: "도시정비사업 시행인가 취소소송에서 조합원 권익 보호" },
];

/* ── 의뢰인 고민 ── */
const PAIN_POINTS = [
  "재개발 조합에서 불합리한 관리처분을 통보받았다",
  "부동산 매매 후 예상치 못한 하자가 발견되었다",
  "임차인이 보증금 반환을 거부하고 있다",
  "토지가 수용되는데 보상금이 너무 적다",
  "부동산 개발 인허가가 반려되어 사업이 중단되었다",
  "공유 부동산 지분 분쟁이 해결되지 않고 있다",
];

/* ── 추천 인용문 ── */
const TESTIMONIALS = [
  {
    quote: "재개발 조합 설립 과정에서 발생한 복잡한 법적 쟁점을 명쾌하게 정리해주어, 사업이 순조롭게 진행될 수 있었습니다.",
    author: "재개발 조합 이사",
  },
  {
    quote: "부동산 매매 계약서 검토에서 치명적인 리스크를 발견해주어 큰 손실을 피할 수 있었습니다. 부동산 전문이라는 것이 확실히 달랐습니다.",
    author: "부동산 투자법인 대표",
  },
];

export default function PracticeRealEstatePage() {
  const ref = useReveal();
  const [activePhase, setActivePhase] = useState(0);
  const [expandedIdx, setExpandedIdx] = useState(null);

  return (
    <div ref={ref}>
      {/* ━━━ 히어로 ━━━ */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{ height: "75vh", minHeight: 550 }}>
        <div className="absolute inset-0" style={{ backgroundImage: "url(/realestate-hero.jpg)", backgroundSize: "cover", backgroundPosition: "center 40%", backgroundRepeat: "no-repeat" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(10,15,20,0.87) 0%, rgba(17,29,42,0.76) 40%, rgba(22,36,51,0.80) 70%, rgba(13,21,32,0.90) 100%)" }} />
        <div className="absolute bottom-0 left-0 right-0" style={{ height: 150, background: "linear-gradient(to top, #fff, transparent)" }} />

        <div className="relative" style={{ maxWidth: 900, padding: "0 24px", zIndex: 2, width: "100%" }}>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div style={{ maxWidth: 560 }}>
              <div className="reveal flex items-center gap-2" style={{ marginBottom: 20 }}>
                <Link to="/practice" className="font-en" style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--white-40)", textDecoration: "none" }}>PRACTICE</Link>
                <ChevronRight size={12} color="var(--white-20)" />
                <span className="font-en" style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--accent-gold)" }}>REAL ESTATE</span>
              </div>

              <h1 className="font-serif-kr reveal" style={{ fontSize: "clamp(2.2rem, 5vw, 3.4rem)", fontWeight: 300, color: "#fff", lineHeight: 1.35, marginBottom: 24 }}>
                부동산 개발의
                <br /><span style={{ fontWeight: 500, color: "var(--accent-gold)" }}>법률 파트너</span>
              </h1>
              <p className="reveal" style={{ fontSize: 15, color: "var(--white-60)", lineHeight: 1.9, fontWeight: 300, marginBottom: 36 }}>
                부동산 개발의 인허가 단계부터 분양, 준공, 분쟁 해결까지—
                <br />개발 전 과정의 법률자문과 소송대리를 원스톱으로 제공합니다.
              </p>
              <div className="reveal flex flex-wrap gap-3">
                <Link to="/consultation" className="inline-flex items-center gap-2 transition-all duration-300 hover:opacity-90" style={{ background: "var(--accent-gold)", color: "#fff", padding: "15px 32px", fontSize: 14, fontWeight: 500 }}>
                  <Phone size={15} /> 상담 예약하기
                </Link>
                <a href="#lifecycle" className="inline-flex items-center gap-2 transition-all duration-300 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]" style={{ border: "1px solid var(--white-15)", color: "var(--white-40)", padding: "15px 32px", fontSize: 13, letterSpacing: "0.08em" }}>
                  서비스 알아보기 <ChevronRight size={14} />
                </a>
              </div>
            </div>

            <div className="hidden md:flex flex-col gap-6 reveal" style={{ paddingBottom: 8 }}>
              {STATS.slice(0, 3).map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div style={{ width: 36, height: 36, border: "1px solid var(--white-15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <s.icon size={16} color="var(--accent-gold)" />
                  </div>
                  <div>
                    <p className="font-serif" style={{ fontSize: 20, fontWeight: 500, color: "#fff", lineHeight: 1.2 }}>{s.value}</p>
                    <p style={{ fontSize: 11, color: "var(--white-40)" }}>{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ 성공 사례 카드 ━━━ */}
      <section className="hidden md:block" style={{ background: "#fff", padding: "0 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", transform: "translateY(-48px)" }}>
          <div className="grid grid-cols-4 gap-0 reveal" style={{ background: "var(--bg-dark)", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            {CASE_RESULTS.map((r, i) => (
              <div key={i} className="text-center" style={{ padding: "28px 16px", borderRight: i < 3 ? "1px solid var(--white-08)" : "none" }}>
                <p className="font-serif" style={{ fontSize: "clamp(24px, 3vw, 30px)", fontWeight: 500, color: "var(--accent-gold)", lineHeight: 1 }}>
                  {r.amount}{r.unit && <span style={{ fontSize: "0.5em", fontWeight: 300, color: "var(--white-60)" }}> {r.unit}</span>}
                </p>
                <p style={{ fontSize: 12.5, color: "var(--white-60)", marginTop: 6, fontWeight: 500 }}>{r.label}</p>
                <p style={{ fontSize: 11, color: "var(--white-40)", marginTop: 4, fontWeight: 300, lineHeight: 1.5 }}>{r.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ 의뢰인 고민 공감 ━━━ */}
      <section style={{ background: "#fff", padding: "40px 24px 80px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div className="text-center reveal" style={{ marginBottom: 40 }}>
            <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 400, color: "var(--text-primary)" }}>
              이런 문제로 고민하고 계신가요?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger">
            {PAIN_POINTS.map((p, i) => (
              <div key={i} className="reveal flex items-center gap-3" style={{ padding: "16px 20px", background: "var(--bg-primary)", borderLeft: "3px solid var(--accent-gold)" }}>
                <p style={{ fontSize: 14, color: "var(--gray-600)", fontWeight: 400, lineHeight: 1.6 }}>"{p}"</p>
              </div>
            ))}
          </div>
          <p className="text-center reveal" style={{ marginTop: 28, fontSize: 15, color: "var(--accent-gold)", fontWeight: 500 }}>
            부동산 분쟁은 초기 대응이 결과를 결정합니다. 지금 바로 상담하세요.
          </p>
        </div>
      </section>

      {/* ━━━ 모바일 통계 ━━━ */}
      <section className="md:hidden" style={{ background: "var(--bg-dark)", padding: "32px 24px" }}>
        <div className="grid grid-cols-2 gap-6">
          {STATS.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <s.icon size={18} color="var(--accent-gold)" />
              <div>
                <p className="font-serif" style={{ fontSize: 18, fontWeight: 500, color: "#fff" }}>{s.value}</p>
                <p style={{ fontSize: 11, color: "var(--white-40)" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━ 부동산 사업 라이프사이클 ━━━ */}
      <section id="lifecycle" style={{ background: "#fff", padding: "var(--section-py) 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="text-center reveal" style={{ marginBottom: 56 }}>
            <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.3em", color: "var(--accent-gold)", marginBottom: 12 }}>REAL ESTATE LIFECYCLE</p>
            <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 400, color: "var(--text-primary)" }}>
              개발 전 과정의 법률자문과 소송대리
            </h2>
            <p style={{ fontSize: 14, color: "var(--gray-400)", marginTop: 14, fontWeight: 300, maxWidth: 560, margin: "14px auto 0" }}>
              부동산 개발의 인허가부터 분양·준공·분쟁까지, 각 단계에서 법률자문과 소송대리를 제공합니다
            </p>
          </div>

          <div className="reveal flex justify-center gap-0" style={{ marginBottom: 48, borderBottom: "1px solid var(--border-subtle)" }}>
            {LIFECYCLE.map((p, i) => (
              <button key={i} onClick={() => setActivePhase(i)} className="font-en transition-all duration-300" style={{ padding: "16px 32px", fontSize: 12, letterSpacing: "0.12em", color: activePhase === i ? "var(--accent-gold)" : "var(--gray-300)", fontWeight: activePhase === i ? 600 : 400, borderBottom: activePhase === i ? "2px solid var(--accent-gold)" : "2px solid transparent", background: "transparent", cursor: "pointer", whiteSpace: "nowrap" }}>
                <span style={{ marginRight: 8, fontWeight: 300 }}>{p.phase}</span>{p.subtitle}
              </button>
            ))}
          </div>

          <div className="reveal" style={{ maxWidth: 800, margin: "0 auto" }}>
            {LIFECYCLE.map((phase, i) => (
              <div key={i} style={{ display: activePhase === i ? "block" : "none", animation: "fadeIn 0.4s ease" }}>
                <div className="flex flex-col md:flex-row gap-8">
                  <div style={{ flex: "0 0 280px" }}>
                    <p style={{ fontSize: 48, fontWeight: 200, color: "var(--accent-gold)", lineHeight: 1, marginBottom: 12, fontFamily: "var(--font-serif)" }}>{phase.phase}</p>
                    <h3 className="font-serif-kr" style={{ fontSize: 22, fontWeight: 500, marginBottom: 12, color: "var(--text-primary)" }}>{phase.title}</h3>
                    <p style={{ fontSize: 14, color: "var(--gray-500)", lineHeight: 1.8, fontWeight: 300 }}>{phase.desc}</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {phase.services.map((s, j) => (
                        <li key={j} className="flex items-center gap-3" style={{ padding: "14px 0", borderBottom: "1px solid var(--border-subtle)", fontSize: 14.5, color: "var(--gray-600)", fontWeight: 400 }}>
                          <CheckCircle2 size={16} color="var(--accent-gold)" strokeWidth={1.8} />{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-2 reveal" style={{ marginTop: 40 }}>
            {LIFECYCLE.map((_, i) => (
              <button key={i} onClick={() => setActivePhase(i)} style={{ width: activePhase === i ? 32 : 8, height: 8, borderRadius: 4, background: activePhase === i ? "var(--accent-gold)" : "var(--gray-100)", border: "none", cursor: "pointer", transition: "all 0.3s" }} />
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ 전문 분야 타일 ━━━ */}
      <section style={{ background: "var(--bg-primary)", padding: "var(--section-py) 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="text-center reveal" style={{ marginBottom: 56 }}>
            <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.3em", color: "var(--accent-gold)", marginBottom: 12 }}>PRACTICE AREAS</p>
            <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 400, color: "var(--text-primary)" }}>부동산 전문 업무 영역</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger">
            {PRACTICES.map((area, i) => {
              const Icon = area.icon;
              const isOpen = expandedIdx === i;
              return (
                <div key={i} className="reveal cursor-pointer" onClick={() => setExpandedIdx(isOpen ? null : i)} style={{ background: "#fff", border: isOpen ? "1px solid rgba(176,141,87,0.3)" : "1px solid var(--border-subtle)", transition: "all 0.35s ease", boxShadow: isOpen ? "0 12px 40px rgba(0,0,0,0.06)" : "0 1px 4px rgba(0,0,0,0.02)", overflow: "hidden" }}>
                  <div style={{ padding: "32px 28px" }}>
                    <div className="flex items-start gap-3" style={{ marginBottom: 16 }}>
                      <div style={{ width: 48, height: 48, background: "var(--accent-gold-light)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={22} strokeWidth={1.5} color="var(--accent-gold)" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 17, fontWeight: 600, color: "var(--text-primary)", marginBottom: 3 }}>{area.title}</h3>
                        <p className="font-en" style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--gray-300)" }}>{area.subtitle}</p>
                      </div>
                      <ChevronRight size={16} color="var(--gray-300)" style={{ transition: "transform 0.3s", transform: isOpen ? "rotate(90deg)" : "rotate(0)", marginTop: 6, flexShrink: 0 }} />
                    </div>
                    <p style={{ fontSize: 13.5, color: "var(--gray-500)", lineHeight: 1.8, fontWeight: 300 }}>{area.desc}</p>
                    <div style={{ maxHeight: isOpen ? 360 : 0, opacity: isOpen ? 1 : 0, overflow: "hidden", transition: "all 0.4s ease" }}>
                      <div style={{ borderTop: "1px solid var(--border-subtle)", marginTop: 18, paddingTop: 16 }}>
                        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                          {area.details.map((d, j) => (
                            <li key={j} className="flex items-center gap-2" style={{ fontSize: 13, color: "var(--gray-600)", padding: "6px 0" }}>
                              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--accent-gold)", flexShrink: 0 }} />{d}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ━━━ 추천 인용문 ━━━ */}
      <section style={{ background: "#fff", padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div className="text-center reveal" style={{ marginBottom: 48 }}>
            <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.3em", color: "var(--accent-gold)", marginBottom: 12 }}>CLIENT TESTIMONIALS</p>
            <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 400, color: "var(--text-primary)" }}>의뢰인이 말하는 윤정</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 stagger">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="reveal" style={{ padding: "36px 32px", background: "var(--bg-primary)", borderLeft: "3px solid var(--accent-gold)", position: "relative" }}>
                <Quote size={28} color="rgba(176,141,87,0.15)" style={{ position: "absolute", top: 20, right: 24 }} />
                <p style={{ fontSize: 14.5, color: "var(--gray-600)", lineHeight: 1.9, fontWeight: 300, fontStyle: "italic", marginBottom: 20 }}>"{t.quote}"</p>
                <p style={{ fontSize: 13, color: "var(--accent-gold)", fontWeight: 500 }}>— {t.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ 주요 실적 ━━━ */}
      <section style={{ background: "linear-gradient(160deg, #0a0f14 0%, #162433 50%, #0d1520 100%)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div className="text-center reveal" style={{ marginBottom: 48 }}>
            <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.3em", color: "var(--accent-gold)", marginBottom: 12 }}>TRACK RECORD</p>
            <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 400, color: "#fff" }}>부동산 분야 주요 수행 실적</h2>
          </div>
          <div className="hidden md:grid grid-cols-4 gap-0 reveal" style={{ marginBottom: 48, borderBottom: "1px solid var(--white-08)", paddingBottom: 40 }}>
            {STATS.map((s, i) => (
              <div key={i} className="text-center" style={{ borderRight: i < 3 ? "1px solid var(--white-08)" : "none" }}>
                <p className="font-serif" style={{ fontSize: "clamp(28px, 3.5vw, 36px)", fontWeight: 400, color: "var(--accent-gold)", marginBottom: 6 }}>{s.value}</p>
                <p style={{ fontSize: 12, color: "var(--white-40)" }}>{s.label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0 stagger">
            {TRACK_RECORDS.map((r, i) => (
              <div key={i} className="reveal flex items-start gap-4" style={{ padding: "20px 0", borderBottom: "1px solid var(--white-08)" }}>
                <span className="font-en" style={{ fontSize: 10, letterSpacing: "0.1em", color: "var(--accent-gold)", background: "rgba(176,141,87,0.1)", padding: "4px 10px", flexShrink: 0, marginTop: 2, whiteSpace: "nowrap" }}>{r.category}</span>
                <p style={{ fontSize: 14, color: "var(--white-60)", fontWeight: 300, lineHeight: 1.7 }}>{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ 인사이트 ━━━ */}
      <section style={{ background: "#fff", padding: "80px 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div className="flex items-end justify-between reveal" style={{ marginBottom: 40 }}>
            <div>
              <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.3em", color: "var(--accent-gold)", marginBottom: 12 }}>INSIGHTS</p>
              <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 400, color: "var(--text-primary)" }}>부동산 법률 인사이트</h2>
            </div>
            <Link to="/blog" className="hidden md:inline-flex items-center gap-2 font-en transition-all duration-300 hover:gap-3" style={{ fontSize: 12, letterSpacing: "0.12em", color: "var(--accent-gold)", textDecoration: "none" }}>
              VIEW ALL <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
            {[
              { tag: "재개발", title: "재개발 조합원 분쟁 — 관리처분계획 인가 취소의 요건과 실무", date: "2026.03" },
              { tag: "임대차", title: "상가임대차보호법 개정 — 권리금 회수 기회 보호의 실무 쟁점", date: "2026.02" },
              { tag: "토지수용", title: "공익사업 토지수용 보상금 증액, 감정평가 전략의 핵심", date: "2026.01" },
            ].map((post, i) => (
              <Link key={i} to="/blog" className="reveal group block" style={{ padding: "28px 24px", border: "1px solid var(--border-subtle)", textDecoration: "none", transition: "all 0.3s", background: "#fff" }}>
                <span className="font-en" style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--accent-gold)", display: "block", marginBottom: 12 }}>{post.tag}</span>
                <h3 className="group-hover:text-[var(--accent-gold)] transition-colors" style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1.6, marginBottom: 16 }}>{post.title}</h3>
                <p style={{ fontSize: 12, color: "var(--gray-300)" }}>{post.date}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ CTA ━━━ */}
      <section style={{ background: "linear-gradient(160deg, #0f1923 0%, #1a2a3a 100%)", padding: "80px 24px" }}>
        <div className="text-center reveal" style={{ maxWidth: 560, margin: "0 auto" }}>
          <div className="sep mx-auto" style={{ marginBottom: 32 }} />
          <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 300, color: "#fff", marginBottom: 16, lineHeight: 1.5 }}>
            분쟁은 시간이 지날수록 불리해집니다
          </h2>
          <p style={{ fontSize: 15, color: "var(--white-60)", lineHeight: 1.8, fontWeight: 300, marginBottom: 8 }}>
            초기 대응이 사건의 결과를 결정합니다.
          </p>
          <p style={{ fontSize: 14, color: "var(--white-40)", lineHeight: 1.8, fontWeight: 300, marginBottom: 36 }}>
            상담은 무료이며, 48시간 내 사건 분석 보고서를 제공합니다.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/consultation" className="inline-flex items-center gap-2 transition-all duration-300 hover:opacity-90" style={{ background: "var(--accent-gold)", color: "#fff", padding: "15px 36px", fontSize: 14, fontWeight: 500 }}>
              <Phone size={15} /> 무료 상담 예약
            </Link>
            <a href="tel:02-594-5583" className="inline-flex items-center gap-2 transition-all duration-300 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]" style={{ border: "1px solid var(--white-15)", color: "var(--white-40)", padding: "15px 36px", fontSize: 14 }}>02-594-5583</a>
          </div>
        </div>
      </section>
    </div>
  );
}
