/** 상담안내 페이지 — 상담 절차, 연락처, 상담 신청 폼, FAQ, 지도(카카오/네이버/구글), 약도 */
import { useState, useRef, useCallback } from "react";
import { Phone, MessageCircle, AtSign, Clock } from "lucide-react";
import useReveal from "../hooks/useReveal";
import { api } from "../utils/api";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Button } from "../components/ui/Button";
import { Textarea } from "../components/ui/Textarea";

/* ── 사무실 좌표 (서초대로 327, 5층) ── */
const OFFICE_LAT = 37.4946;
const OFFICE_LNG = 127.0130;
const OFFICE_ADDRESS = "서울특별시 서초구 서초대로 327, 5층";

const STEPS = [
  { step: "01", title: "사건 분석 및 진단", desc: "초기 자료를 신속히 검토하고 핵심 쟁점과 위험요소를 명확히 정리합니다." },
  { step: "02", title: "전략 설계 및 실행", desc: "협상·소송·집행 단계별 목표를 설정하고 일정 중심으로 추진합니다." },
  { step: "03", title: "맞춤형 전략 수립", desc: "사건의 쟁점을 빠르게 분석해 의뢰인에게 최적화된 대응 전략을 제시합니다." },
  { step: "04", title: "결과 관리 및 사후 대응", desc: "판결 이후 이행, 추가 분쟁 예방까지 의뢰인의 리스크를 관리합니다." },
];

const CONTACT_INFO = [
  { label: "전화", value: "02-594-5583", icon: Phone, href: "tel:02-594-5583" },
  { label: "카카오톡 상담", value: "카카오톡으로 빠른 상담", icon: MessageCircle, href: "https://open.kakao.com/me/younjeong" },
  { label: "이메일", value: "younsehwan@younjeong.com", icon: AtSign, href: "mailto:younsehwan@younjeong.com" },
  { label: "영업시간", value: "평일 09:00 - 18:00 (예약 상담 우선)", icon: Clock, href: null },
];

