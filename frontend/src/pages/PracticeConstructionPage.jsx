/**
 * 건설 법률 전문 페이지 — 프로젝트 라이프사이클 + 서브 프랙티스 + 실적
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2, HardHat, Shield, Gavel, ChevronRight, CheckCircle2,
  ArrowRight, Phone, Quote, Scale, TrendingUp, Award, Users,
} from "lucide-react";
import useReveal from "../hooks/useReveal";

/* ── 프로젝트 라이프사이클 3단계 ── */
const LIFECYCLE = [
  {
    phase: "01",
    title: "계획·계약 단계",
    subtitle: "PLANNING & CONTRACTS",
    desc: "프로젝트 착수 전 법률 리스크를 선제적으로 차단합니다.",
    services: [
      "공사도급계약서 검토·작성",
      "EPC / 턴키 / CM 계약 자문",
      "하도급 계약 구조 설계",
      "FIDIC 조건 분석·협상",
      "건설 보증·보험 검토",
      "인허가·환경영향평가 대응",
    ],
  },
  {
    phase: "02",
    title: "시공·이행 단계",
    subtitle: "PERFORMANCE & EXECUTION",
    desc: "시공 과정에서 발생하는 법률 이슈에 실시간으로 대응합니다.",
    services: [
      "설계변경·추가공사 클레임",
      "공기연장(EOT) 청구 대리",
      "원·하도급 대금 분쟁",
      "현장 안전사고 법적 대응",
      "계약 이행 보증 실행·방어",
      "중간정산·기성금 분쟁",
    ],
  },
  {
    phase: "03",
    title: "준공·분쟁해결 단계",
    subtitle: "COMPLETION & DISPUTES",
    desc: "준공 후 하자, 정산, 중재 등 최종 단계의 분쟁을 해결합니다.",
    services: [
      "하자보수 및 손해배상 청구",
      "최종 정산·공사대금 소송",
      "건설 중재 (KCAB, ICC, SIAC)",
      "건축물 하자 감정 연계",
      "준공 관련 행정 쟁송",
      "Cross-border 국제 분쟁",
    ],
  },
];

/* ── 건설 서브 프랙티스 ── */
const PRACTICES = [
  {
    icon: Building2,
    title: "건설 소송·클레임",
    subtitle: "CONSTRUCTION LITIGATION",
    desc: "공사대금, 하자보수, 공기연장 등 건설 현장의 복잡한 분쟁을 체계적으로 해결합니다.",
    details: ["공사대금 청구·지급 분쟁", "하자보수 손해배상", "공기연장 클레임(EOT)", "설계변경·추가공사 분쟁", "원·하도급 분쟁", "건설 중재·조정"],
  },
  {
    icon: HardHat,
    title: "건설 계약·자문",
    subtitle: "CONSTRUCTION ADVISORY",
    desc: "계약 단계의 리스크 사전 차단으로 분쟁을 예방하고, 프로젝트의 법적 안정성을 확보합니다.",
    details: ["공사도급계약 검토·작성", "EPC / 턴키 계약", "FIDIC 계약 조건 분석", "건설 보증·보험 자문", "하도급 계약 관리", "설계 용역 계약"],
  },
  {
    icon: Shield,
    title: "건설 행정·인허가",
    subtitle: "PERMITS & REGULATORY",
    desc: "건축허가, 개발행위허가, 토지수용 등 건설 관련 행정 절차와 인허가 쟁송을 전문적으로 수행합니다.",
    details: ["건축허가·개발행위허가", "행정처분 취소 소송", "토지수용·보상 분쟁", "환경영향평가 대응", "건설업 등록·면허", "산업안전보건법 대응"],
  },
  {
    icon: Gavel,
    title: "국제 건설·중재",
    subtitle: "INTERNATIONAL & ARBITRATION",
    desc: "해외 건설 프로젝트와 국제 중재에서 풍부한 경험을 바탕으로 최적의 전략을 수립합니다.",
    details: ["국내 건설 중재(KCAB)", "ICC / SIAC 국제 중재", "해외 EPC 클레임", "Cross-border 분쟁", "해외 건설 프로젝트 자문", "국제 건설계약 검토"],
  },
];

