/** 관리자 방문 분석 대시보드 — 조회수, 방문자, 전환율 통계 및 차트 */
import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../../utils/api";

/* ── 디자인 토큰 ── */
const T = {
  accent: "#b08d57",
  accentLight: "#d4b97a",
  accentBg: "#faf6ef",
  text: "#1e293b",
  textSec: "#475569",
  textMuted: "#94a3b8",
  border: "#e5e8ed",
  card: "#ffffff",
  bg: "#f8fafc",
  gridLine: "#f0f0f0",
  success: "#16a34a",
  danger: "#dc2626",
};

const PERIODS = [
  { label: "7일", value: "7d" },
  { label: "30일", value: "30d" },
  { label: "90일", value: "90d" },
];

/* ── 숫자 포맷 헬퍼 ── */
const formatNumber = (n) => {
  if (n == null) return "–";
  return n.toLocaleString("ko-KR");
};

const formatPercent = (n) => {
  if (n == null) return "–";
  return `${n.toFixed(1)}%`;
};

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
};

/* ══════════════════════════════════════════════════════════
   메인 컴포넌트
   ══════════════════════════════════════════════════════════ */
export default function AdminAnalytics() {
  const [period, setPeriod] = useState("30d");
  const [overview, setOverview] = useState(null);
  const [pages, setPages] = useState([]);
  const [referrers, setReferrers] = useState([]);
  const [conversion, setConversion] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ── 데이터 로드 ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ovRes, pgRes, refRes, cvRes] = await Promise.all([
        api.get(`/analytics/overview?period=${period}`),
        api.get(`/analytics/pages?period=${period}&limit=10`),
        api.get(`/analytics/referrers?period=${period}&limit=10`),
        api.get(`/analytics/consultations/conversion?period=${period}`),
      ]);
      setOverview(ovRes.data ?? null);
      setPages(pgRes.data ?? []);
      setReferrers(refRes.data ?? []);
      setConversion(cvRes.data ?? null);
    } catch {
      setOverview(null);
      setPages([]);
      setReferrers([]);
      setConversion(null);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── CSV 내보내기 ── */
  const downloadCSV = async () => {
    try {
      const res = await fetch(`/api/sb/analytics/export?period=${period}`);
      const text = await res.text();
      const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${period}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("CSV 다운로드에 실패했습니다.");
    }
  };

  /* ── 일 평균 조회수 계산 ── */
  const avgPerDay = overview?.viewsPerDay?.length
    ? Math.round(overview.totalViews / overview.viewsPerDay.length)
    : 0;

  /* ── 요약 카드 데이터 ── */
  const summaryCards = [
    { label: "전체 조회수", value: formatNumber(overview?.totalViews), icon: "👁" },
    { label: "순방문자", value: formatNumber(overview?.uniqueVisitors), icon: "👤" },
    { label: "일 평균 조회수", value: formatNumber(avgPerDay), icon: "📊" },
    { label: "상담 전환율", value: formatPercent(conversion?.rate), icon: "📈" },
  ];

  return (
    <div style={{ padding: "32px", maxWidth: 1200, margin: "0 auto" }}>
      {/* ── 헤더 ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, margin: 0 }}>
            방문 분석
          </h1>
          <p style={{ fontSize: 14, color: T.textMuted, marginTop: 4 }}>
            사이트 트래픽 및 전환 지표를 확인합니다
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* 기간 선택 */}
          <PeriodSelector period={period} onChange={setPeriod} />
          {/* CSV 내보내기 */}
          <button onClick={downloadCSV} style={btnStyle}>
            CSV 내보내기
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 80, color: T.textMuted }}>
          데이터를 불러오는 중...
        </div>
      ) : (
        <>
          {/* ── 요약 카드 ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
            {summaryCards.map((c) => (
              <SummaryCard key={c.label} {...c} />
            ))}
          </div>

          {/* ── 일별 조회수 라인 차트 ── */}
          <div style={cardWrapper}>
            <h2 style={sectionTitle}>일별 조회수</h2>
            <LineChart data={overview?.viewsPerDay ?? []} />
          </div>

          {/* ── 인기 페이지 바 차트 + 유입 경로 테이블 ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 20 }}>
            <div style={cardWrapper}>
              <h2 style={sectionTitle}>인기 페이지 (Top 10)</h2>
              <BarChart data={pages} />
            </div>

            <div style={cardWrapper}>
              <h2 style={sectionTitle}>유입 경로 (Top 10)</h2>
              <ReferrerTable data={referrers} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   기간 선택 버튼 그룹
   ══════════════════════════════════════════════════════════ */
function PeriodSelector({ period, onChange }) {
  return (
    <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `1px solid ${T.border}` }}>
      {PERIODS.map((p) => {
        const active = period === p.value;
        return (
          <button
            key={p.value}
            onClick={() => onChange(p.value)}
            style={{
              padding: "8px 18px",
              fontSize: 13,
              fontWeight: active ? 600 : 400,
              border: "none",
              cursor: "pointer",
              background: active ? T.accent : T.card,
              color: active ? "#fff" : T.textSec,
              transition: "all .15s",
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   요약 카드
   ══════════════════════════════════════════════════════════ */
function SummaryCard({ label, value, icon }) {
  return (
    <div
      style={{
        background: T.card,
        borderRadius: 12,
        padding: "24px 20px",
        border: `1px solid ${T.border}`,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, color: T.textMuted, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 20 }}>{icon}</span>
      </div>
      <span style={{ fontSize: 28, fontWeight: 700, color: T.text, letterSpacing: "-0.02em" }}>
        {value}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   일별 조회수 — Canvas 라인 차트
   ══════════════════════════════════════════════════════════ */
function LineChart({ data }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data?.length) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = 320;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    /* 여백 */
    const pad = { top: 20, right: 24, bottom: 48, left: 56 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    /* Y축 범위 */
    const counts = data.map((d) => d.count);
    const minVal = 0;
    const maxVal = Math.max(...counts, 1);
    const yTicks = 5;
    const yStep = Math.ceil(maxVal / yTicks);
    const yMax = yStep * yTicks;

    /* 격자 & Y 라벨 */
    ctx.strokeStyle = T.gridLine;
    ctx.lineWidth = 1;
    ctx.font = "11px sans-serif";
    ctx.fillStyle = T.textMuted;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    for (let i = 0; i <= yTicks; i++) {
      const val = yStep * i;
      const y = pad.top + chartH - (val / yMax) * chartH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();
      ctx.fillText(formatNumber(val), pad.left - 8, y);
    }

    /* X축 좌표 계산 */
    const points = data.map((d, i) => ({
      x: pad.left + (i / Math.max(data.length - 1, 1)) * chartW,
      y: pad.top + chartH - (d.count / yMax) * chartH,
    }));

    /* 면적 채우기 (그라데이션) */
    const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    gradient.addColorStop(0, "rgba(176,141,87,0.25)");
    gradient.addColorStop(1, "rgba(176,141,87,0.02)");
    ctx.beginPath();
    ctx.moveTo(points[0].x, pad.top + chartH);
    points.forEach((p) => ctx.lineTo(p.x, p.y));
    ctx.lineTo(points[points.length - 1].x, pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    /* 선 그리기 */
    ctx.beginPath();
    ctx.strokeStyle = T.accent;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();

    /* 데이터 포인트 */
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = T.card;
      ctx.fill();
      ctx.strokeStyle = T.accent;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    /* X축 라벨 — 라벨이 겹치지 않도록 간격 조절 */
    ctx.fillStyle = T.textMuted;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.font = "11px sans-serif";

    const maxLabels = Math.floor(chartW / 52);
    const labelStep = Math.max(1, Math.ceil(data.length / maxLabels));
    data.forEach((d, i) => {
      if (i % labelStep !== 0 && i !== data.length - 1) return;
      const x = pad.left + (i / Math.max(data.length - 1, 1)) * chartW;
      ctx.fillText(formatDate(d.date), x, pad.top + chartH + 10);
    });
  }, [data]);

  if (!data?.length) {
    return <EmptyState message="조회수 데이터가 없습니다" />;
  }

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   인기 페이지 — Canvas 수평 바 차트
   ══════════════════════════════════════════════════════════ */
function BarChart({ data }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!data?.length) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const barHeight = 28;
    const barGap = 10;
    const pad = { top: 8, right: 60, bottom: 8, left: 160 };
    const width = container.clientWidth;
    const height = pad.top + data.length * (barHeight + barGap) + pad.bottom;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const maxCount = Math.max(...data.map((d) => d.count), 1);
    const chartW = width - pad.left - pad.right;

    data.forEach((item, i) => {
      const y = pad.top + i * (barHeight + barGap);
      const barW = (item.count / maxCount) * chartW;

      /* 페이지명 라벨 */
      ctx.fillStyle = T.textSec;
      ctx.font = "12px sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      const label = item.page.length > 22 ? item.page.slice(0, 22) + "…" : item.page;
      ctx.fillText(label, pad.left - 12, y + barHeight / 2);

      /* 바 배경 */
      ctx.fillStyle = T.accentBg;
      roundRect(ctx, pad.left, y, chartW, barHeight, 4);
      ctx.fill();

      /* 바 (골드) */
      const barGradient = ctx.createLinearGradient(pad.left, 0, pad.left + barW, 0);
      barGradient.addColorStop(0, T.accent);
      barGradient.addColorStop(1, T.accentLight);
      ctx.fillStyle = barGradient;
      roundRect(ctx, pad.left, y, Math.max(barW, 4), barHeight, 4);
      ctx.fill();

      /* 수치 라벨 */
      ctx.fillStyle = T.text;
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(formatNumber(item.count), pad.left + barW + 8, y + barHeight / 2);
    });
  }, [data]);

  if (!data?.length) {
    return <EmptyState message="페이지 데이터가 없습니다" />;
  }

  return (
    <div ref={containerRef} style={{ width: "100%" }}>
      <canvas ref={canvasRef} style={{ display: "block" }} />
    </div>
  );
}

/** Canvas 둥근 사각형 헬퍼 */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/* ══════════════════════════════════════════════════════════
   유입 경로 테이블
   ══════════════════════════════════════════════════════════ */
function ReferrerTable({ data }) {
  if (!data?.length) {
    return <EmptyState message="유입 경로 데이터가 없습니다" />;
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr>
          <th style={thStyle}>유입 경로</th>
          <th style={{ ...thStyle, textAlign: "right", width: 80 }}>방문수</th>
          <th style={{ ...thStyle, width: "40%" }}>비율</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, i) => (
          <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
            <td style={tdStyle}>
              <span style={{ color: T.text, fontWeight: 500 }}>
                {item.referrer || "(직접 방문)"}
              </span>
            </td>
            <td style={{ ...tdStyle, textAlign: "right", fontWeight: 600, color: T.accent }}>
              {formatNumber(item.count)}
            </td>
            <td style={tdStyle}>
              <div
                style={{
                  height: 8,
                  borderRadius: 4,
                  background: T.accentBg,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(item.count / maxCount) * 100}%`,
                    height: "100%",
                    borderRadius: 4,
                    background: `linear-gradient(90deg, ${T.accent}, ${T.accentLight})`,
                    transition: "width .3s ease",
                  }}
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ══════════════════════════════════════════════════════════
   빈 상태 표시 컴포넌트
   ══════════════════════════════════════════════════════════ */
function EmptyState({ message }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "48px 20px",
        color: T.textMuted,
        fontSize: 14,
      }}
    >
      {message}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   공통 스타일 상수
   ══════════════════════════════════════════════════════════ */
const cardWrapper = {
  background: T.card,
  borderRadius: 12,
  padding: 24,
  border: `1px solid ${T.border}`,
};

const sectionTitle = {
  fontSize: 15,
  fontWeight: 600,
  color: T.text,
  marginTop: 0,
  marginBottom: 16,
};

const btnStyle = {
  padding: "8px 18px",
  fontSize: 13,
  fontWeight: 500,
  border: `1px solid ${T.accent}`,
  borderRadius: 8,
  cursor: "pointer",
  background: "transparent",
  color: T.accent,
  transition: "all .15s",
};

const thStyle = {
  textAlign: "left",
  padding: "10px 12px",
  fontSize: 12,
  fontWeight: 600,
  color: T.textMuted,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  borderBottom: `2px solid ${T.border}`,
};

const tdStyle = {
  padding: "12px 12px",
  color: T.textSec,
};
