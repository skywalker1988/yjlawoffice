/** 관리자 사이트 콘텐츠 관리 — 홈/소개/업무분야/헤더·푸터/영상/테마 통합 편집 */
import { useState, useEffect, useCallback } from "react";
import { api } from "../../utils/api";
import AdminHeroVideos from "./AdminHeroVideos";

/* ─── 디자인 토큰 ─── */
const T = {
  accent: "#b08d57",
  accentLight: "#c8a97e",
  accentDim: "rgba(176,141,87,0.08)",
  text: "#1e293b",
  textSec: "#475569",
  textMuted: "#94a3b8",
  border: "#e5e8ed",
  card: "#ffffff",
  pageBg: "#f8f9fb",
};

/* ─── 공통 스타일 ─── */
const fieldStyle = {
  width: "100%", padding: "10px 14px", fontSize: 14,
  border: "1px solid #d0d0d0", borderRadius: 6, background: "#fff",
  fontFamily: "inherit", outline: "none", boxSizing: "border-box",
};
const labelStyle = { fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 4, display: "block" };
const btnStyle = (bg = "#1a1a2e") => ({
  padding: "8px 20px", fontSize: 13, fontWeight: 500,
  color: "#fff", background: bg, border: "none", borderRadius: 4, cursor: "pointer",
});

/* ─── 탭 정의 ─── */
const TABS = [
  { key: "home", label: "홈페이지" },
  { key: "hero-videos", label: "히어로 영상" },
  { key: "about", label: "소개" },
  { key: "practice", label: "업무분야" },
  { key: "layout", label: "공통 (헤더/푸터)" },
  { key: "theme", label: "테마" },
  { key: "seo", label: "SEO" },
  { key: "announcements", label: "공지/배너" },
  { key: "history", label: "개발 일지" },
];

/* ─── SEO 페이지 목록 ─── */
const SEO_PAGES = [
  { key: "home", label: "홈페이지", url: "/" },
  { key: "about", label: "사무소 소개", url: "/about" },
  { key: "practice", label: "업무분야", url: "/practice" },
  { key: "lawyers", label: "변호사 소개", url: "/lawyers" },
  { key: "consultation", label: "상담안내", url: "/consultation" },
  { key: "blog", label: "법률 칼럼", url: "/blog" },
  { key: "cases", label: "성공 사례", url: "/cases" },
];

/* ─── 공지/배너 타입 ─── */
const ANNOUNCEMENT_TYPES = [
  { value: "banner", label: "배너" },
  { value: "popup", label: "팝업" },
  { value: "alert", label: "알림" },
];

/* ─── 공지 위치 옵션 ─── */
const ANNOUNCEMENT_POSITIONS = [
  { value: "top", label: "상단" },
  { value: "bottom", label: "하단" },
  { value: "center", label: "중앙" },
];

/* ─── 변경 이력 섹션 라벨 매핑 ─── */
const HISTORY_SECTION_LABELS = {
  "home/hero": "홈페이지 > 히어로",
  "home/stats": "홈페이지 > 주요 지표",
  "home/approach": "홈페이지 > 접근 방식",
  "home/highlights": "홈페이지 > 하이라이트",
  "home/cta": "홈페이지 > 하단 CTA",
  "about/hero": "소개 > 히어로",
  "about/philosophy": "소개 > 철학",
  "about/values": "소개 > 핵심가치",
  "about/history": "소개 > 연혁",
  "practice/hero": "업무분야 > 히어로",
  "practice/intro": "업무분야 > 소개",
  "practice/areas": "업무분야 > 목록",
  "layout/nav": "공통 > 네비게이션",
  "layout/footer": "공통 > 푸터",
  "theme/colors": "테마 > 색상",
};

