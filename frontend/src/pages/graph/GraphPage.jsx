/**
 * GraphPage.jsx — 지식 그래프 메인 페이지
 * 문서 로드, 필터링, 레이아웃 구성을 담당하고
 * 캔버스 렌더링/물리는 useGraphCanvas, 사이드바는 GraphSidebar에 위임한다.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import { parseMeta, buildEdges, buildGraph, getGroupKey } from "./graphUtils";
import { CATEGORY_LABELS_KR } from "./graphConstants";
import { useGraphCanvas } from "./useGraphCanvas";
import GraphSidebar from "./GraphSidebar";

export default function GraphPage() {
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const nodesRef = useRef([]);
  const edgesRef = useRef([]);

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [search, setSearch] = useState("");
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [groupBy, setGroupBy] = useState("country");

  // 문서 로드
  useEffect(() => {
    api.get("/documents?limit=500")
      .then(j => setDocs(j.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // 캔버스 크기 측정 (ResizeObserver + 디바운스)
  useEffect(() => {
    if (!wrapRef.current) return;
    let resizeTimeout = null;
    const ro = new ResizeObserver(entries => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const e = entries[entries.length - 1];
        const { width, height } = e.contentRect;
        if (width > 10 && height > 10) {
          setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
        }
      }, 200);
    });
    ro.observe(wrapRef.current);
    return () => { clearTimeout(resizeTimeout); ro.disconnect(); };
  }, []);

  // 검색 필터
  const filtered = useMemo(() =>
    docs.filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase())),
  [docs, search]);

  // 그래프 빌드
  useEffect(() => {
    if (filtered.length === 0 || canvasSize.width < 50) {
      nodesRef.current = [];
      edgesRef.current = [];
      return;
    }
    const metas = filtered.map(d => parseMeta(d));
    const rawEdges = buildEdges(filtered, metas);
    const { nodes, finalEdges } = buildGraph(filtered, metas, rawEdges, groupBy, canvasSize);
    nodesRef.current = nodes;
    edgesRef.current = finalEdges;
  }, [filtered, canvasSize, groupBy]);

  // 이웃 노드 ID 집합 (호버 시 하이라이트용)
  const neighborIds = useMemo(() => {
    if (!hoveredNodeId) return new Set();
    const ns = nodesRef.current;
    const es = edgesRef.current;
    const idx = ns.findIndex(n => n.id === hoveredNodeId);
    if (idx < 0) return new Set();
    const neighbors = new Set([hoveredNodeId]);
    for (const edge of es) {
      if (edge.s === idx) neighbors.add(ns[edge.t]?.id);
      if (edge.t === idx) neighbors.add(ns[edge.s]?.id);
    }
    return neighbors;
  }, [hoveredNodeId]);

  // 캔버스 훅
  const {
    camera, onDown, onMove, onUp, onWheel,
    resetView, zoomIn, zoomOut, isDragging, resetIteration,
  } = useGraphCanvas({
    canvasRef, nodesRef, edgesRef, canvasSize,
    hoveredNodeId, selectedNodeId, neighborIds,
    onHover: setHoveredNodeId,
    onSelect: setSelectedNodeId,
    onNavigate: (id) => navigate(`/vault/${id}`),
  });

  // 카메라 + 시뮬레이션 초기화 (그래프 재빌드 시)
  useEffect(() => {
    resetView();
    resetIteration();
  }, [filtered, canvasSize, groupBy]);

  const selDoc = useMemo(() => docs.find(d => d.id === selectedNodeId), [docs, selectedNodeId]);
  const ns = nodesRef.current;
  const es = edgesRef.current;
  const cam = camera;

  if (loading) {
    return (
      <div className="section">
        <div className="container" style={{ textAlign: "center", padding: 80 }}>
          <div className="spinner" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "#999" }}>불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: "clamp(120px, 13vw, 150px)", paddingBottom: 40, background: "#fff", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 20px" }}>

        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div>
            <p className="font-en" style={{ fontSize: 10, letterSpacing: "0.2em", color: "#6366f1", marginBottom: 6 }}>KNOWLEDGE GRAPH</p>
            <h1 className="font-serif" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", fontWeight: 300, color: "#1a1a1a" }}>지식 그래프</h1>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <select value={groupBy} onChange={e => setGroupBy(e.target.value)}
              style={{ height: 28, border: "1px solid rgba(0,0,0,0.1)", borderRadius: 6, padding: "0 8px", fontSize: 11, background: "#fff", color: "#333", cursor: "pointer", outline: "none" }}>
              <option value="country">국가별</option>
              <option value="region">지역별</option>
              <option value="category">분류별</option>
              <option value="era">시대별</option>
              <option value="type">문서유형별</option>
            </select>
            <input placeholder="검색..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: 140, height: 28, border: "1px solid rgba(0,0,0,0.1)", borderRadius: 6, padding: "0 8px", fontSize: 11, outline: "none", background: "#fff" }} />
            <button onClick={resetView} style={{ height: 28, padding: "0 12px", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 6, background: "#fff", fontSize: 10, cursor: "pointer", color: "#666" }}>
              초기화
            </button>
          </div>
        </div>

        {/* 메인 */}
        <div style={{ display: "grid", gridTemplateColumns: selDoc ? "1fr 300px" : "1fr", gap: 14 }}>
          {/* 캔버스 영역 */}
          <div ref={wrapRef} style={{
            height: "max(500px, calc(100vh - 280px))",
            borderRadius: 10, overflow: "hidden",
            border: "1px solid rgba(0,0,0,0.08)",
            background: "#fff", position: "relative",
          }}>
            <canvas ref={canvasRef}
              style={{ display: "block", cursor: isDragging ? "grabbing" : "grab" }}
              onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp} onWheel={onWheel}
            />

            {/* 하단 바 */}
            <div style={{ position: "absolute", bottom: 8, left: 10, right: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "#bbb", pointerEvents: "none" }}>
                {filtered.length}개 노드 &middot; {es.length}개 연결 &middot; 클릭: 선택 &middot; 다시 클릭: 문서 열기
              </span>
              <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
                <button onClick={zoomIn}
                  style={{ width: 22, height: 22, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 3, background: "#fff", color: "#888", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                <span style={{ fontSize: 9, color: "#bbb", width: 28, textAlign: "center" }}>{Math.round(cam.z * 100)}%</span>
                <button onClick={zoomOut}
                  style={{ width: 22, height: 22, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 3, background: "#fff", color: "#888", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>&minus;</button>
              </div>
            </div>

            {/* 툴팁 */}
            {hoveredNodeId && (() => {
              const node = ns.find(n => n.id === hoveredNodeId);
              if (!node) return null;
              const rect = canvasRef.current?.getBoundingClientRect();
              if (!rect) return null;
              const scX = rect.width / canvasSize.width;
              const scY = rect.height / canvasSize.height;
              const wcx2 = canvasSize.width / 2 - cam.x;
              const wcy2 = canvasSize.height / 2 - cam.y;
              const sx = ((node.x - wcx2) * cam.z + canvasSize.width / 2) * scX;
              const sy = ((node.y - wcy2) * cam.z + canvasSize.height / 2) * scY;
              let left = sx + 14;
              let top = sy - 8;
              if (left + 240 > rect.width) left = sx - 254;
              if (top + 90 > rect.height) top = rect.height - 100;
              if (left < 4) left = 4;
              if (top < 4) top = 4;
              return (
                <div style={{ position: "absolute", left, top, background: "#fff", padding: "10px 14px", borderRadius: 8, fontSize: 12, pointerEvents: "none", zIndex: 10, maxWidth: 260, border: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}>
                  <p style={{ fontWeight: 600, color: "#1a1a1a", lineHeight: 1.4, margin: "0 0 4px" }}>{node.fullTitle}</p>
                  <div style={{ fontSize: 10, color: "#999", display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {node.country && <span>{node.country}</span>}
                    {node.year && <span>{node.year < 0 ? `BC ${Math.abs(node.year)}` : node.year}</span>}
                    {node.category && <span>{CATEGORY_LABELS_KR[node.category] || node.category}</span>}
                    <span>{node.conns}개 연결</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* 사이드바 */}
          {selDoc && (
            <GraphSidebar
              doc={selDoc}
              nodes={ns}
              edges={es}
              onSelect={setSelectedNodeId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