/* ── 실적 수치 ── */
const STATS = [
  { value: "300+", label: "건설 사건 수행", icon: Scale },
  { value: "95%", label: "클라이언트 만족도", icon: TrendingUp },
  { value: "200억+", label: "누적 클레임 청구 규모", icon: Award },
  { value: "10년+", label: "건설 분야 전문 경력", icon: Users },
];

/* ── 주요 실적 ── */
const TRACK_RECORDS = [
  { category: "공사대금", text: "대형 시공사 공사대금 청구 소송 — 수십억 원 규모 전액 인용 판결" },
  { category: "하자분쟁", text: "대규모 공동주택 하자보수 손해배상 — 감정 연계 전략으로 승소" },
  { category: "국제중재", text: "해외 플랜트 EPC 공기연장 클레임 — 국제중재(ICC) 수행" },
  { category: "행정소송", text: "공공발주 공사 관련 행정처분 취소 소송 — 원고 승소" },
  { category: "클레임", text: "설계변경·추가공사 클레임 — 발주자 대리 수십억 원 방어 성공" },
  { category: "안전사고", text: "건설 현장 중대재해 — 산업안전보건법 위반 무혐의 처분" },
];

/* ── 성공 사례 카드 (구체적 금액) ── */
const CASE_RESULTS = [
  { amount: "47억", unit: "원", label: "공사대금 전액 인용 판결", detail: "원도급사의 부당한 기성금 삭감에 대해 전액 회수 달성" },
  { amount: "32억", unit: "원", label: "하자보수 손해배상 승소", detail: "공동주택 구조·방수 하자에 대한 감정 연계 전략으로 인용" },
  { amount: "무혐의", unit: "", label: "중대재해법 위반 방어", detail: "건설 현장 사망사고에서 시공사 대표 무혐의 처분 달성" },
  { amount: "6개월", unit: "해결", label: "EOT 클레임 국제중재", detail: "해외 EPC 프로젝트 공기연장 클레임 ICC 중재 수행" },
];

/* ── 의뢰인 고민 ── */
const PAIN_POINTS = [
  "발주자가 기성금 지급을 계속 미루고 있다",
  "하도급 업체와 공사대금 분쟁이 발생했다",
  "준공 후 하자보수 책임 범위를 둘러싼 갈등이 있다",
  "공기연장에 따른 추가 비용을 청구하고 싶다",
  "건축허가가 반려되어 공사 착공이 불가능하다",
  "현장 안전사고로 법적 책임 문제에 처해 있다",
];

/* ── 추천 인용문 ── */
const TESTIMONIALS = [
  {
    quote: "건설 현장의 실무를 깊이 이해하는 변호사라 기술적 쟁점까지 정확하게 파악해주었습니다. 다른 로펌에서는 받지 못했던 실질적인 조언이었습니다.",
    author: "대형 건설사 법무팀장",
  },
  {
    quote: "EPC 계약 검토 단계에서 잠재적 리스크를 사전에 발견해 수억 원의 손실을 예방할 수 있었습니다.",
    author: "해외 플랜트 시공사 임원",
  },
];

