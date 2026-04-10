/** TimelinePage — SVG 기반 문서 타임라인 페이지 (메인 구성) */
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ALL_DOCUMENT_TYPES, getTypeLabel, getTypeColor } from "../utils/document-types";
import { api } from "../utils/api";
import { ZOOM_LEVELS } from "./timelineConstants";
import TimelineChart from "./TimelineChart";
import TimelineTooltip from "./TimelineTooltip";

export default function TimelinePage() {
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState("quarter");
  const [enabledTypes, setEnabledTypes] = useState(new Set(ALL_DOCUMENT_TYPES));
  const [tooltip, setTooltip] = useState(null);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    api.get("/documents?limit=200")
      .then((data) => setDocuments(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleType = (type) => {
    setEnabledTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  /** 문서를 타임라인 아이템으로 변환 */
  const timelineData = useMemo(() => {
    const items = documents
      .filter((d) => enabledTypes.has(d.documentType))
      .map((d) => ({
        ...d,
        date: new Date(d.publishedDate || d.createdAt || Date.now()),
      }))
      .sort((a, b) => a.date - b.date);

    if (items.length === 0) return { items: [], minDate: new Date(), maxDate: new Date(), lanes: {} };

    const minDate = new Date(items[0].date.getTime() - 1000 * 60 * 60 * 24 * 30);
    const maxDate = new Date(items[items.length - 1].date.getTime() + 1000 * 60 * 60 * 24 * 30);

    const activeLaneTypes = ALL_DOCUMENT_TYPES.filter((t) => enabledTypes.has(t));
    const lanes = {};
    activeLaneTypes.forEach((t, i) => { lanes[t] = i; });

    return { items, minDate, maxDate, lanes };
  }, [documents, enabledTypes]);

  const { items, minDate, maxDate, lanes } = timelineData;
  const zoomConfig = ZOOM_LEVELS[zoom];

  /** 점 클릭 → 문서 상세 이동 */
  const handleDotClick = (doc) => navigate(`/vault/${doc.id}`);

  /** 점 호버 → 툴팁 표시 */
  const handleDotHover = (e, doc) => {
    const rect = containerRef.current.getBoundingClientRect();
    setTooltip({
      x: e.clientX - rect.left + 12,
      y: e.clientY - rect.top - 10,
      title: doc.title,
      type: doc.documentType,
      date: doc.date.toLocaleDateString("ko-KR"),
    });
  };

  if (loading) {
    return (
      <div className="section">
        <div className="container" style={{ textAlign: "center", padding: 80 }}>
          <p style={{ color: "var(--text-muted)" }}>타임라인 데이터 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container">
        {/* 헤더 */}
        <div style={{ marginBottom: 24 }}>
          <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.25em", color: "var(--accent-gold)", marginBottom: 14 }}>
            TIMELINE
          </p>
          <h1 className="font-serif" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 300, color: "var(--text-primary)" }}>
            타임라인
          </h1>
        </div>

        {/* 컨트롤 */}
        <div className="flex flex-wrap items-center gap-4" style={{ marginBottom: 20 }}>
          <div className="flex gap-1">
            {Object.entries(ZOOM_LEVELS).map(([key, cfg]) => (
              <Button key={key} variant={zoom === key ? "default" : "outline"} size="sm" onClick={() => setZoom(key)}>
                {cfg.label}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {ALL_DOCUMENT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                style={{
                  padding: "4px 12px", fontSize: 11, borderRadius: 12,
                  border: `1px solid ${getTypeColor(type)}`,
                  background: enabledTypes.has(type) ? getTypeColor(type) : "transparent",
                  color: enabledTypes.has(type) ? "#fff" : getTypeColor(type),
                  cursor: "pointer",
                  opacity: enabledTypes.has(type) ? 1 : 0.5,
                }}
              >
                {getTypeLabel(type)}
              </button>
            ))}
          </div>
        </div>

        {/* 타임라인 SVG */}
        <div
          ref={containerRef}
          style={{
            position: "relative", width: "100%", overflowX: "auto",
            border: "1px solid rgba(0,0,0,0.06)", borderRadius: 6, background: "#fafafa",
          }}
          onScroll={(e) => setScrollLeft(e.target.scrollLeft)}
        >
          <TimelineChart
            items={items}
            minDate={minDate}
            maxDate={maxDate}
            lanes={lanes}
            zoom={zoom}
            zoomConfig={zoomConfig}
            onDotClick={handleDotClick}
            onDotHover={handleDotHover}
            onDotLeave={() => setTooltip(null)}
          />

          <TimelineTooltip tooltip={tooltip} scrollLeft={scrollLeft} />
        </div>

        <p style={{ fontSize: 11, color: "var(--gray-200)", textAlign: "center", marginTop: 12 }}>
          가로 스크롤로 탐색 · 점 클릭으로 문서 보기 · 점 크기는 중요도
        </p>
      </div>
    </div>
  );
}