/* ─── 기본값: 현재 하드코딩된 콘텐츠 ─── */
const DEFAULT_SETTINGS = {
  "home/hero": { heading: "윤정 법률사무소", subheading: "YOUNJEONG LAW OFFICE", tagline: "의뢰인의 사건을 비즈니스처럼 정교하게 관리합니다.\n첫 상담부터 판결 이후까지, 리스크를 줄이고 최선의 결론을 만들기 위해 함께합니다.", ctaPrimary: "상담 신청", ctaPrimaryLink: "/consultation", ctaSecondary: "업무분야 보기", ctaSecondaryLink: "/practice" },
  "home/stats": { items: [{ value: "1:1", label: "사건 맞춤 커뮤니케이션" }, { value: "24H", label: "신속한 초기 응답" }, { value: "100%", label: "기밀 보장 원칙" }] },
  "home/approach": { heading: "명확한 전략, 빠른 실행, 책임 있는 결과", description: "윤정 법률사무소는 사건을 단순 처리하지 않습니다. 분쟁의 원인과 증거, 상대의 전략을 정밀 분석하여 의뢰인에게 가장 실익이 큰 선택지를 제시합니다." },
  "home/highlights": { items: [{ title: "맞춤형 전략 수립", desc: "사건의 쟁점을 빠르게 분석해 의뢰인에게 최적화된 대응 전략을 제시합니다." }, { title: "신뢰 중심 커뮤니케이션", desc: "진행 상황을 투명하게 공유하고 의사결정의 모든 과정에 의뢰인을 참여시킵니다." }, { title: "풍부한 사건 수행 경험", desc: "민사·형사·가사·행정·조세 등 다양한 분야에서 실무 경험을 축적했습니다." }] },
  "home/cta": { message: "법률 문제로 고민이 있으신가요?", buttonText: "상담 예약하기 →", buttonLink: "/consultation" },
  "about/hero": { heading: "사무소 소개", subheading: "ABOUT YOUNJEONG LAW OFFICE", description: "진실된 마음으로 의뢰인의 목소리에 귀를 기울이며,\n최선의 법률적 해법을 제시합니다." },
  "about/philosophy": { heading: "신뢰를 기반으로\n결과를 만드는 로펌", description: "윤정 법률사무소는 의뢰인의 사건을 비즈니스처럼 정교하게 관리합니다. 첫 상담부터 판결 이후까지, 리스크를 줄이고 최선의 결론을 만들기 위해 함께합니다." },
  "about/values": { items: [{ title: "신뢰", subtitle: "TRUST", desc: "진행 상황을 투명하게 공유하고 의사결정의 모든 과정에 의뢰인을 참여시킵니다." }, { title: "전문성", subtitle: "EXPERTISE", desc: "민사·형사·가사·행정·조세 등 다양한 분야에서 실무 경험을 축적했습니다." }, { title: "헌신", subtitle: "DEDICATION", desc: "의뢰인의 사건을 비즈니스처럼 정교하게 관리하며, 최선의 결론을 만들기 위해 함께합니다." }, { title: "혁신", subtitle: "INNOVATION", desc: "법률 기술과 데이터 분석을 활용한 선진적 법률 서비스를 지향합니다." }] },
  "about/history": { items: [{ year: "2021", text: "윤정 법률사무소 설립" }, { year: "2022", text: "기업자문 전담팀 구성" }, { year: "2023", text: "행정소송 전문 분야 확대" }, { year: "2024", text: "서초대로 327 사무소 이전" }, { year: "2025", text: "디지털 법률 서비스 고도화" }] },
  "practice/hero": { heading: "업무분야", subheading: "PRACTICE AREAS" },
  "practice/intro": { description: "윤정 법률사무소는 다양한 법률 분야에서 축적된 경험과 전문성을 바탕으로 의뢰인에게 최적의 법률 솔루션을 제공합니다." },
  "practice/areas": { items: [
    { title: "민사 소송", subtitle: "CIVIL LITIGATION", desc: "손해배상, 계약 분쟁, 부동산, 채권추심 등 민사 전반에 걸친 소송 대리 및 자문 서비스를 제공합니다.", details: ["손해배상 청구", "계약 분쟁 해결", "부동산 관련 소송", "채권추심 및 강제집행"] },
    { title: "형사 변호", subtitle: "CRIMINAL DEFENSE", desc: "수사 단계부터 재판까지 의뢰인의 권리를 보호하며, 최선의 변호를 제공합니다.", details: ["수사 단계 변호", "공판 변호", "피해자 대리", "범죄 피해 구제"] },
    { title: "가사 법률", subtitle: "FAMILY LAW", desc: "이혼, 상속, 양육권 등 가사 분야에서 의뢰인의 권익을 세심하게 보호합니다.", details: ["이혼 소송 및 조정", "재산분할", "양육권·면접교섭", "상속·유언"] },
    { title: "기업 법무", subtitle: "CORPORATE LAW", desc: "기업의 설립부터 운영, M&A까지 기업 활동 전반에 대한 법률 자문을 제공합니다.", details: ["기업 설립 및 구조조정", "M&A 자문", "계약서 검토 및 작성", "컴플라이언스"] },
    { title: "행정 소송", subtitle: "ADMINISTRATIVE LAW", desc: "행정처분 취소, 인허가 쟁송, 국가배상 등 행정법 분야의 전문 법률 서비스를 제공합니다.", details: ["행정처분 취소소송", "인허가 관련 쟁송", "국가배상 청구", "공법상 당사자소송"] },
    { title: "조세 법률", subtitle: "TAX LAW", desc: "세무 조사 대응, 조세 불복, 세금 관련 분쟁 해결 등 조세 분야 법률 서비스를 제공합니다.", details: ["세무 조사 대응", "조세 불복 심판·소송", "세금 관련 분쟁", "절세 컨설팅"] },
    { title: "부동산", subtitle: "REAL ESTATE", desc: "부동산 거래, 임대차, 재개발·재건축 등 부동산 관련 법률 서비스를 제공합니다.", details: ["매매·임대차 분쟁", "재개발·재건축", "등기 관련 소송", "건축 분쟁"] },
    { title: "계약서 작성·검토", subtitle: "CONTRACT REVIEW", desc: "각종 계약서의 작성, 검토, 수정을 통해 법적 리스크를 사전에 차단합니다.", details: ["계약서 작성·검토", "약관 검토", "MOU 작성", "국제 계약"] },
    { title: "내용증명", subtitle: "CERTIFIED MAIL", desc: "채권 추심, 계약 해지 등 법적 효력이 있는 내용증명 작성 및 발송을 대행합니다.", details: ["채권 추심 내용증명", "계약 해지 통보", "권리 주장 서면", "답변서 작성"] },
    { title: "합의 대행", subtitle: "SETTLEMENT NEGOTIATION", desc: "소송 전 합의 및 협상을 통해 의뢰인에게 최적의 결과를 도출합니다.", details: ["소송 전 합의 대행", "손해배상 협상", "분쟁 조정", "화해 절차"] },
    { title: "종합 법률상담", subtitle: "GENERAL CONSULTATION", desc: "다양한 법률 문제에 대한 종합적인 상담 및 자문 서비스를 제공합니다.", details: ["초기 법률 상담", "법률 의견서 작성", "리스크 진단", "분쟁 예방 자문"] },
  ] },
  "layout/nav": { items: [{ to: "/about", label: "사무소 소개" }, { to: "/practice", label: "업무분야" }, { to: "/lawyers", label: "변호사 소개" }, { to: "/consultation", label: "상담안내" }, { to: "/blog", label: "법률 칼럼" }, { to: "/cases", label: "성공 사례" }] },
  "layout/footer": { companyName: "윤정 법률사무소", tagline: "진실된 마음으로 의뢰인의 목소리에 귀를 기울이며\n최선의 법률적 해법을 제시합니다", address: "서울특별시 서초구 서초대로 327, 5층", tel: "02-594-5583", fax: "02-594-5584", hours: "평일 09:00 - 18:00", note: "예약 상담 우선 진행", copyright: "© 2025-2026 윤정 법률사무소 YOUNJEONG LAW OFFICE. All Rights Reserved." },
  "theme/colors": { accentGold: "#b08d57", accentGoldHover: "#9a7a48", heroDark: "#0f1923", textPrimary: "#1a1a1a", textSecondary: "#555" },
};

/* ─── 헬퍼: 깊은 복사 ─── */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/* ─── 섹션 카드 래퍼 ─── */
function SectionCard({ title, children }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
      padding: 24, marginBottom: 24,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div style={{ width: 3, height: 18, background: T.accent, borderRadius: 2 }} />
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
          textTransform: "uppercase", color: T.textSec,
        }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

/* ─── 반복 항목 서브카드 ─── */
function ItemCard({ children, onRemove }) {
  return (
    <div style={{
      border: `1px solid ${T.border}`, borderRadius: 8, padding: 16,
      marginBottom: 12, background: T.pageBg, position: "relative",
    }}>
      {onRemove && (
        <button onClick={onRemove} style={{
          position: "absolute", top: 8, right: 8, background: "none",
          border: "none", cursor: "pointer", color: "#c00", fontSize: 16, lineHeight: 1,
        }} title="삭제">x</button>
      )}
      {children}
    </div>
  );
}

/* ─── 항목 추가 버튼 ─── */
function AddButton({ onClick, label }) {
  return (
    <button onClick={onClick} style={{
      padding: "6px 16px", fontSize: 12, fontWeight: 500,
      color: T.accent, background: T.accentDim, border: `1px dashed ${T.accent}`,
      borderRadius: 6, cursor: "pointer",
    }}>
      + {label}
    </button>
  );
}

/* ─── 필드 그리드 ─── */
function FieldRow({ children, cols = 2 }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 12, marginBottom: 12,
    }}>
      {children}
    </div>
  );
}

