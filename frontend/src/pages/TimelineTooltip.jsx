/** TimelineTooltip — 문서 점 호버 시 표시되는 툴팁 */
import { getTypeColor, getTypeLabel } from "../utils/document-types";

/**
 * @param {Object} props
 * @param {Object} props.tooltip - { x, y, title, type, date }
 * @param {number} props.scrollLeft - 컨테이너 가로 스크롤 오프셋
 */
export default function TimelineTooltip({ tooltip, scrollLeft }) {
  if (!tooltip) return null;

  return (
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
      <span style={{ color: "var(--text-muted)", marginLeft: 8, fontSize: 10 }}>
        {tooltip.date}
      </span>
    </div>
  );
}