export default function PracticeConstructionPage() {
  const ref = useReveal();
  const [activePhase, setActivePhase] = useState(0);
  const [expandedIdx, setExpandedIdx] = useState(null);

  return (
    <div ref={ref}>
      {/* ━━━ 히어로 ━━━ */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{ height: "75vh", minHeight: 550 }}>
        <div className="absolute inset-0" style={{ backgroundImage: "url(/construction-hero3.jpg)", backgroundSize: "cover", backgroundPosition: "center 30%", backgroundRepeat: "no-repeat" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(10,15,20,0.87) 0%, rgba(17,29,42,0.76) 40%, rgba(22,36,51,0.80) 70%, rgba(13,21,32,0.90) 100%)" }} />
        <div className="absolute bottom-0 left-0 right-0" style={{ height: 150, background: "linear-gradient(to top, #fff, transparent)" }} />

        <div className="relative" style={{ maxWidth: 900, padding: "0 24px", zIndex: 2, width: "100%" }}>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div style={{ maxWidth: 560 }}>
              {/* 브레드크럼 */}
              <div className="reveal flex items-center gap-2" style={{ marginBottom: 20 }}>
                <Link to="/practice" className="font-en" style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--white-40)", textDecoration: "none" }}>PRACTICE</Link>
                <ChevronRight size={12} color="var(--white-20)" />
                <span className="font-en" style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--accent-gold)" }}>CONSTRUCTION</span>
              </div>

              <h1 className="font-serif-kr reveal" style={{ fontSize: "clamp(2.2rem, 5vw, 3.4rem)", fontWeight: 300, color: "#fff", lineHeight: 1.35, marginBottom: 24 }}>
                건설 분쟁의
                <br /><span style={{ fontWeight: 500, color: "var(--accent-gold)" }}>전문적 해결</span>
              </h1>
              <p className="reveal" style={{ fontSize: 15, color: "var(--white-60)", lineHeight: 1.9, fontWeight: 300, marginBottom: 36 }}>
                프로젝트 기획부터 준공, 분쟁 해결까지—
                <br />건설 프로젝트 전 과정을 아우르는 원스톱 법률 서비스를 제공합니다.
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

            {/* 우측 통계 */}
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

      {/* ━━━ 성공 사례 카드 (히어로 바로 아래) ━━━ */}
      <section className="hidden md:block" style={{ background: "#fff", padding: "0 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", transform: "translateY(-48px)" }}>
          <div className="grid grid-cols-4 gap-0 reveal" style={{ background: "var(--bg-dark)", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
            {CASE_RESULTS.map((r, i) => (
              <div key={i} className="text-center group" style={{ padding: "28px 16px", borderRight: i < 3 ? "1px solid var(--white-08)" : "none", cursor: "default" }}>
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
            건설 분쟁은 초기 대응이 결과를 결정합니다. 지금 바로 상담하세요.
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

      {/* ━━━ 프로젝트 라이프사이클 ━━━ */}
      <section id="lifecycle" style={{ background: "#fff", padding: "var(--section-py) 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div className="text-center reveal" style={{ marginBottom: 56 }}>
            <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.3em", color: "var(--accent-gold)", marginBottom: 12 }}>PROJECT LIFECYCLE</p>
            <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 400, color: "var(--text-primary)" }}>
              프로젝트 전 과정을 아우르는 법률 서비스
            </h2>
            <p style={{ fontSize: 14, color: "var(--gray-400)", marginTop: 14, fontWeight: 300, maxWidth: 520, margin: "14px auto 0" }}>
              건설 프로젝트의 기획부터 준공까지, 각 단계에 최적화된 법률 솔루션을 제공합니다
            </p>
          </div>

          {/* 탭 */}
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
            <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 400, color: "var(--text-primary)" }}>건설 전문 업무 영역</h2>
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
            <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 400, color: "#fff" }}>건설 분야 주요 수행 실적</h2>
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
              <h2 className="font-serif-kr" style={{ fontSize: "clamp(1.4rem, 3vw, 1.8rem)", fontWeight: 400, color: "var(--text-primary)" }}>건설 법률 인사이트</h2>
            </div>
            <Link to="/blog" className="hidden md:inline-flex items-center gap-2 font-en transition-all duration-300 hover:gap-3" style={{ fontSize: 12, letterSpacing: "0.12em", color: "var(--accent-gold)", textDecoration: "none" }}>
              VIEW ALL <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger">
            {[
              { tag: "건설 계약", title: "FIDIC 계약 조건에서 시공사가 주의해야 할 핵심 조항", date: "2026.03" },
              { tag: "하자분쟁", title: "공동주택 하자보수 청구, 감정 결과를 유리하게 이끄는 전략", date: "2026.02" },
              { tag: "클레임", title: "공기연장(EOT) 클레임의 입증 방법과 실무 쟁점", date: "2026.01" },
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