const STATS = [
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
/** 희망 시간대 옵션 */
const TIME_SLOTS = [
  { value: "", label: "선택해주세요" },
  { value: "09:00~10:00", label: "오전 9시~10시" },
  { value: "10:00~11:00", label: "오전 10시~11시" },
  { value: "11:00~12:00", label: "오전 11시~12시" },
  { value: "13:00~14:00", label: "오후 1시~2시" },
  { value: "14:00~15:00", label: "오후 2시~3시" },
  { value: "15:00~16:00", label: "오후 3시~4시" },
  { value: "16:00~17:00", label: "오후 4시~5시" },
  { value: "17:00~18:00", label: "오후 5시~6시" },
];

const INITIAL_FORM = {
  name: "",
  phone: "",
  email: "",
  category: "civil",
  preferredDate: "",
  preferredTime: "",
  message: "",
  agreed: false,
};

/** 자주 묻는 질문 */
const FAQ_ITEMS = [
  { q: "상담 비용은 어떻게 되나요?", a: "초기 상담은 사건의 복잡도와 분야에 따라 상이합니다. 전화 또는 카카오톡으로 문의하시면 상담 유형에 맞는 안내를 드립니다." },
  { q: "상담 예약은 어떻게 하나요?", a: "전화(02-594-5583), 카카오톡, 또는 위 상담 신청 폼을 통해 예약하실 수 있습니다. 예약 상담이 우선 진행됩니다." },
  { q: "방문 상담이 가능한가요?", a: "네, 서초구 서초대로 327, 5층 사무소에서 직접 상담이 가능합니다. 사전 예약을 권장드립니다." },
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
  const [submitResult, setSubmitResult] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const [signatureData, setSignatureData] = useState(null);
  const privacyRef = useRef(null);
  const sigCanvasRef = useRef(null);
  const sigDrawingRef = useRef(false);

  /** 개인정보 동의서 스크롤 감지 — 끝까지 스크롤해야 동의 버튼 활성화 */
  const handlePrivacyScroll = useCallback(() => {
    const el = privacyRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
      setScrolledToBottom(true);
    }
  }, []);

  /** 서명 캔버스 — 속도 기반 필압 + 베지어 곡선 */
  const sigPointsRef = useRef([]);
  const sigLastVelRef = useRef(0);

  function getSigPos(e) {
    const canvas = sigCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
      t: Date.now(),
    };
  }

  function sigStart(e) {
    e.preventDefault();
    sigDrawingRef.current = true;
    const pos = getSigPos(e);
    sigPointsRef.current = [pos];
    sigLastVelRef.current = 0;
  }

  function sigMove(e) {
    if (!sigDrawingRef.current) return;
    e.preventDefault();
    const canvas = sigCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getSigPos(e);
    const points = sigPointsRef.current;
    points.push(pos);

    if (points.length < 3) return;
    const prev = points[points.length - 3];
    const mid = points[points.length - 2];
    const cur = pos;

    /* 속도 → 필압 변환 (빠르면 가늘고, 느리면 굵게) */
    const dx = cur.x - prev.x;
    const dy = cur.y - prev.y;
    const dt = Math.max(cur.t - prev.t, 1);
    const velocity = Math.sqrt(dx * dx + dy * dy) / dt;
    const smoothVel = sigLastVelRef.current * 0.6 + velocity * 0.4;
    sigLastVelRef.current = smoothVel;
    const lineWidth = Math.max(1.2, Math.min(4.5, 4.5 - smoothVel * 3));

    /* 베지어 곡선으로 부드러운 획 */
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.quadraticCurveTo(mid.x, mid.y, (mid.x + cur.x) / 2, (mid.y + cur.y) / 2);
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  function sigEnd() {
    if (!sigDrawingRef.current) return;
    sigDrawingRef.current = false;
    sigPointsRef.current = [];
  }

  function sigClear() {
    const canvas = sigCanvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  }

  function sigConfirm() {
    const canvas = sigCanvasRef.current;
    /* 빈 캔버스 체크 */
    const ctx = canvas.getContext("2d");
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const hasContent = pixels.some((v, i) => i % 4 === 3 && v > 0);
    if (!hasContent) return;
    setSignatureData(canvas.toDataURL("image/png"));
  }

  /** 폼 필드 업데이트 핸들러 */
  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  /** 상담 신청 제출 */
  async function handleFormSubmit(e) {
    e.preventDefault();
    setSubmitResult(null);

    if (!form.phone?.trim() && !form.email?.trim()) {
      setSubmitResult({ type: "error", msg: "연락처(전화번호) 또는 이메일 중 최소 하나를 입력해주세요." });
      return;
    }
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
        preferredDate: form.preferredDate || undefined,
        preferredTime: form.preferredTime || undefined,
        message: form.message,
        agreed: form.agreed,
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
                      <c.icon size={22} strokeWidth={1.3} color="#b08d57" />
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
                  교대역 방면에서도 도보 이동 가능
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
                  style={{ background: "#fff" }}
                />
              </div>
            </div>

            {/* 이메일 + 상담 분야 */}
            <p style={{ fontSize: 11, color: "#999", margin: "-8px 0 8px", fontStyle: "italic" }}>
              * 전화번호 또는 이메일 중 최소 하나를 입력해주세요.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 13, color: "#555", marginBottom: 6, display: "block" }}>
                  이메일 <span style={{ color: "var(--accent-gold)" }}>*</span>
                </label>
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

            {/* 희망 상담 날짜 + 시간 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={{ fontSize: 13, color: "#555", marginBottom: 6, display: "block" }}>희망 상담 날짜</label>
                <Input
                  name="preferredDate"
                  type="date"
                  value={form.preferredDate}
                  onChange={handleFormChange}
                  min={new Date().toISOString().split("T")[0]}
                  style={{ background: "#fff" }}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, color: "#555", marginBottom: 6, display: "block" }}>희망 시간대</label>
                <Select
                  name="preferredTime"
                  value={form.preferredTime}
                  onChange={handleFormChange}
                  style={{ background: "#fff" }}
                >
                  {TIME_SLOTS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
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
            <div style={{ border: "1px solid rgba(0,0,0,0.08)", padding: "16px 20px", background: "#fafaf9" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div style={{
                    width: 20, height: 20, borderRadius: 4,
                    border: form.agreed ? "2px solid var(--accent-gold)" : "2px solid #ccc",
                    background: form.agreed ? "var(--accent-gold)" : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {form.agreed && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 13, color: form.agreed ? "#1a1a1a" : "#666" }}>
                    {form.agreed ? "개인정보 수집·이용에 동의하였습니다" : "개인정보 수집·이용 동의 (필수)"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => { setPrivacyOpen(true); setScrolledToBottom(false); }}
                  style={{
                    fontSize: 12, color: "var(--accent-gold)", background: "none",
                    border: "1px solid var(--accent-gold)", padding: "6px 14px",
                    cursor: "pointer", fontWeight: 500,
                  }}
                >
                  {form.agreed ? "다시 보기" : "동의서 확인"}
                </button>
              </div>
            </div>

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
      {/* ==================== 개인정보 동의서 모달 ==================== */}
      {privacyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setPrivacyOpen(false)}
        >
          <div
            style={{ background: "#fff", maxWidth: 600, width: "90%", maxHeight: "85vh", display: "flex", flexDirection: "column" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a" }}>개인정보 수집·이용 동의서</h3>
              <p style={{ fontSize: 12, color: "#999", marginTop: 4 }}>끝까지 읽으신 후 동의해주세요</p>
            </div>

            {/* 본문 — 스크롤 영역 */}
            <div
              ref={privacyRef}
              onScroll={handlePrivacyScroll}
              style={{ flex: 1, overflowY: "auto", padding: "24px 28px", fontSize: 13, color: "#444", lineHeight: 1.9 }}
            >
              <p style={{ fontWeight: 600, marginBottom: 12 }}>1. 개인정보의 수집·이용 목적</p>
              <p style={{ marginBottom: 16 }}>
                윤정 법률사무소는 법률 상담 서비스 제공을 위해 아래와 같이 개인정보를 수집·이용합니다.
                수집된 개인정보는 법률 상담 접수, 상담 진행 상황 안내, 담당 변호사 배정 및 연락 목적으로만
                사용됩니다.
              </p>

              <p style={{ fontWeight: 600, marginBottom: 12 }}>2. 수집하는 개인정보 항목</p>
              <p style={{ marginBottom: 8 }}><strong>필수항목:</strong> 성명, 연락처(휴대전화번호)</p>
              <p style={{ marginBottom: 16 }}><strong>선택항목:</strong> 이메일 주소, 희망 상담 일시, 상담 내용</p>

              <p style={{ fontWeight: 600, marginBottom: 12 }}>3. 개인정보의 보유 및 이용 기간</p>
              <p style={{ marginBottom: 16 }}>
                수집된 개인정보는 상담 완료일로부터 <strong>3년간</strong> 보관 후 지체 없이 파기합니다.
                다만, 관련 법령에 따라 보존이 필요한 경우에는 해당 법령에서 정한 기간 동안 보관합니다.
              </p>
              <ul style={{ marginBottom: 16, paddingLeft: 20, listStyleType: "disc" }}>
                <li>「변호사법」에 따른 사건 기록 보존: 사건 종결 후 5년</li>
                <li>「전자상거래 등에서의 소비자보호에 관한 법률」에 따른 계약 또는 청약철회 등에 관한 기록: 5년</li>
                <li>「통신비밀보호법」에 따른 통신사실확인자료: 1년</li>
              </ul>

              <p style={{ fontWeight: 600, marginBottom: 12 }}>4. 개인정보의 제3자 제공</p>
              <p style={{ marginBottom: 16 }}>
                윤정 법률사무소는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
                다만, 다음의 경우에는 예외로 합니다.
              </p>
              <ul style={{ marginBottom: 16, paddingLeft: 20, listStyleType: "disc" }}>
                <li>정보주체로부터 별도의 동의를 받은 경우</li>
                <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
              </ul>

              <p style={{ fontWeight: 600, marginBottom: 12 }}>5. 개인정보의 파기 절차 및 방법</p>
              <p style={{ marginBottom: 16 }}>
                보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다.
                전자적 파일 형태의 정보는 복구 및 재생이 불가능한 방법으로 파기하며,
                종이에 기록된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.
              </p>

              <p style={{ fontWeight: 600, marginBottom: 12 }}>6. 정보주체의 권리·의무 및 행사 방법</p>
              <p style={{ marginBottom: 16 }}>
                정보주체는 개인정보의 열람, 정정·삭제, 처리정지를 요구할 수 있습니다.
                이러한 요청은 전화(02-594-5583) 또는 이메일(younsehwan@younjeong.com)을 통해
                하실 수 있으며, 지체 없이 조치하겠습니다.
              </p>

              <p style={{ fontWeight: 600, marginBottom: 12 }}>7. 개인정보 보호책임자</p>
              <p style={{ marginBottom: 8 }}>성명: 윤세환 변호사</p>
              <p style={{ marginBottom: 8 }}>연락처: 02-594-5583</p>
              <p style={{ marginBottom: 16 }}>이메일: younsehwan@younjeong.com</p>

              <p style={{ fontWeight: 600, marginBottom: 12 }}>8. 동의를 거부할 권리 및 불이익</p>
              <p style={{ marginBottom: 16 }}>
                귀하는 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다.
                다만, 필수항목에 대한 동의를 거부하실 경우 상담 신청 접수가 불가합니다.
              </p>

              <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 16, marginTop: 8 }}>
                <p style={{ fontSize: 11, color: "#999" }}>
                  본 동의서는 「개인정보 보호법」 제15조(개인정보의 수집·이용), 제17조(개인정보의 제공),
                  제22조(동의를 받는 방법) 및 동법 시행령에 근거하여 작성되었습니다.
                </p>
              </div>
            </div>

            {/* 서명 + 버튼 */}
            <div style={{ padding: "16px 28px 24px", borderTop: "1px solid rgba(0,0,0,0.08)" }}>
              {scrolledToBottom && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontSize: 13, color: "#555", marginBottom: 8, fontWeight: 500 }}>
                    본인 이름을 서명해주세요
                  </p>
                  <div style={{ border: "1px solid rgba(0,0,0,0.15)", background: "#fff", position: "relative" }}>
                    <canvas
                      ref={sigCanvasRef}
                      width={680} height={240}
                      style={{ width: "100%", height: 140, touchAction: "none", cursor: "crosshair", background: "#fff" }}
                      onMouseDown={sigStart} onMouseMove={sigMove} onMouseUp={sigEnd} onMouseLeave={sigEnd}
                      onTouchStart={sigStart} onTouchMove={sigMove} onTouchEnd={sigEnd}
                    />
                    {!signatureData && (
                      <p style={{
                        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                        fontSize: 12, color: "#ccc", pointerEvents: "none",
                      }}>
                        여기에 이름을 서명하세요
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2" style={{ marginTop: 8 }}>
                    <button type="button" onClick={sigClear}
                      style={{ fontSize: 11, color: "#999", background: "none", border: "1px solid #ddd", padding: "4px 12px", cursor: "pointer" }}>
                      다시 쓰기
                    </button>
                    <button type="button" onClick={sigConfirm}
                      style={{ fontSize: 11, color: "var(--accent-gold)", background: "none", border: "1px solid var(--accent-gold)", padding: "4px 12px", cursor: "pointer" }}>
                      서명 완료
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setPrivacyOpen(false)}
                  style={{
                    padding: "10px 24px", fontSize: 13, background: "#f5f5f5",
                    border: "1px solid rgba(0,0,0,0.1)", cursor: "pointer", color: "#666",
                  }}
                >
                  닫기
                </button>
                <button
                  type="button"
                  disabled={!scrolledToBottom || !signatureData}
                  onClick={() => {
                    setForm((prev) => ({ ...prev, agreed: true }));
                    setPrivacyOpen(false);
                  }}
                  style={{
                    padding: "10px 24px", fontSize: 13, fontWeight: 600,
                    background: (scrolledToBottom && signatureData) ? "var(--accent-gold)" : "#ddd",
                    color: (scrolledToBottom && signatureData) ? "#fff" : "#999",
                    border: "none", cursor: (scrolledToBottom && signatureData) ? "pointer" : "not-allowed",
                  }}
                >
                  {!scrolledToBottom ? "끝까지 읽어주세요 ↓" : !signatureData ? "서명을 완료해주세요" : "네, 확인했습니다"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
