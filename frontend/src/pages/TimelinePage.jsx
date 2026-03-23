/** TimelinePage — SVG 기반 문서 타임라인 페이지 */
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import {
  TYPE_CONFIG,
  ALL_DOCUMENT_TYPES,
  getTypeLabel,
  getTypeColor,
} from "../utils/document-types";
import { api } from "../utils/api";

const ZOOM_LEVELS = {
  month: { label: "월", msPerPx: 1000 * 60 * 60 * 2 },
  quarter: { label: "분기", msPerPx: 1000 * 60 * 60 * 8 },
  year: { label: "연", msPerPx: 1000 * 60 * 60 * 24 },
};

export default function TimelinePage() {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const svgRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState("quarter");
  const [enabledTypes, setEnabledTypes] = useState(
    new Set(ALL_DOCUMENT_TYPES)
  );
  const [tooltip, setTooltip] = useState(null);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    api.get("/documents?limit=200")
      .then((data) => {
        const docs = data.data || [];
        setDocuments(docs);
      })
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

  // Process documents into timeline items
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
    const maxDate = new Date(
      items[items.length - 1].date.getTime() + 1000 * 60 * 60 * 24 * 30
    );

    // Assign lanes by type
    const activeLaneTypes = ALL_DOCUMENT_TYPES.filter((t) => enabledTypes.has(t));
    const lanes = {};
    activeLaneTypes.forEach((t, i) => {
      lanes[t] = i;
    });

    return { items, minDate, maxDate, lanes };
  }, [documents, enabledTypes]);

  const { items, minDate, maxDate, lanes } = timelineData;
  const laneCount = Object.keys(lanes).length;
  const laneHeight = 60;
  const headerHeight = 40;
  const svgHeight = headerHeight + laneCount * laneHeight + 40;

  const zoomConfig = ZOOM_LEVELS[zoom];
  const timeSpan = maxDate.getTime() - minDate.getTime();
  const svgWidth = Math.max(800, timeSpan / zoomConfig.msPerPx);

  const dateToX = (date) => {
    return ((date.getTime() - minDate.getTime()) / timeSpan) * svgWidth;
  };

  // Generate tick marks
  const ticks = useMemo(() => {
    const result = [];
    if (items.length === 0) return result;
    const d = new Date(minDate);
    if (zoom === "month") {
      d.setDate(1);
      while (d <= maxDate) {
        result.push({
          x: dateToX(d),
          label: `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`,
        });
        d.setMonth(d.getMonth() + 1);
      }
    } else if (zoom === "quarter") {
      d.setMonth(Math.floor(d.getMonth() / 3) * 3, 1);
      while (d <= maxDate) {
        const q = Math.floor(d.getMonth() / 3) + 1;
        result.push({
          x: dateToX(d),
          label: `${d.getFullYear()} Q${q}`,
        });
        d.setMonth(d.getMonth() + 3);
      }
    } else {
      d.setMonth(0, 1);
      while (d <= maxDate) {
        result.push({ x: dateToX(d), label: `${d.getFullYear()}` });
        d.setFullYear(d.getFullYear() + 1);
      }
    }
    return result;
  }, [items, minDate, maxDate, zoom, svgWidth]); // eslint-disable-line

  if (loading) {
    return (
      <div className="section">
        <div className="container" style={{ textAlign: "center", padding: 80 }}>
          <p style={{ color: "#999" }}>타임라인 데이터 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <p
            className="font-en"
            style={{
              fontSize: 11,
              letterSpacing: "0.25em",
              color: "var(--accent-gold)",
              marginBottom: 14,
            }}
          >
            TIMELINE
          </p>
          <h1
            className="font-serif"
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2rem)",
              fontWeight: 300,
              color: "var(--text-primary)",
            }}
          >
            타임라인
          </h1>
        </div>

        {/* Controls */}
        <div
          className="flex flex-wrap items-center gap-4"
          style={{ marginBottom: 20 }}
        >
          {/* Zoom */}
          <div className="flex gap-1">
            {Object.entries(ZOOM_LEVELS).map(([key, cfg]) => (
              <Button
                key={key}
                variant={zoom === key ? "default" : "outline"}
                size="sm"
                onClick={() => setZoom(key)}
              >
                {cfg.label}
              </Button>
            ))}
          </div>

          {/* Lane toggles */}
          <div className="flex flex-wrap gap-2">
            {ALL_DOCUMENT_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                style={{
                  padding: "4px 12px",
                  fontSize: 11,
                  borderRadius: 12,
                  border: `1px solid ${getTypeColor(type)}`,
                  background: enabledTypes.has(type)
                    ? getTypeColor(type)
                    : "transparent",
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

        {/* Timeline */}
        <div
          ref={containerRef}
          style={{
            position: "relative",
            width: "100%",
            overflowX: "auto",
            border: "1px solid rgba(0,0,0,0.06)",
            borderRadius: 6,
            background: "#fafafa",
          }}
          onScroll={(e) => setScrollLeft(e.target.scrollLeft)}
        >
          <svg
            ref={svgRef}
            width={svgWidth}
            height={svgHeight}
            style={{ display: "block" }}
          >
            {/* Tick lines & labels */}
            {ticks.map((tick, i) => (
              <g key={i}>
                <line
                  x1={tick.x}
                  y1={headerHeight}
                  x2={tick.x}
                  y2={svgHeight}
                  stroke="rgba(0,0,0,0.06)"
                  strokeWidth={1}
                />
                <text
                  x={tick.x + 4}
                  y={headerHeight - 10}
                  fontSize={10}
                  fill="#bbb"
                  fontFamily="var(--font-en)"
                >
                  {tick.label}
                </text>
              </g>
            ))}

            {/* Lane backgrounds */}
            {Object.entries(lanes).map(([type, laneIdx]) => (
              <g key={type}>
                <rect
                  x={0}
                  y={headerHeight + laneIdx * laneHeight}
                  width={svgWidth}
                  height={laneHeight}
                  fill={laneIdx % 2 === 0 ? "rgba(0,0,0,0.01)" : "transparent"}
                />
                <text
                  x={8}
                  y={headerHeight + laneIdx * laneHeight + laneHeight / 2 + 4}
                  fontSize={10}
                  fill={getTypeColor(type)}
                  fontWeight="600"
                >
                  {getTypeLabel(type)}
                </text>
              </g>
            ))}

            {/* Dots */}
            {items.map((doc) => {
              const laneIdx = lanes[doc.documentType];
              if (laneIdx === undefined) return null;
              const x = dateToX(doc.date);
              const y =
                headerHeight + laneIdx * laneHeight + laneHeight / 2;
              const r = 4 + (doc.importance || 3) * 1.2;
              return (
                <circle
                  key={doc.id}
                  cx={x}
                  cy={y}
                  r={r}
                  fill={getTypeColor(doc.documentType)}
                  stroke="#fff"
                  strokeWidth={1.5}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/vault/${doc.id}`)}
                  onMouseEnter={(e) => {
                    const rect =
                      containerRef.current.getBoundingClientRect();
                    setTooltip({
                      x: e.clientX - rect.left + 12,
                      y: e.clientY - rect.top - 10,
                      title: doc.title,
                      type: doc.documentType,
                      date: doc.date.toLocaleDateString("ko-KR"),
                    });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              );
            })}
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div
              style={{
                position: "absolute",
                left: tooltip.x + scrollLeft,
                top: tooltip.y,
                background: "rgba(30,30,30,0.95)",
                color: "#fff",
                padding: "8px 14px",
                borderRadius: 4,
                fontSize: 12,
                pointerEvents: "none",
                zIndex: 10,
                maxWidth: 280,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              <span
                style={{
                  color: getTypeColor(tooltip.type),
                  fontSize: 10,
                  marginRight: 6,
                }}
              >
                [{getTypeLabel(tooltip.type)}]
              </span>
              {tooltip.title}
              <span style={{ color: "#999", marginLeft: 8, fontSize: 10 }}>
                {tooltip.date}
              </span>
            </div>
          )}
        </div>

        <p
          style={{
            fontSize: 11,
            color: "#bbb",
            textAlign: "center",
            marginTop: 12,
          }}
        >
          가로 스크롤로 탐색 · 점 클릭으로 문서 보기 · 점 크기는 중요도
        </p>
      </div>
    </div>
  );
}
