/** 상담안내 페이지 — 상담 절차, 연락처, 상담 신청 폼, FAQ, 지도(카카오/네이버/구글), 약도 */
import { useState } from "react";
import useReveal from "../hooks/useReveal";
import { api } from "../utils/api";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { Textarea } from "../components/ui/Textarea";

/* ── 서초역 3번 출구 기준 사무실 좌표 ── */
const OFFICE_LAT = 37.4920;
const OFFICE_LNG = 127.0076;
const OFFICE_ADDRESS = "서울특별시 서초구 서초대로 254, 오퓨런스빌딩 7층";

const STEPS = [
  { step: "01", title: "사건 분석 및 진단", desc: "초기 자료를 신속히 검토하고 핵심 쟁점과 위험요소를 명확히 정리합니다." },
  { step: "02", title: "전략 설계 및 실행", desc: "협상·소송·집행 단계별 목표를 설정하고 일정 중심으로 추진합니다." },
  { step: "03", title: "맞춤형 전략 수립", desc: "사건의 쟁점을 빠르게 분석해 의뢰인에게 최적화된 대응 전략을 제시합니다." },
  { step: "04", title: "결과 관리 및 사후 대응", desc: "판결 이후 이행, 추가 분쟁 예방까지 의뢰인의 리스크를 관리합니다." },
];

const CONTACT_INFO = [
  { label: "전화", value: "02-535-0461", icon: "📞", href: "tel:02-535-0461" },
  { label: "카카오톡 상담", value: "카카오톡으로 빠른 상담", icon: "💬", href: null },
  { label: "이메일", value: "contact@younjeong.com", icon: "📧", href: "mailto:contact@younjeong.com" },
  { label: "영업시간", value: "평일 09:00 - 18:00 (예약 상담 우선)", icon: "🕐", href: null },
];

const STATS = [
  { value: "15+", label: "년 이상 실무 경험" },
  { value: "1:1", label: "사건 맞춤 커뮤니케이션" },
  { value: "24H", label: "신속한 초기 응답" },
  { value: "100%", label: "기밀 보장 원칙" },
];

const MAP_TABS = [
  { id: "kakao", label: "카카오맵" },
  { id: "naver", label: "네이버지도" },
  { id: "google", label: "구글지도" },
];

/** 상담 분야 옵션 */
const CONSULTATION_CATEGORIES = [
  { value: "civil", label: "민사" },
  { value: "criminal", label: "형사" },
  { value: "family", label: "가사" },
  { value: "admin", label: "행정" },
  { value: "tax", label: "조세" },
  { value: "realestate", label: "부동산" },
  { value: "corporate", label: "기업법무" },
  { value: "other", label: "기타" },
];

/** 상담 폼 초기값 */
const INITIAL_FORM = {
  name: "",
  phone: "",
  email: "",
  category: "civil",
  message: "",
  agreed: false,
};

/** 자주 묻는 질문 */
const FAQ_ITEMS = [
  { q: "상담 비용은 어떻게 되나요?", a: "초기 상담은 사건의 복잡도와 분야에 따라 상이합니다. 전화 또는 카카오톡으로 문의하시면 상담 유형에 맞는 안내를 드립니다." },
  { q: "상담 예약은 어떻게 하나요?", a: "전화(02-535-0461), 카카오톡, 또는 위 상담 신청 폼을 통해 예약하실 수 있습니다. 예약 상담이 우선 진행됩니다." },
  { q: "방문 상담이 가능한가요?", a: "네, 서초역 3번 출구 도보 3분 거리의 사무소에서 직접 상담이 가능합니다. 사전 예약을 권장드립니다." },
  { q: "상담 후 수임이 필수인가요?", a: "아닙니다. 상담을 통해 사건의 방향성을 파악하신 후 자유롭게 결정하실 수 있습니다." },
  { q: "어떤 분야를 전문으로 하나요?", a: "민사·형사·가사·행정·조세·부동산·기업법무 등 폭넓은 분야에서 실무 경험을 보유하고 있습니다." },
  { q: "비밀이 보장되나요?", a: "변호사법에 따라 상담 내용은 철저히 비밀이 보장됩니다. 모든 정보는 안전하게 관리됩니다." },
];