function Field({ label: lbl, value, onChange, multiline, rows = 3, type = "text", placeholder }) {
  return (
    <div>
      <label style={labelStyle}>{lbl}</label>
      {multiline ? (
        <textarea style={{ ...fieldStyle, minHeight: rows * 24, resize: "vertical" }}
          value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      ) : (
        <input type={type} style={fieldStyle}
          value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

/* ====================================================================
 *  메인 컴포넌트
 * ==================================================================== */
export default function AdminSiteManager() {
  const [activeTab, setActiveTab] = useState("home");
  const [settings, setSettings] = useState(() => deepClone(DEFAULT_SETTINGS));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  /* 업무분야 아코디언 열림 상태 */
  const [expandedAreas, setExpandedAreas] = useState({});

  /* ─── SEO 상태 ─── */
  const [seoPage, setSeoPage] = useState("home");
  const [seoData, setSeoData] = useState({});
  const [seoSaving, setSeoSaving] = useState(false);

  /* ─── 공지/배너 상태 ─── */
  const [announcements, setAnnouncements] = useState([]);
  const [announcementForm, setAnnouncementForm] = useState(null);
  const [announcementSaving, setAnnouncementSaving] = useState(false);

  /* ─── 개발 일지 상태 ─── */
  const [historyEntries, setHistoryEntries] = useState([]);
  const [historyFilter, setHistoryFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);
  const [logContent, setLogContent] = useState("");

  /* ─── 미리보기 상태 ─── */
  const [previewMode, setPreviewMode] = useState(false);
  const [previewDevice, setPreviewDevice] = useState("desktop");

  /* ─── 다국어 편집 상태 ─── */
  const [editingLang, setEditingLang] = useState("ko");

  /* ─── 데이터 로드 ─── */
  useEffect(() => {
    api.get("/site-settings")
      .then((json) => {
        const rows = json.data ?? [];
        const merged = deepClone(DEFAULT_SETTINGS);
        rows.forEach((row) => {
          if (merged[row.key] !== undefined) {
            try {
              const parsed = typeof row.value === "string" ? JSON.parse(row.value) : row.value;
              merged[row.key] = { ...merged[row.key], ...parsed };
            } catch {
              /* 파싱 실패 시 기본값 유지 */
            }
          }
        });
        setSettings(merged);
      })
      .catch(() => {
        /* API 없으면 기본값 사용 */
      })
      .finally(() => setLoading(false));
  }, []);

  /* ─── 설정값 업데이트 헬퍼 ─── */
  const update = useCallback((sectionKey, field, value) => {
    setSettings((prev) => {
      const next = deepClone(prev);
      if (field) {
        next[sectionKey][field] = value;
      } else {
        next[sectionKey] = value;
      }
      return next;
    });
    setDirty(true);
  }, []);

  /* 반복 항목 내부 필드 업데이트 */
  const updateItem = useCallback((sectionKey, idx, field, value) => {
    setSettings((prev) => {
      const next = deepClone(prev);
      next[sectionKey].items[idx][field] = value;
      return next;
    });
    setDirty(true);
  }, []);

  /* 반복 항목 추가 */
  const addItem = useCallback((sectionKey, template) => {
    setSettings((prev) => {
      const next = deepClone(prev);
      next[sectionKey].items.push(template);
      return next;
    });
    setDirty(true);
  }, []);

  /* 반복 항목 삭제 */
  const removeItem = useCallback((sectionKey, idx) => {
    setSettings((prev) => {
      const next = deepClone(prev);
      next[sectionKey].items.splice(idx, 1);
      return next;
    });
    setDirty(true);
  }, []);

  /* 업무분야 상세(details) 배열 업데이트 */
  const updateDetail = useCallback((idx, detailIdx, value) => {
    setSettings((prev) => {
      const next = deepClone(prev);
      next["practice/areas"].items[idx].details[detailIdx] = value;
      return next;
    });
    setDirty(true);
  }, []);

  const addDetail = useCallback((idx) => {
    setSettings((prev) => {
      const next = deepClone(prev);
      next["practice/areas"].items[idx].details.push("");
      return next;
    });
    setDirty(true);
  }, []);

  const removeDetail = useCallback((idx, detailIdx) => {
    setSettings((prev) => {
      const next = deepClone(prev);
      next["practice/areas"].items[idx].details.splice(detailIdx, 1);
      return next;
    });
    setDirty(true);
  }, []);

  /* ─── 저장 ─── */
  const save = async () => {
    setSaving(true);
    try {
      /* 변경된 섹션만 전송 */
      const changedSections = {};
      Object.keys(settings).forEach((key) => {
        changedSections[key] = settings[key];
      });
      await api.post("/site-settings/bulk", { settings: changedSections });
      setDirty(false);
      setToast("저장되었습니다");
      setTimeout(() => setToast(""), 2500);
    } catch (err) {
      alert("저장 실패: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ─── 취소 (기본값으로 되돌림) ─── */
  const cancel = () => {
    setSettings(deepClone(DEFAULT_SETTINGS));
    setDirty(false);
  };

  const s = settings; // 단축 참조

  /* ─── 아코디언 토글 ─── */
  const toggleArea = (idx) => {
    setExpandedAreas((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  /* ════════════════════════════════════════════════════════════════════
   *  탭 콘텐츠 렌더러
   * ════════════════════════════════════════════════════════════════════ */

  const renderHome = () => (
    <>
      {/* 히어로 */}
      <SectionCard title="히어로">
        <FieldRow>
          <Field label="제목" value={s["home/hero"].heading} onChange={(v) => update("home/hero", "heading", v)} />
          <Field label="부제목" value={s["home/hero"].subheading} onChange={(v) => update("home/hero", "subheading", v)} />
        </FieldRow>
        <Field label="태그라인" value={s["home/hero"].tagline} onChange={(v) => update("home/hero", "tagline", v)} multiline rows={2} />
        <FieldRow>
          <Field label="CTA 버튼1 텍스트" value={s["home/hero"].ctaPrimary} onChange={(v) => update("home/hero", "ctaPrimary", v)} />
          <Field label="CTA 버튼1 링크" value={s["home/hero"].ctaPrimaryLink} onChange={(v) => update("home/hero", "ctaPrimaryLink", v)} />
        </FieldRow>
        <FieldRow>
          <Field label="CTA 버튼2 텍스트" value={s["home/hero"].ctaSecondary} onChange={(v) => update("home/hero", "ctaSecondary", v)} />
          <Field label="CTA 버튼2 링크" value={s["home/hero"].ctaSecondaryLink} onChange={(v) => update("home/hero", "ctaSecondaryLink", v)} />
        </FieldRow>
      </SectionCard>

      {/* 주요 지표 */}
      <SectionCard title="주요 지표">
        {s["home/stats"].items.map((item, i) => (
          <ItemCard key={i} onRemove={s["home/stats"].items.length > 1 ? () => removeItem("home/stats", i) : undefined}>
            <FieldRow>
              <Field label="수치" value={item.value} onChange={(v) => updateItem("home/stats", i, "value", v)} />
              <Field label="설명" value={item.label} onChange={(v) => updateItem("home/stats", i, "label", v)} />
            </FieldRow>
          </ItemCard>
        ))}
        <AddButton onClick={() => addItem("home/stats", { value: "", label: "" })} label="지표 추가" />
      </SectionCard>

      {/* 접근 방식 */}
      <SectionCard title="접근 방식">
        <Field label="제목" value={s["home/approach"].heading} onChange={(v) => update("home/approach", "heading", v)} />
        <div style={{ marginTop: 12 }}>
          <Field label="설명" value={s["home/approach"].description} onChange={(v) => update("home/approach", "description", v)} multiline rows={3} />
        </div>
      </SectionCard>

      {/* 하이라이트 */}
      <SectionCard title="하이라이트">
        {s["home/highlights"].items.map((item, i) => (
          <ItemCard key={i} onRemove={s["home/highlights"].items.length > 1 ? () => removeItem("home/highlights", i) : undefined}>
            <Field label="제목" value={item.title} onChange={(v) => updateItem("home/highlights", i, "title", v)} />
            <div style={{ marginTop: 8 }}>
              <Field label="설명" value={item.desc} onChange={(v) => updateItem("home/highlights", i, "desc", v)} multiline rows={2} />
            </div>
          </ItemCard>
        ))}
        <AddButton onClick={() => addItem("home/highlights", { title: "", desc: "" })} label="하이라이트 추가" />
      </SectionCard>

      {/* 하단 CTA */}
      <SectionCard title="하단 CTA">
        <Field label="메시지" value={s["home/cta"].message} onChange={(v) => update("home/cta", "message", v)} />
        <FieldRow>
          <Field label="버튼 텍스트" value={s["home/cta"].buttonText} onChange={(v) => update("home/cta", "buttonText", v)} />
          <Field label="버튼 링크" value={s["home/cta"].buttonLink} onChange={(v) => update("home/cta", "buttonLink", v)} />
        </FieldRow>
      </SectionCard>
    </>
  );

  const renderAbout = () => (
    <>
      {/* 히어로 */}
      <SectionCard title="히어로">
        <FieldRow>
          <Field label="제목" value={s["about/hero"].heading} onChange={(v) => update("about/hero", "heading", v)} />
          <Field label="부제목" value={s["about/hero"].subheading} onChange={(v) => update("about/hero", "subheading", v)} />
        </FieldRow>
        <div style={{ marginTop: 12 }}>
          <Field label="설명" value={s["about/hero"].description} onChange={(v) => update("about/hero", "description", v)} multiline rows={2} />
        </div>
      </SectionCard>

      {/* 철학 */}
      <SectionCard title="철학">
        <Field label="제목" value={s["about/philosophy"].heading} onChange={(v) => update("about/philosophy", "heading", v)} multiline rows={2} />
        <div style={{ marginTop: 12 }}>
          <Field label="설명" value={s["about/philosophy"].description} onChange={(v) => update("about/philosophy", "description", v)} multiline rows={3} />
        </div>
      </SectionCard>

      {/* 핵심가치 */}
      <SectionCard title="핵심가치">
        {s["about/values"].items.map((item, i) => (
          <ItemCard key={i} onRemove={s["about/values"].items.length > 1 ? () => removeItem("about/values", i) : undefined}>
            <FieldRow cols={3}>
              <Field label="제목" value={item.title} onChange={(v) => updateItem("about/values", i, "title", v)} />
              <Field label="부제목 (영문)" value={item.subtitle} onChange={(v) => updateItem("about/values", i, "subtitle", v)} />
              <Field label="설명" value={item.desc} onChange={(v) => updateItem("about/values", i, "desc", v)} />
            </FieldRow>
          </ItemCard>
        ))}
        <AddButton onClick={() => addItem("about/values", { title: "", subtitle: "", desc: "" })} label="가치 추가" />
      </SectionCard>

      {/* 연혁 */}
      <SectionCard title="연혁">
        {s["about/history"].items.map((item, i) => (
          <ItemCard key={i} onRemove={s["about/history"].items.length > 1 ? () => removeItem("about/history", i) : undefined}>
            <FieldRow>
              <Field label="연도" value={item.year} onChange={(v) => updateItem("about/history", i, "year", v)} placeholder="2025" />
              <Field label="내용" value={item.text} onChange={(v) => updateItem("about/history", i, "text", v)} />
            </FieldRow>
          </ItemCard>
        ))}
        <AddButton onClick={() => addItem("about/history", { year: "", text: "" })} label="연혁 추가" />
      </SectionCard>
    </>
  );

  const renderPractice = () => (
    <>
      {/* 히어로 */}
      <SectionCard title="히어로">
        <FieldRow>
          <Field label="제목" value={s["practice/hero"].heading} onChange={(v) => update("practice/hero", "heading", v)} />
          <Field label="부제목" value={s["practice/hero"].subheading} onChange={(v) => update("practice/hero", "subheading", v)} />
        </FieldRow>
      </SectionCard>

      {/* 소개 */}
      <SectionCard title="소개">
        <Field label="설명" value={s["practice/intro"].description} onChange={(v) => update("practice/intro", "description", v)} multiline rows={3} />
      </SectionCard>

      {/* 업무분야 목록 */}
      <SectionCard title="업무분야 목록">
        {s["practice/areas"].items.map((item, i) => {
          const isOpen = expandedAreas[i];
          return (
            <div key={i} style={{
              border: `1px solid ${T.border}`, borderRadius: 8, marginBottom: 12,
              background: T.pageBg, overflow: "hidden",
            }}>
              {/* 아코디언 헤더 */}
              <div
                onClick={() => toggleArea(i)}
                style={{
                  padding: "12px 16px", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: isOpen ? T.accentDim : "transparent",
                  transition: "background 0.2s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{item.title || "(제목 없음)"}</span>
                  <span style={{ fontSize: 11, color: T.textMuted }}>{item.subtitle}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {s["practice/areas"].items.length > 1 && (
                    <button onClick={(e) => { e.stopPropagation(); removeItem("practice/areas", i); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#c00", fontSize: 13, padding: "2px 6px" }}>
                      삭제
                    </button>
                  )}
                  <span style={{ fontSize: 16, color: T.textMuted, transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
                    ▾
                  </span>
                </div>
              </div>

              {/* 아코디언 본문 */}
              {isOpen && (
                <div style={{ padding: 16 }}>
                  <FieldRow>
                    <Field label="제목" value={item.title} onChange={(v) => updateItem("practice/areas", i, "title", v)} />
                    <Field label="부제목 (영문)" value={item.subtitle} onChange={(v) => updateItem("practice/areas", i, "subtitle", v)} />
                  </FieldRow>
                  <Field label="설명" value={item.desc} onChange={(v) => updateItem("practice/areas", i, "desc", v)} multiline rows={2} />

                  <div style={{ marginTop: 16 }}>
                    <label style={{ ...labelStyle, marginBottom: 8 }}>상세 항목</label>
                    {item.details.map((d, di) => (
                      <div key={di} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                        <input style={{ ...fieldStyle, flex: 1 }} value={d}
                          onChange={(e) => updateDetail(i, di, e.target.value)} />
                        {item.details.length > 1 && (
                          <button onClick={() => removeDetail(i, di)}
                            style={{ background: "none", border: "1px solid #ddd", borderRadius: 4, cursor: "pointer", color: "#c00", padding: "0 10px", fontSize: 13 }}>
                            x
                          </button>
                        )}
                      </div>
                    ))}
                    <AddButton onClick={() => addDetail(i)} label="상세 추가" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        <AddButton
          onClick={() => addItem("practice/areas", { title: "", subtitle: "", desc: "", details: [""] })}
          label="업무분야 추가"
        />
      </SectionCard>
    </>
  );

  const renderLayout = () => (
    <>
      {/* 네비게이션 */}
      <SectionCard title="네비게이션">
        {s["layout/nav"].items.map((item, i) => (
          <ItemCard key={i} onRemove={s["layout/nav"].items.length > 1 ? () => removeItem("layout/nav", i) : undefined}>
            <FieldRow>
              <Field label="표시 텍스트" value={item.label} onChange={(v) => updateItem("layout/nav", i, "label", v)} />
              <Field label="경로" value={item.to} onChange={(v) => updateItem("layout/nav", i, "to", v)} placeholder="/about" />
            </FieldRow>
          </ItemCard>
        ))}
        <AddButton onClick={() => addItem("layout/nav", { to: "/", label: "" })} label="메뉴 추가" />
      </SectionCard>

      {/* 푸터 */}
      <SectionCard title="푸터">
        <FieldRow>
          <Field label="회사명" value={s["layout/footer"].companyName} onChange={(v) => update("layout/footer", "companyName", v)} />
          <Field label="전화번호" value={s["layout/footer"].tel} onChange={(v) => update("layout/footer", "tel", v)} />
        </FieldRow>
        <Field label="태그라인" value={s["layout/footer"].tagline} onChange={(v) => update("layout/footer", "tagline", v)} multiline rows={2} />
        <FieldRow>
          <Field label="주소" value={s["layout/footer"].address} onChange={(v) => update("layout/footer", "address", v)} />
          <Field label="팩스" value={s["layout/footer"].fax} onChange={(v) => update("layout/footer", "fax", v)} />
        </FieldRow>
        <FieldRow>
          <Field label="운영시간" value={s["layout/footer"].hours} onChange={(v) => update("layout/footer", "hours", v)} />
          <Field label="비고" value={s["layout/footer"].note} onChange={(v) => update("layout/footer", "note", v)} />
        </FieldRow>
        <Field label="저작권 표시" value={s["layout/footer"].copyright} onChange={(v) => update("layout/footer", "copyright", v)} />
      </SectionCard>
    </>
  );

  const renderTheme = () => {
    const colors = s["theme/colors"];
    const colorFields = [
      { key: "accentGold", label: "악센트 골드" },
      { key: "accentGoldHover", label: "악센트 골드 (호버)" },
      { key: "heroDark", label: "히어로 배경 (다크)" },
      { key: "textPrimary", label: "기본 텍스트" },
      { key: "textSecondary", label: "보조 텍스트" },
    ];

    return (
      <SectionCard title="테마 색상">
        {colorFields.map((cf) => (
          <div key={cf.key} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <input
              type="color"
              value={colors[cf.key]}
              onChange={(e) => {
                const next = { ...colors, [cf.key]: e.target.value };
                update("theme/colors", null, next);
              }}
              style={{ width: 40, height: 36, border: `1px solid ${T.border}`, borderRadius: 4, cursor: "pointer", padding: 2 }}
            />
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>{cf.label}</label>
              <input style={{ ...fieldStyle, maxWidth: 200 }}
                value={colors[cf.key]}
                onChange={(e) => {
                  const next = { ...colors, [cf.key]: e.target.value };
                  update("theme/colors", null, next);
                }}
                placeholder="#000000"
              />
            </div>
          </div>
        ))}
      </SectionCard>
    );
  };

  /* ════════════════════════════════════════════════════════════════════
   *  SEO 관리 탭
   * ════════════════════════════════════════════════════════════════════ */
  const loadSeoPage = useCallback((pageKey) => {
    api.get(`/site-settings?key=seo/${pageKey}`).then((json) => {
      const rows = json.data ?? [];
      const row = rows.find((r) => r.key === `seo/${pageKey}`);
      if (row) {
        try {
          const parsed = typeof row.value === "string" ? JSON.parse(row.value) : row.value;
          setSeoData((prev) => ({ ...prev, [pageKey]: parsed }));
        } catch {
          setSeoData((prev) => ({ ...prev, [pageKey]: {} }));
        }
      } else {
        setSeoData((prev) => ({ ...prev, [pageKey]: prev[pageKey] || {} }));
      }
    }).catch(() => {});
  }, []);

  const saveSeoPage = async (pageKey) => {
    setSeoSaving(true);
    try {
      await api.post("/site-settings/bulk", {
        settings: { [`seo/${pageKey}`]: seoData[pageKey] || {} },
      });
      setToast("SEO 설정이 저장되었습니다");
      setTimeout(() => setToast(""), 2500);
    } catch (err) {
      alert("SEO 저장 실패: " + err.message);
    } finally {
      setSeoSaving(false);
    }
  };

  /* SEO 페이지 전환 시 로드 */
  useEffect(() => {
    if (activeTab === "seo") {
      loadSeoPage(seoPage);
    }
  }, [activeTab, seoPage, loadSeoPage]);

  const updateSeo = (field, value) => {
    setSeoData((prev) => ({
      ...prev,
      [seoPage]: { ...(prev[seoPage] || {}), [field]: value },
    }));
  };

  const renderSEO = () => {
    const data = seoData[seoPage] || {};
    const pageInfo = SEO_PAGES.find((p) => p.key === seoPage);
    const descLen = (data.metaDescription || "").length;
    const siteUrl = "https://yjlaw.co.kr";

    return (
      <>
        {/* 페이지 서브탭 */}
        <div style={{
          display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap",
        }}>
          {SEO_PAGES.map((p) => (
            <button
              key={p.key}
              onClick={() => setSeoPage(p.key)}
              style={{
                padding: "6px 14px", fontSize: 12, fontWeight: seoPage === p.key ? 600 : 400,
                color: seoPage === p.key ? "#fff" : T.textSec,
                background: seoPage === p.key ? T.accent : T.accentDim,
                border: "none", borderRadius: 4, cursor: "pointer",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <SectionCard title={`SEO 설정 — ${pageInfo?.label || seoPage}`}>
          <Field
            label="메타 타이틀"
            value={data.metaTitle || ""}
            onChange={(v) => updateSeo("metaTitle", v)}
            placeholder="페이지 제목 (60자 이내 권장)"
          />
          <div style={{ marginTop: 12 }}>
            <label style={labelStyle}>메타 설명</label>
            <textarea
              style={{ ...fieldStyle, minHeight: 72, resize: "vertical" }}
              value={data.metaDescription || ""}
              onChange={(e) => updateSeo("metaDescription", e.target.value)}
              placeholder="페이지 설명 (160자 이내 권장)"
            />
            <div style={{
              fontSize: 11, marginTop: 4, textAlign: "right",
              color: descLen > 160 ? "#dc2626" : T.textMuted,
            }}>
              {descLen}/160
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <Field
              label="키워드"
              value={data.keywords || ""}
              onChange={(v) => updateSeo("keywords", v)}
              placeholder="쉼표로 구분 (예: 법률사무소, 변호사, 상담)"
            />
          </div>
          <div style={{ marginTop: 12 }}>
            <Field
              label="OG 이미지 URL"
              value={data.ogImage || ""}
              onChange={(v) => updateSeo("ogImage", v)}
              placeholder="https://example.com/og-image.jpg"
            />
          </div>
        </SectionCard>

        {/* Google 검색 미리보기 */}
        <SectionCard title="Google 검색 미리보기">
          <div style={{
            background: "#fff", border: "1px solid #e0e0e0", borderRadius: 8,
            padding: 20, maxWidth: 600,
          }}>
            <div style={{
              fontSize: 18, color: "#1a0dab", fontWeight: 400,
              marginBottom: 4, cursor: "pointer",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {data.metaTitle || `${pageInfo?.label || ""} | 윤정 법률사무소`}
            </div>
            <div style={{ fontSize: 13, color: "#006621", marginBottom: 4 }}>
              {siteUrl}{pageInfo?.url || "/"}
            </div>
            <div style={{
              fontSize: 13, color: "#545454", lineHeight: 1.5,
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical", overflow: "hidden",
            }}>
              {data.metaDescription || "메타 설명을 입력하면 여기에 표시됩니다."}
            </div>
          </div>
        </SectionCard>

        {/* SEO 저장 버튼 */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button
            onClick={() => saveSeoPage(seoPage)}
            disabled={seoSaving}
            style={btnStyle(T.accent)}
          >
            {seoSaving ? "저장 중..." : "SEO 저장"}
          </button>
        </div>
      </>
    );
  };

  /* ════════════════════════════════════════════════════════════════════
   *  공지/배너 관리 탭
   * ════════════════════════════════════════════════════════════════════ */
  const loadAnnouncements = useCallback(() => {
    api.get("/announcements").then((json) => {
      setAnnouncements(json.data ?? []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === "announcements") loadAnnouncements();
  }, [activeTab, loadAnnouncements]);

  const newAnnouncementTemplate = () => ({
    type: "banner",
    title: "",
    content: "",
    linkUrl: "",
    bgColor: "#b08d57",
    textColor: "#ffffff",
    isActive: true,
    startDate: "",
    endDate: "",
    position: "top",
  });

  const saveAnnouncement = async () => {
    if (!announcementForm) return;
    setAnnouncementSaving(true);
    try {
      if (announcementForm.id) {
        await api.patch(`/announcements/${announcementForm.id}`, announcementForm);
      } else {
        await api.post("/announcements", announcementForm);
      }
      setAnnouncementForm(null);
      loadAnnouncements();
      setToast("공지가 저장되었습니다");
      setTimeout(() => setToast(""), 2500);
    } catch (err) {
      alert("저장 실패: " + err.message);
    } finally {
      setAnnouncementSaving(false);
    }
  };

  const deleteAnnouncement = async (id) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/announcements/${id}`);
      loadAnnouncements();
      setToast("삭제되었습니다");
      setTimeout(() => setToast(""), 2500);
    } catch (err) {
      alert("삭제 실패: " + err.message);
    }
  };

  const toggleAnnouncementActive = async (ann) => {
    try {
      await api.patch(`/announcements/${ann.id}`, { isActive: !ann.isActive });
      loadAnnouncements();
    } catch (err) {
      alert("변경 실패: " + err.message);
    }
  };

  const updateAnnForm = (field, value) => {
    setAnnouncementForm((prev) => ({ ...prev, [field]: value }));
  };

  const renderAnnouncements = () => {
    /* 편집 폼 모드 */
    if (announcementForm) {
      const f = announcementForm;
      return (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: T.text }}>
              {f.id ? "공지 수정" : "새 공지 작성"}
            </h3>
            <button onClick={() => setAnnouncementForm(null)} style={btnStyle("#999")}>
              목록으로
            </button>
          </div>

          <SectionCard title="기본 정보">
            <FieldRow>
              <div>
                <label style={labelStyle}>유형</label>
                <select
                  style={fieldStyle}
                  value={f.type}
                  onChange={(e) => updateAnnForm("type", e.target.value)}
                >
                  {ANNOUNCEMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>위치</label>
                <select
                  style={fieldStyle}
                  value={f.position}
                  onChange={(e) => updateAnnForm("position", e.target.value)}
                >
                  {ANNOUNCEMENT_POSITIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </FieldRow>
            <Field label="제목" value={f.title} onChange={(v) => updateAnnForm("title", v)} />
            <div style={{ marginTop: 12 }}>
              <Field label="내용" value={f.content} onChange={(v) => updateAnnForm("content", v)} multiline rows={4} />
            </div>
            <div style={{ marginTop: 12 }}>
              <Field label="링크 URL" value={f.linkUrl} onChange={(v) => updateAnnForm("linkUrl", v)} placeholder="https://" />
            </div>
          </SectionCard>

          <SectionCard title="스타일">
            <FieldRow>
              <div>
                <label style={labelStyle}>배경색</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="color" value={f.bgColor} onChange={(e) => updateAnnForm("bgColor", e.target.value)}
                    style={{ width: 40, height: 36, border: `1px solid ${T.border}`, borderRadius: 4, cursor: "pointer", padding: 2 }} />
                  <input style={{ ...fieldStyle, maxWidth: 140 }} value={f.bgColor}
                    onChange={(e) => updateAnnForm("bgColor", e.target.value)} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>텍스트 색상</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="color" value={f.textColor} onChange={(e) => updateAnnForm("textColor", e.target.value)}
                    style={{ width: 40, height: 36, border: `1px solid ${T.border}`, borderRadius: 4, cursor: "pointer", padding: 2 }} />
                  <input style={{ ...fieldStyle, maxWidth: 140 }} value={f.textColor}
                    onChange={(e) => updateAnnForm("textColor", e.target.value)} />
                </div>
              </div>
            </FieldRow>
            {/* 미리보기 */}
            <div style={{
              marginTop: 12, padding: "12px 20px", borderRadius: 6,
              background: f.bgColor, color: f.textColor, fontSize: 14, fontWeight: 500,
            }}>
              {f.title || "미리보기 텍스트"}
            </div>
          </SectionCard>

          <SectionCard title="일정 및 상태">
            <FieldRow>
              <Field label="시작일시" value={f.startDate} onChange={(v) => updateAnnForm("startDate", v)} type="datetime-local" />
              <Field label="종료일시" value={f.endDate} onChange={(v) => updateAnnForm("endDate", v)} type="datetime-local" />
            </FieldRow>
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
              <label style={labelStyle}>활성화</label>
              <button
                onClick={() => updateAnnForm("isActive", !f.isActive)}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
                  background: f.isActive ? "#16a34a" : "#ccc",
                  position: "relative", transition: "background 0.2s",
                }}
              >
                <span style={{
                  position: "absolute", top: 2, left: f.isActive ? 22 : 2,
                  width: 20, height: 20, borderRadius: 10, background: "#fff",
                  transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </button>
              <span style={{ fontSize: 12, color: T.textSec }}>{f.isActive ? "활성" : "비활성"}</span>
            </div>
          </SectionCard>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
            <button onClick={() => setAnnouncementForm(null)} style={btnStyle("#999")}>취소</button>
            <button onClick={saveAnnouncement} disabled={announcementSaving} style={btnStyle(T.accent)}>
              {announcementSaving ? "저장 중..." : "저장"}
            </button>
          </div>
        </>
      );
    }

    /* 목록 모드 */
    const typeBadge = (type) => {
      const map = { banner: { bg: "#dbeafe", color: "#1d4ed8" }, popup: { bg: "#fef3c7", color: "#92400e" }, alert: { bg: "#fee2e2", color: "#dc2626" } };
      const style = map[type] || { bg: "#f1f5f9", color: "#475569" };
      const labelMap = { banner: "배너", popup: "팝업", alert: "알림" };
      return (
        <span style={{
          display: "inline-block", padding: "2px 8px", fontSize: 11, fontWeight: 600,
          borderRadius: 4, background: style.bg, color: style.color,
        }}>
          {labelMap[type] || type}
        </span>
      );
    };

    return (
      <>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: T.text }}>공지/배너 목록</h3>
          <button onClick={() => setAnnouncementForm(newAnnouncementTemplate())} style={btnStyle(T.accent)}>
            + 새 공지
          </button>
        </div>

        {announcements.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.textMuted, fontSize: 14 }}>
            등록된 공지가 없습니다.
          </div>
        ) : (
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.pageBg }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: T.textSec, fontSize: 11 }}>유형</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: T.textSec, fontSize: 11 }}>제목</th>
                  <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 600, color: T.textSec, fontSize: 11 }}>상태</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: T.textSec, fontSize: 11 }}>기간</th>
                  <th style={{ padding: "10px 14px", textAlign: "center", fontWeight: 600, color: T.textSec, fontSize: 11 }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((ann) => (
                  <tr key={ann.id} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: "10px 14px" }}>{typeBadge(ann.type)}</td>
                    <td style={{ padding: "10px 14px", color: T.text }}>{ann.title}</td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <button
                        onClick={() => toggleAnnouncementActive(ann)}
                        style={{
                          width: 38, height: 20, borderRadius: 10, border: "none", cursor: "pointer",
                          background: ann.isActive ? "#16a34a" : "#ccc", position: "relative",
                        }}
                      >
                        <span style={{
                          position: "absolute", top: 2, left: ann.isActive ? 20 : 2,
                          width: 16, height: 16, borderRadius: 8, background: "#fff",
                          transition: "left 0.2s",
                        }} />
                      </button>
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: T.textMuted }}>
                      {ann.startDate ? new Date(ann.startDate).toLocaleDateString("ko-KR") : "-"}
                      {" ~ "}
                      {ann.endDate ? new Date(ann.endDate).toLocaleDateString("ko-KR") : "-"}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                        <button onClick={() => setAnnouncementForm({ ...ann })}
                          style={{ background: "none", border: "1px solid #ddd", borderRadius: 4, padding: "4px 10px", fontSize: 12, cursor: "pointer", color: T.textSec }}>
                          수정
                        </button>
                        <button onClick={() => deleteAnnouncement(ann.id)}
                          style={{ background: "none", border: "1px solid #fca5a5", borderRadius: 4, padding: "4px 10px", fontSize: 12, cursor: "pointer", color: "#dc2626" }}>
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </>
    );
  };

  /* ════════════════════════════════════════════════════════════════════
   *  개발 일지 탭 — dev-logs 마크다운 파일 뷰어
   * ════════════════════════════════════════════════════════════════════ */
  const loadHistory = useCallback(() => {
    api.get("/dev-logs").then((json) => {
      setHistoryEntries(json.data ?? []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === "history") loadHistory();
  }, [activeTab, loadHistory]);

  const openLog = async (filename) => {
    try {
      const json = await api.get(`/dev-logs/${filename}`);
      setSelectedLog(filename);
      setLogContent(json.data?.content || "");
    } catch {
      alert("파일을 불러올 수 없습니다.");
    }
  };

  const renderHistory = () => {
    /** 마크다운을 간단히 HTML로 변환 (헤딩, 볼드, 테이블, 리스트, 코드블록) */
    const md = (text) => {
      if (!text) return "";
      return text
        .replace(/^### (.+)$/gm, '<h4 style="font-size:14px;font-weight:600;color:#1a1a1a;margin:16px 0 8px">$1</h4>')
        .replace(/^## (.+)$/gm, '<h3 style="font-size:15px;font-weight:600;color:#1a1a1a;margin:20px 0 10px">$1</h3>')
        .replace(/^# (.+)$/gm, '<h2 style="font-size:17px;font-weight:600;color:#1a1a1a;margin:0 0 12px">$1</h2>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code style="background:#f0f0f0;padding:1px 5px;border-radius:3px;font-size:12px">$1</code>')
        .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #b08d57;padding:4px 12px;margin:8px 0;color:#555;background:#faf9f7">$1</blockquote>')
        .replace(/^- (.+)$/gm, '<div style="padding-left:16px;margin:2px 0">• $1</div>')
        .replace(/^\| (.+) \|$/gm, (match) => {
          const cells = match.replace(/^\| ?| ?\|$/g, "").split(" | ");
          return '<div style="display:grid;grid-template-columns:repeat(' + cells.length + ',1fr);gap:0;border-bottom:1px solid #e5e8ed;font-size:12px">' +
            cells.map(c => '<span style="padding:6px 8px">' + c.trim() + '</span>').join("") + '</div>';
        })
        .replace(/^\|[-| ]+\|$/gm, "")
        .replace(/\n/g, "<br/>");
    };

    // 상세 보기 모드
    if (selectedLog) {
      const entry = historyEntries.find(e => e.filename === selectedLog);
      return (
        <>
          <button onClick={() => { setSelectedLog(null); setLogContent(""); }}
            style={{ ...btnStyle("#666"), marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
            ← 목록으로
          </button>
          <div style={{
            background: T.card, border: `1px solid ${T.border}`, borderRadius: 10,
            padding: "28px 32px",
          }}>
            <div style={{ marginBottom: 16 }}>
              <span style={{
                display: "inline-block", padding: "3px 10px", fontSize: 11,
                fontWeight: 600, color: "#fff", background: T.accent, borderRadius: 10,
                marginBottom: 8,
              }}>
                #{entry?.number || ""}
              </span>
              <span style={{ fontSize: 12, color: T.textMuted, marginLeft: 10 }}>{entry?.date || ""}</span>
            </div>
            <div
              style={{ fontSize: 13, color: T.text, lineHeight: 1.8 }}
              dangerouslySetInnerHTML={{ __html: md(logContent) }}
            />
          </div>
        </>
      );
    }

    // 목록 보기
    return (
      <>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: T.text, marginBottom: 4 }}>개발 일지</h3>
          <p style={{ fontSize: 13, color: T.textMuted }}>
            홈페이지 개발 과정에서 어떤 프롬프트로 어떤 변경이 이루어졌는지 기록합니다. ({historyEntries.length}건)
          </p>
        </div>

        {historyEntries.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: T.textMuted, fontSize: 14 }}>
            개발 일지가 없습니다.
          </div>
        ) : (
          <div style={{ position: "relative", paddingLeft: 28 }}>
            {/* 세로 타임라인 선 */}
            <div style={{
              position: "absolute", left: 9, top: 0, bottom: 0,
              width: 2, background: T.border,
            }} />

            {historyEntries.map((entry, idx) => (
              <div key={entry.filename} style={{ position: "relative", marginBottom: 16, paddingLeft: 20 }}>
                {/* 타임라인 점 */}
                <div style={{
                  position: "absolute", left: -22, top: 8,
                  width: 12, height: 12, borderRadius: 6,
                  background: idx === 0 ? T.accent : T.border,
                  border: "2px solid #fff",
                  boxShadow: `0 0 0 2px ${idx === 0 ? T.accent : T.border}`,
                }} />

                <div
                  onClick={() => openLog(entry.filename)}
                  style={{
                    background: T.card, border: `1px solid ${T.border}`, borderRadius: 8,
                    padding: "14px 18px", cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.boxShadow = `0 2px 8px rgba(176,141,87,0.1)`; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = "none"; }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{
                      display: "inline-block", padding: "2px 8px", fontSize: 10,
                      fontWeight: 700, color: "#fff", background: T.accent, borderRadius: 8,
                    }}>
                      #{entry.number}
                    </span>
                    <span style={{ fontSize: 12, color: T.textMuted }}>{entry.date}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, color: T.text }}>
                    {entry.title || entry.slug}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  };

  /* ════════════════════════════════════════════════════════════════════
   *  다국어 토글 컴포넌트
   * ════════════════════════════════════════════════════════════════════ */
  const LangToggle = () => (
    <div style={{
      display: "flex", gap: 0, marginBottom: 16,
      border: `1px solid ${T.border}`, borderRadius: 6, overflow: "hidden", width: "fit-content",
    }}>
      {[{ key: "ko", label: "한국어" }, { key: "en", label: "English" }].map((lang) => (
        <button
          key={lang.key}
          onClick={() => setEditingLang(lang.key)}
          style={{
            padding: "6px 16px", fontSize: 12, fontWeight: editingLang === lang.key ? 600 : 400,
            color: editingLang === lang.key ? "#fff" : T.textSec,
            background: editingLang === lang.key ? T.accent : "#fff",
            border: "none", cursor: "pointer",
          }}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );

  /* ─── 다국어 키 접미사 헬퍼 ─── */
  const langKey = (baseKey) => editingLang === "en" ? `${baseKey}_en` : baseKey;

  /* ─── 다국어 업데이트 헬퍼 (영문 모드에서는 _en 키로 저장) ─── */
  const langUpdate = useCallback((sectionKey, field, value) => {
    const actualKey = editingLang === "en" ? `${sectionKey}_en` : sectionKey;
    /* _en 키가 settings에 없으면 빈 객체로 초기화 */
    setSettings((prev) => {
      const next = deepClone(prev);
      if (!next[actualKey]) next[actualKey] = {};
      if (field) {
        next[actualKey][field] = value;
      } else {
        next[actualKey] = value;
      }
      return next;
    });
    setDirty(true);
  }, [editingLang]);

  const langUpdateItem = useCallback((sectionKey, idx, field, value) => {
    const actualKey = editingLang === "en" ? `${sectionKey}_en` : sectionKey;
    setSettings((prev) => {
      const next = deepClone(prev);
      if (!next[actualKey]) next[actualKey] = { items: [] };
      if (!next[actualKey].items) next[actualKey].items = [];
      if (!next[actualKey].items[idx]) next[actualKey].items[idx] = {};
      next[actualKey].items[idx][field] = value;
      return next;
    });
    setDirty(true);
  }, [editingLang]);

  /* ─── 다국어용 값 읽기 헬퍼 ─── */
  const langGet = (sectionKey) => {
    const actualKey = editingLang === "en" ? `${sectionKey}_en` : sectionKey;
    return s[actualKey] || s[sectionKey] || {};
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "home": return <><LangToggle />{renderHome()}</>;
      case "hero-videos": return <AdminHeroVideos />;
      case "about": return <><LangToggle />{renderAbout()}</>;
      case "practice": return <><LangToggle />{renderPractice()}</>;
      case "layout": return <><LangToggle />{renderLayout()}</>;
      case "theme": return renderTheme();
      case "seo": return renderSEO();
      case "announcements": return renderAnnouncements();
      case "history": return renderHistory();
      default: return null;
    }
  };

  /* ════════════════════════════════════════════════════════════════════
   *  렌더
   * ════════════════════════════════════════════════════════════════════ */
  if (loading) {
    return <p style={{ color: "#999", fontSize: 14 }}>로딩 중...</p>;
  }

  return (
    <div>
      {/* 페이지 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "#1a1a1a" }}>사이트 콘텐츠 관리</h1>
        {["home", "about", "practice", "layout"].includes(activeTab) && (
          <button
            onClick={() => setPreviewMode(!previewMode)}
            style={{
              ...btnStyle(previewMode ? "#dc2626" : "#2563eb"),
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {previewMode ? "미리보기 닫기" : "미리보기"}
          </button>
        )}
      </div>

      {/* 탭 바 */}
      <div style={{
        display: "flex", gap: 0, borderBottom: `2px solid ${T.border}`,
        marginBottom: 28, overflowX: "auto",
      }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: "10px 22px", fontSize: 13, fontWeight: isActive ? 600 : 400,
                color: isActive ? T.accent : T.textSec,
                background: "none", border: "none", cursor: "pointer",
                borderBottom: isActive ? `2px solid ${T.accent}` : "2px solid transparent",
                marginBottom: -2, whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 탭 콘텐츠 — 미리보기 모드에 따라 레이아웃 분기 */}
      {previewMode && ["home", "about", "practice", "layout"].includes(activeTab) ? (
        <div style={{ display: "flex", gap: 16 }}>
          {/* 좌측: 에디터 */}
          <div style={{ flex: "0 0 55%", minWidth: 0, paddingBottom: dirty ? 80 : 0 }}>
            {renderTabContent()}
          </div>
          {/* 우측: 미리보기 */}
          <div style={{ flex: "0 0 45%", minWidth: 0 }}>
            <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
              {[{ key: "desktop", label: "Desktop", w: "100%" }, { key: "mobile", label: "Mobile", w: 375 }].map((d) => (
                <button
                  key={d.key}
                  onClick={() => setPreviewDevice(d.key)}
                  style={{
                    padding: "4px 12px", fontSize: 11, fontWeight: previewDevice === d.key ? 600 : 400,
                    color: previewDevice === d.key ? "#fff" : T.textSec,
                    background: previewDevice === d.key ? T.accent : T.accentDim,
                    border: "none", borderRadius: 4, cursor: "pointer",
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <div style={{
              border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden",
              background: "#f0f0f0", height: "calc(100vh - 200px)",
              display: "flex", justifyContent: "center",
            }}>
              <iframe
                src={`/${activeTab === "layout" ? "" : activeTab}?preview=1`}
                style={{
                  width: previewDevice === "mobile" ? 375 : "100%",
                  height: "100%", border: "none", background: "#fff",
                  transition: "width 0.3s",
                }}
                title="미리보기"
              />
            </div>
          </div>
        </div>
      ) : (
        <div style={{ paddingBottom: dirty ? 80 : 0 }}>
          {renderTabContent()}
        </div>
      )}

      {/* 저장 바 (dirty 상태일 때만) */}
      {dirty && !["seo", "announcements", "history"].includes(activeTab) && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
          background: T.card, borderTop: `1px solid ${T.border}`,
          padding: "12px 44px", display: "flex", alignItems: "center",
          justifyContent: "flex-end", gap: 12,
          boxShadow: "0 -2px 12px rgba(0,0,0,0.06)",
        }}>
          {toast && (
            <span style={{ marginRight: "auto", fontSize: 13, color: "#16a34a", fontWeight: 500 }}>
              {toast}
            </span>
          )}
          <button onClick={cancel} style={btnStyle("#999")}>취소</button>
          <button onClick={save} disabled={saving} style={btnStyle(T.accent)}>
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      )}

      {/* 토스트 (dirty 아닐 때도 저장 직후 표시) */}
      {!dirty && toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 100,
          background: "#16a34a", color: "#fff", padding: "10px 20px",
          borderRadius: 6, fontSize: 13, fontWeight: 500,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}>
          {toast}
        </div>
      )}
    </div>
  );
}
