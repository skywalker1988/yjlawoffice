/** TimelineChart — SVG 타임라인 렌더링 (틱 마크, 레인, 문서 점) */
import { useMemo } from "react";
import { getTypeColor, getTypeLabel } from "../utils/document-types";

const LANE_HEIGHT = 60;
const HEADER_HEIGHT = 40;

/**
 * SVG 타임라인 차트
 * @param {Object} props
 * @param {Array} props.items - 날짜가 파싱된 문서 목록
 * @param {Date} props.minDate - 타임라인 시작일
 * @param {Date} props.maxDate - 타임라인 종료일
 * @param {Object} props.lanes - { documentType: laneIndex } 매핑
 * @param {string} props.zoom - 줌 레벨 키 ("month" | "quarter" | "year")
 * @param {Object} props.zoomConfig - { msPerPx } 줌 설정
 * @param {Function} props.onDotClick - 문서 점 클릭 핸들러 (doc)
 * @param {Function} props.onDotHover - 마우스 진입 핸들러 (event, doc)
 * @param {Function} props.onDotLeave - 마우스 이탈 핸들러
 */
export default function TimelineChart({
  items, minDate, maxDate, lanes, zoom, zoomConfig,
  onDotClick, onDotHover, onDotLeave,
}) {
  const laneCount = Object.keys(lanes).length;
  const svgHeight = HEADER_HEIGHT + laneCount * LANE_HEIGHT + 40;
  const timeSpan = maxDate.getTime() - minDate.getTime();
  const svgWidth = Math.max(800, timeSpan / zoomConfig.msPerPx);

  const dateToX = (date) => {
    return ((date.getTime() - minDate.getTime()) / timeSpan) * svgWidth;
  };

  /** 틱 마크 생성 */
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

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      style={{ display: "block" }}
      role="img"
      aria-label="문서 타임라인: 시간에 따른 문서 분포"
    >
      {/* 틱 라인 & 라벨 */}
      {ticks.map((tick, i) => (
        <g key={tick.label || i}>
          <line
            x1={tick.x} y1={HEADER_HEIGHT}
            x2={tick.x} y2={svgHeight}
            stroke="rgba(0,0,0,0.06)" strokeWidth={1}
          />
          <text
            x={tick.x + 4} y={HEADER_HEIGHT - 10}
            fontSize={10} fill="var(--gray-200)" fontFamily="var(--font-en)"
          >
            {tick.label}
          </text>
        </g>
      ))}

      {/* 레인 배경 */}
      {Object.entries(lanes).map(([type, laneIdx]) => (
        <g key={type}>
          <rect
            x={0} y={HEADER_HEIGHT + laneIdx * LANE_HEIGHT}
            width={svgWidth} height={LANE_HEIGHT}
            fill={laneIdx % 2 === 0 ? "rgba(0,0,0,0.01)" : "transparent"}
          />
          <text
            x={8} y={HEADER_HEIGHT + laneIdx * LANE_HEIGHT + LANE_HEIGHT / 2 + 4}
            fontSize={10} fill={getTypeColor(type)} fontWeight="600"
          >
            {getTypeLabel(type)}
          </text>
        </g>
      ))}

      {/* 문서 점 */}
      {items.map((doc) => {
        const laneIdx = lanes[doc.documentType];
        if (laneIdx === undefined) return null;
        const x = dateToX(doc.date);
        const y = HEADER_HEIGHT + laneIdx * LANE_HEIGHT + LANE_HEIGHT / 2;
        const r = 4 + (doc.importance || 3) * 1.2;
        return (
          <circle
            key={doc.id}
            cx={x} cy={y} r={r}
            fill={getTypeColor(doc.documentType)}
            stroke="#fff" strokeWidth={1.5}
            style={{ cursor: "pointer" }}
            onClick={() => onDotClick(doc)}
            onMouseEnter={(e) => onDotHover(e, doc)}
            onMouseLeave={onDotLeave}
          />
        );
      })}
    </svg>
  );
}