/** 각 지도 서비스의 임베드/링크 URL 생성 */
function getMapUrl(type) {
  switch (type) {
    case "kakao":
      return `https://map.kakao.com/link/map/윤정법률사무소,${OFFICE_LAT},${OFFICE_LNG}`;
    case "naver":
      return `https://map.naver.com/p/search/윤정%20법률사무소`;
    case "google":
      return `https://www.google.com/maps?q=${OFFICE_LAT},${OFFICE_LNG}&z=17&output=embed`;
    default:
      return "";
  }
}

/** 각 지도 서비스의 외부 링크 URL */
function getMapExternalUrl(type) {
  switch (type) {
    case "kakao":
      return `https://map.kakao.com/link/map/윤정법률사무소,${OFFICE_LAT},${OFFICE_LNG}`;
    case "naver":
      return `https://map.naver.com/p/search/윤정%20법률사무소`;
    case "google":
      return `https://www.google.com/maps/search/?api=1&query=${OFFICE_LAT},${OFFICE_LNG}`;
    default:
      return "";
  }
}

export default function ConsultationPage() {
  const ref = useReveal();
  const [activeMap, setActiveMap] = useState("kakao");
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null); // { type: "success" | "error", msg }
  const [openFaq, setOpenFaq] = useState(null);

  /** 폼 필드 업데이트 핸들러 */
  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  /** 상담 신청 제출 */
  async function handleFormSubmit(e) {
    e.preventDefault();
    setSubmitResult(null);

    if (!form.agreed) {
      setSubmitResult({ type: "error", msg: "개인정보 수집 및 이용에 동의해주세요." });
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/consultations", {
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        category: form.category,
        message: form.message,
      });
      setSubmitResult({ type: "success", msg: "상담 신청이 접수되었습니다. 빠른 시일 내에 연락드리겠습니다." });
      setForm(INITIAL_FORM);
    } catch (err) {
      setSubmitResult({ type: "error", msg: err.message || "신청 중 오류가 발생했습니다." });
    } finally {
      setSubmitting(false);
    }
  }

  /** FAQ 아코디언 토글 */
  function handleFaqToggle(index) {
    setOpenFaq((prev) => (prev === index ? null : index));
  }

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
            상담안내
          </h1>
          <p className="font-en reveal" style={{ fontSize: 13, letterSpacing: "0.3em", color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
            CONSULTATION
          </p>
          <p className="reveal" style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", fontWeight: 300, lineHeight: 1.9 }}>
            사건의 핵심을 파악하여 명확한 해결책을 제시해 드립니다
          </p>
        </div>
      </section>

      {/* ==================== 핵심 지표 ==================== */}
      <section style={{ background: "#fff", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="container" style={{ paddingTop: 48, paddingBottom: 48 }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 stagger">
            {STATS.map((s, i) => (
              <div key={i} className="reveal text-center" style={{ padding: "24px 16px" }}>
                <p className="font-en" style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontWeight: 300, color: "var(--accent-gold)", marginBottom: 8 }}>
                  {s.value}
                </p>
                <p style={{ fontSize: 13, color: "#888", fontWeight: 300 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 상담 절차 ==================== */}
      <section className="section" style={{ background: "#fff" }}>
        <div className="container" style={{ maxWidth: 960 }}>
          <div className="text-center reveal" style={{ marginBottom: 64 }}>
            <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.25em", color: "var(--accent-gold)", marginBottom: 14 }}>
              PROCESS
            </p>
            <h2 className="font-serif" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 300, color: "#1a1a1a", marginBottom: 16 }}>
              명확한 전략, 빠른 실행, 책임 있는 결과
            </h2>
            <p style={{ fontSize: 15, color: "#666", fontWeight: 300, maxWidth: 600, margin: "0 auto" }}>
              윤정 법률사무소는 사건을 단순 처리하지 않습니다. 분쟁의 원인과 증거, 상대의 전략을 정밀 분석하여
              의뢰인에게 가장 실익이 큰 선택지를 제시합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger" style={{ marginBottom: 80 }}>
            {STEPS.map((s, i) => (
              <div
                key={i}
                className="reveal text-center"
                style={{ padding: "32px 20px", border: "1px solid rgba(0,0,0,0.06)", background: "#fafaf9" }}
              >
                <p className="font-en" style={{ fontSize: 32, fontWeight: 300, color: "var(--accent-gold)", marginBottom: 12 }}>
                  {s.step}
                </p>
                <h3 style={{ fontSize: 16, fontWeight: 500, color: "#1a1a1a", marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: "#888", lineHeight: 1.8, fontWeight: 300 }}>{s.desc}</p>
              </div>
            ))}
          </div>

          {/* ==================== 연락처 + 오시는 길 ==================== */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* 연락처 */}
            <div className="reveal">
              <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.25em", color: "var(--accent-gold)", marginBottom: 14 }}>
                CONTACT
              </p>
              <h2 className="font-serif" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", fontWeight: 300, color: "#1a1a1a", marginBottom: 32 }}>
                연락처
              </h2>
              <div className="space-y-4">
                {CONTACT_INFO.map((c, i) => {
                  const Inner = (
                    <div className="flex items-center gap-4 transition-colors duration-200 hover:bg-[#f0f0ee]"
                      style={{ padding: "16px 20px", background: "#fafaf9", border: "1px solid rgba(0,0,0,0.04)", cursor: c.href ? "pointer" : "default" }}>
                      <span style={{ fontSize: 24 }}>{c.icon}</span>
                      <div>
                        <p style={{ fontSize: 12, color: "#999", marginBottom: 2 }}>{c.label}</p>
                        <p style={{ fontSize: 15, color: "#1a1a1a", fontWeight: 400 }}>{c.value}</p>
                      </div>
                    </div>
                  );
                  return c.href ? (
                    <a key={i} href={c.href} style={{ textDecoration: "none", color: "inherit", display: "block" }}>{Inner}</a>
                  ) : (
                    <div key={i}>{Inner}</div>
                  );
                })}
              </div>
            </div>

            {/* 오시는 길 */}
            <div className="reveal">
              <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.25em", color: "var(--accent-gold)", marginBottom: 14 }}>
                LOCATION
              </p>
              <h2 className="font-serif" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", fontWeight: 300, color: "#1a1a1a", marginBottom: 32 }}>
                오시는 길
              </h2>
              <div style={{ padding: "32px 24px", background: "#fafaf9", border: "1px solid rgba(0,0,0,0.04)", marginBottom: 16 }}>
                <p style={{ fontSize: 15, color: "#1a1a1a", fontWeight: 500, marginBottom: 12 }}>
                  {OFFICE_ADDRESS}
                </p>
                <p style={{ fontSize: 13, color: "#888", lineHeight: 1.9, fontWeight: 300 }}>
                  지하철: 2호선 서초역 3번 출구 도보 3분<br />
                  교대역 방면에서도 도보 이동 가능<br />
                  주차: 빌딩 내 지하주차장 이용 가능
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== 상담 신청 폼 ==================== */}
      <section className="section" style={{ background: "#f9f9f8", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <div className="text-center reveal" style={{ marginBottom: 48 }}>
            <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.25em", color: "var(--accent-gold)", marginBottom: 14 }}>
              CONTACT FORM
            </p>
            <h2 className="font-serif" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", fontWeight: 300, color: "#1a1a1a", marginBottom: 12 }}>
              온라인 상담 신청
            </h2>
            <p style={{ fontSize: 14, color: "#888", fontWeight: 300 }}>
              아래 양식을 작성해 주시면 빠른 시일 내에 연락드리겠습니다
            </p>
          </div>

          <form onSubmit={handleFormSubmit} className="reveal" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* 이름 + 연락처 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 13, color: "#555", marginBottom: 6, display: "block" }}>
                  이름 <span style={{ color: "var(--accent-gold)" }}>*</span>
                </label>
                <Input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="홍길동"
                  required
                  style={{ background: "#fff" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#555", marginBottom: 6, display: "block" }}>
                  연락처 <span style={{ color: "var(--accent-gold)" }}>*</span>
                </label>
                <Input
                  name="phone"
                  value={form.phone}
                  onChange={handleFormChange}
                  placeholder="010-1234-5678"
                  required
                  style={{ background: "#fff" }}
                />
              </div>
            </div>

            {/* 이메일 + 상담 분야 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 13, color: "#555", marginBottom: 6, display: "block" }}>이메일</label>
                <Input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleFormChange}
                  placeholder="example@email.com"
                  style={{ background: "#fff" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#555", marginBottom: 6, display: "block" }}>
                  상담 분야 <span style={{ color: "var(--accent-gold)" }}>*</span>
                </label>
                <Select
                  name="category"
                  value={form.category}
                  onChange={handleFormChange}
                  style={{ background: "#fff" }}
                >
                  {CONSULTATION_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </Select>
              </div>
            </div>

            {/* 상담 내용 */}
            <div>
              <label style={{ fontSize: 13, color: "#555", marginBottom: 6, display: "block" }}>
                상담 내용 <span style={{ color: "var(--accent-gold)" }}>*</span>
              </label>
              <Textarea
                name="message"
                value={form.message}
                onChange={handleFormChange}
                placeholder="상담받고자 하는 내용을 간략히 작성해 주세요 (10자 이상)"
                rows={5}
                required
                style={{ background: "#fff" }}
              />
            </div>

            {/* 개인정보 동의 */}
            <label className="flex items-start gap-3" style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                name="agreed"
                checked={form.agreed}
                onChange={handleFormChange}
                style={{ marginTop: 3, accentColor: "var(--accent-gold)" }}
              />
              <span style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>
                상담 신청을 위해 이름, 연락처, 이메일 등 개인정보를 수집·이용하는 것에 동의합니다.
                수집된 정보는 상담 목적으로만 사용되며, 상담 완료 후 관련 법령에 따라 안전하게 관리됩니다.
              </span>
            </label>

            {/* 결과 메시지 */}
            {submitResult && (
              <div
                style={{
                  padding: "14px 20px",
                  fontSize: 14,
                  borderRadius: 6,
                  background: submitResult.type === "success" ? "#f0fdf4" : "#fef2f2",
                  color: submitResult.type === "success" ? "#166534" : "#991b1b",
                  border: `1px solid ${submitResult.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                }}
              >
                {submitResult.msg}
              </div>
            )}

            {/* 제출 버튼 */}
            <div className="text-center" style={{ marginTop: 8 }}>
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                style={{ minWidth: 200, letterSpacing: "0.05em" }}
              >
                {submitting ? "접수 중..." : "상담 신청하기"}
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* ==================== FAQ 섹션 ==================== */}
      <section className="section" style={{ background: "#fff", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <div className="text-center reveal" style={{ marginBottom: 48 }}>
            <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.25em", color: "var(--accent-gold)", marginBottom: 14 }}>
              FAQ
            </p>
            <h2 className="font-serif" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", fontWeight: 300, color: "#1a1a1a" }}>
              자주 묻는 질문
            </h2>
          </div>

          <div className="reveal" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {FAQ_ITEMS.map((item, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={idx} style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                  <button
                    type="button"
                    onClick={() => handleFaqToggle(idx)}
                    className="w-full text-left flex items-center justify-between transition-colors duration-200 hover:bg-[#fafaf9]"
                    style={{ padding: "20px 4px", cursor: "pointer", background: "transparent", border: "none" }}
                  >
                    <span style={{ fontSize: 15, color: "#1a1a1a", fontWeight: 400, flex: 1, paddingRight: 16 }}>
                      {item.q}
                    </span>
                    <span
                      style={{
                        fontSize: 18,
                        color: "var(--accent-gold)",
                        transition: "transform 0.3s ease",
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                        flexShrink: 0,
                      }}
                    >
                      +
                    </span>
                  </button>
                  <div
                    style={{
                      maxHeight: isOpen ? 200 : 0,
                      overflow: "hidden",
                      transition: "max-height 0.3s ease, opacity 0.3s ease",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <p style={{ padding: "0 4px 20px", fontSize: 14, color: "#666", lineHeight: 1.8, fontWeight: 300 }}>
                      {item.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== 지도 섹션 ==================== */}
      <section style={{ background: "#f9f9f8", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="container" style={{ paddingTop: 64, paddingBottom: 64, maxWidth: 960 }}>
          <div className="text-center reveal" style={{ marginBottom: 32 }}>
            <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.25em", color: "var(--accent-gold)", marginBottom: 14 }}>
              MAP
            </p>
            <h2 className="font-serif" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", fontWeight: 300, color: "#1a1a1a" }}>
              지도로 보기
            </h2>
          </div>

          {/* 지도 탭 */}
          <div className="flex justify-center gap-2 reveal" style={{ marginBottom: 20 }}>
            {MAP_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveMap(tab.id)}
                style={{
                  padding: "10px 24px",
                  fontSize: 13,
                  fontWeight: activeMap === tab.id ? 500 : 300,
                  color: activeMap === tab.id ? "#fff" : "#666",
                  background: activeMap === tab.id ? "#0f1923" : "#fff",
                  border: "1px solid rgba(0,0,0,0.1)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 지도 iframe */}
          <div className="reveal" style={{ border: "1px solid rgba(0,0,0,0.08)", background: "#fff", overflow: "hidden" }}>
            {activeMap === "google" ? (
              <iframe
                title="구글지도"
                src={`https://www.google.com/maps?q=${OFFICE_LAT},${OFFICE_LNG}&z=17&output=embed`}
                style={{ width: "100%", height: 400, border: "none" }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div style={{ width: "100%", height: 400, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, background: "#fafaf9" }}>
                <p style={{ fontSize: 14, color: "#666" }}>
                  {activeMap === "kakao" ? "카카오맵" : "네이버지도"}에서 위치를 확인하세요
                </p>
                <a
                  href={getMapExternalUrl(activeMap)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block font-en transition-all duration-300 hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]"
                  style={{
                    border: "1px solid rgba(0,0,0,0.15)",
                    color: "#1a1a1a",
                    padding: "12px 32px",
                    fontSize: 13,
                    letterSpacing: "0.1em",
                    textDecoration: "none",
                  }}
                >
                  {activeMap === "kakao" ? "카카오맵에서 열기" : "네이버지도에서 열기"} →
                </a>
              </div>
            )}
          </div>

          {/* 외부 링크 바 */}
          <div className="flex justify-center gap-4 flex-wrap reveal" style={{ marginTop: 16 }}>
            {MAP_TABS.map((tab) => (
              <a
                key={tab.id}
                href={getMapExternalUrl(tab.id)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12,
                  color: "#999",
                  textDecoration: "none",
                  padding: "8px 16px",
                  border: "1px solid rgba(0,0,0,0.06)",
                  transition: "all 0.2s",
                }}
                className="hover:text-[var(--accent-gold)] hover:border-[var(--accent-gold)]"
              >
                {tab.label}에서 열기 ↗
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== 약도 섹션 ==================== */}
      <section style={{ background: "#fff", borderTop: "1px solid rgba(0,0,0,0.06)" }}>
        <div className="container" style={{ paddingTop: 64, paddingBottom: 64, maxWidth: 960 }}>
          <div className="text-center reveal" style={{ marginBottom: 40 }}>
            <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.25em", color: "var(--accent-gold)", marginBottom: 14 }}>
              DIRECTIONS
            </p>
            <h2 className="font-serif" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", fontWeight: 300, color: "#1a1a1a", marginBottom: 8 }}>
              교대역에서 오시는 길
            </h2>
            <p style={{ fontSize: 13, color: "#999", fontWeight: 300 }}>서초역 3번 출구 도보 3분</p>
          </div>
          <div className="reveal" style={{ maxWidth: 700, margin: "0 auto" }}>
            <img
              src="/directions-map.svg"
              alt="교대역에서 윤정 법률사무소까지 약도"
              style={{ width: "100%", height: "auto", border: "1px solid rgba(0,0,0,0.06)" }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
