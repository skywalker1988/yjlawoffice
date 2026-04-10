/**
 * GraphSidebar.jsx — 지식 그래프 선택 노드 상세 패널
 * 선택된 문서의 메타정보, 인사이트, 연결 목록을 표시한다.
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORY_LABELS_KR } from "./graphConstants";
import { parseMeta } from "./graphUtils";
import { EDGE_RULES } from "./graphConstants";

/**
 * @param {object} props
 * @param {object} props.doc - 선택된 문서 객체
 * @param {Array} props.nodes - 전체 노드 배열 (nodesRef.current)
 * @param {Array} props.edges - 전체 엣지 배열 (edgesRef.current)
 * @param {Function} props.onSelect - (id|null) => void
 */
export default function GraphSidebar({ doc, nodes, edges, onSelect }) {
  const navigate = useNavigate();
  const selMeta = parseMeta(doc);
  const selNode = nodes.find(n => n.id === doc.id);

  // 연결된 노드 목록
  const connections = useMemo(() => {
    if (!selNode) return [];
    const idx = nodes.findIndex(n => n.id === doc.id);
    if (idx < 0) return [];
    return edges
      .filter(e => e.s === idx || e.t === idx)
      .map(e => {
        const nd = nodes[e.s === idx ? e.t : e.s];
        if (!nd) return null;
        const pct = Math.round((e.w / EDGE_RULES.MAX_PRACTICAL_WEIGHT) * 100);
        return {
          id: nd.id, title: nd.title, type: nd.type,
          year: nd.year, country: nd.country, region: nd.region,
          category: nd.category, w: e.w, pct, reasons: e.reasons || [],
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.w - a.w);
  }, [doc.id, nodes, edges, selNode]);

  // 자동 생성 인사이트
  const insights = useMemo(() => {
    if (!selNode) return [];
    return generateInsights(selNode, connections);
  }, [selNode, connections]);

  return (
    <div style={{ alignSelf: "start", position: "sticky", top: 120 }}>
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", overflow: "hidden" }}>
        <div style={{ height: 3, background: "#6366f1" }} />
        <div style={{ padding: 16 }}>
          {/* 헤더 */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 10, color: "#6366f1", fontWeight: 600 }}>
              {selMeta.country || ""} {selMeta.year ? (selMeta.year < 0 ? `BC ${Math.abs(selMeta.year)}` : selMeta.year) : ""}
            </span>
            <button onClick={() => onSelect(null)} style={{ background: "none", border: "none", color: "#ccc", fontSize: 16, cursor: "pointer" }}>&times;</button>
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.4, marginBottom: 6 }}>{doc.title}</h3>
          {doc.subtitle && <p style={{ fontSize: 11, color: "#888", lineHeight: 1.6, marginBottom: 8 }}>{doc.subtitle}</p>}

          {/* 태그 */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {selMeta.region && <span style={{ fontSize: 10, color: "#999", background: "#f5f5f3", borderRadius: 4, padding: "2px 6px" }}>{selMeta.region}</span>}
            {selMeta.category && <span style={{ fontSize: 10, color: "#999", background: "#f5f5f3", borderRadius: 4, padding: "2px 6px" }}>{CATEGORY_LABELS_KR[selMeta.category] || selMeta.category}</span>}
          </div>

          {/* 중요도 */}
          <div style={{ display: "flex", gap: 2, marginBottom: 4 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} style={{ color: i < (doc.importance || 3) ? "#6366f1" : "#ddd", fontSize: 11 }}>{"\u2605"}</span>
            ))}
          </div>

          {/* 인사이트 */}
          {insights.length > 0 && (
            <>
              <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "10px 0" }} />
              <p style={{ fontSize: 9, color: "#6366f1", fontWeight: 700, marginBottom: 6, letterSpacing: "0.08em" }}>HISTORICAL INSIGHT</p>
              <div style={{ maxHeight: 300, overflowY: "auto" }}>
                {insights.map((ins, i) => (
                  <div key={i} style={{ background: "#fafaf6", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 6, padding: "8px 10px", marginBottom: 6 }}>
                    <p style={{ fontSize: 10, color: "#6366f1", fontWeight: 600, margin: "0 0 3px" }}>
                      {ins.icon && <span style={{ marginRight: 4 }}>{ins.icon}</span>}
                      {ins.title}
                    </p>
                    <p style={{ fontSize: 10, color: "#555", margin: 0, lineHeight: 1.65 }}>{ins.text}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 연결 목록 */}
          {connections.length > 0 && (
            <>
              <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "10px 0" }} />
              <p style={{ fontSize: 10, color: "#999", fontWeight: 600, marginBottom: 6 }}>
                연결된 사건 ({connections.length})
              </p>
              {connections.slice(0, 15).map(cn => (
                <div key={cn.id} onClick={() => onSelect(cn.id)}
                  style={{ padding: "7px 0", borderBottom: "1px solid rgba(0,0,0,0.04)", cursor: "pointer" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                    <span style={{ fontSize: 10, color: "#aaa", width: 38, flexShrink: 0, textAlign: "right" }}>
                      {cn.year ? (cn.year < 0 ? `BC${Math.abs(cn.year)}` : cn.year) : ""}
                    </span>
                    <span style={{ fontSize: 11, color: "#1a1a1a", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                      {cn.title}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 44 }}>
                    <div style={{ flex: 1, height: 3, background: "#f0f0ee", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ width: `${cn.pct}%`, height: "100%", background: cn.pct >= 70 ? "#6366f1" : cn.pct >= 40 ? "#ccc" : "#ddd", borderRadius: 2 }} />
                    </div>
                    <span style={{ fontSize: 9, color: cn.pct >= 70 ? "#6366f1" : "#bbb", fontWeight: 600, width: 30, textAlign: "right" }}>
                      {cn.pct}%
                    </span>
                  </div>
                  {cn.reasons.length > 0 && (
                    <div style={{ paddingLeft: 44, marginTop: 3 }}>
                      {cn.reasons.map((r, ri) => (
                        <p key={ri} style={{ fontSize: 9, color: "#aaa", margin: 0, lineHeight: 1.5 }}>{r}</p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          <button onClick={() => navigate(`/vault/${doc.id}`)}
            style={{ marginTop: 14, width: "100%", padding: "8px 0", borderRadius: 6, background: "#6366f1", color: "#fff", border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
            문서 보기 &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 선택된 노드와 연결 정보를 기반으로 인사이트를 자동 생성한다.
 * @param {object} selNode
 * @param {Array} connections
 * @returns {Array<{ title: string, icon: string, text: string }>}
 */
function generateInsights(selNode, connections) {
  const insights = [];
  const yr = selNode.year;
  const yrStr = yr < 0 ? `기원전 ${Math.abs(yr)}년` : `${yr}년`;
  const sameCountry = connections.filter(c => c.country && c.country === selNode.country);
  const crossRegion = connections.filter(c => c.region && c.region !== selNode.region);
  const categories = [...new Set(connections.map(c => c.category).filter(Boolean))];

  // 인과적 연쇄
  const strongest = connections[0];
  if (strongest && strongest.w >= 5 && strongest.country === selNode.country) {
    const diff = Math.abs((strongest.year || 0) - yr);
    const before = (strongest.year || 0) < yr;
    insights.push({
      title: "인과적 연쇄",
      icon: "🔗",
      text: `"${strongest.title}"${before ? "이(가) 선행하여" : "이(가) 뒤이어"} ${diff}년 ${before ? "후" : "전"} ${selNode.country}에서 발생. ${before ? "이 사건의 역사적 배경이자 직접적 원인으로 작용했을 가능성이 높습니다." : "이 사건의 직접적 결과물로 볼 수 있습니다."}`,
    });
  }

  // 국가 궤적
  if (sameCountry.length >= 2 && selNode.country) {
    const sorted = [...sameCountry].sort((a, b) => (a.year || 0) - (b.year || 0));
    const earliest = sorted[0];
    const latest = sorted[sorted.length - 1];
    const span = Math.abs((latest.year || 0) - (earliest.year || 0));
    insights.push({
      title: `${selNode.country}의 역사적 궤적`,
      icon: "🏛️",
      text: `"${earliest.title}"(${earliest.year < 0 ? "BC" + Math.abs(earliest.year) : earliest.year})부터 "${latest.title}"(${latest.year})까지 ${span}년에 걸친 ${sameCountry.length}개 사건과 연결. 국가적 변혁의 흐름 속에 위치합니다.`,
    });
  }

  // 문명 간 파급
  if (crossRegion.length > 0) {
    const regions = [...new Set(crossRegion.map(c => c.region))];
    insights.push({
      title: "문명 간 파급효과",
      icon: "🌐",
      text: `${selNode.region}에서 발생한 사건이 ${regions.join("·")} 등에까지 영향. ${yrStr} 전후 동서양 간 역사적 상호작용이 활발했음을 시사합니다.`,
    });
  }

  // 복합적 동인
  if (categories.length >= 3) {
    insights.push({
      title: "복합적 역사 동인",
      icon: "📌",
      text: `${categories.join(", ")} 등 ${categories.length}개 영역에 걸친 사건들과 연결. 정치·군사적 사건에 그치지 않고, 사회·경제·문화적 구조 변동이 복합적으로 작용한 결과물입니다.`,
    });
  }

  // 역사적 전환점
  if (connections.length >= 5) {
    const beforeCount = connections.filter(c => c.year && c.year < yr).length;
    const afterCount = connections.filter(c => c.year && c.year >= yr).length;
    insights.push({
      title: "역사적 전환점",
      icon: "⚡",
      text: `${connections.length}개 사건과 연결된 허브 노드. 이전 ${beforeCount}개 사건이 수렴하고 이후 ${afterCount}개 사건으로 분기하는 전환점입니다.`,
    });
  }

  // 동시대 연쇄 반응
  if (connections.length >= 3) {
    const close = connections.filter(c => c.year && Math.abs(c.year - yr) < 20);
    if (close.length >= 3) {
      insights.push({
        title: "동시대 연쇄 반응",
        icon: "⏱️",
        text: `${close.length}개 사건이 ${yrStr} 전후 20년 이내에 집중. 위기의 시대(Age of Crisis) 패턴을 보여줍니다.`,
      });
    }
  }

  return insights;
}
