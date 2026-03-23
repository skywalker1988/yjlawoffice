/**
 * GraphPage — Canvas2D 지식 그래프 시각화
 * - 문서 간 관계를 물리 시뮬레이션으로 시각화 (척력, 스프링, 그룹 인력)
 * - 국가/지역/카테고리/시대별 그룹핑
 * - 줌/패닝, 노드 드래그, 연결 인사이트 표시
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getTypeLabel, getTypeColor, TYPE_CONFIG, ALL_DOCUMENT_TYPES } from "../utils/document-types";
import { CATEGORY_LABELS_KR } from "../utils/constants";
import CURATED_INSIGHTS from "../utils/history-insights";
import { api } from "../utils/api";

/** 그래프 물리 시뮬레이션 파라미터 */
const GRAPH_CONFIG = {
  REPULSION_STRENGTH: 1500,
  SPRING_REST_LENGTH: 120,
  SPRING_STIFFNESS: 0.002,
  GROUP_ATTRACTION: 0.004,
  MIN_EDGE_WEIGHT: 2,
  SAME_COUNTRY_YEAR_THRESHOLD: 100,
  SAME_COUNTRY_CLOSE_YEAR: 30,
  SAME_CATEGORY_YEAR_THRESHOLD: 50,
  BUBBLE_FADE_START_ZOOM: 0.8,
  BUBBLE_FADE_RANGE: 0.4,
};

function parseMeta(doc) {
  try { return doc.metadata ? JSON.parse(doc.metadata) : {}; } catch { return {}; }
}

function getEra(year) {
  if (year < -500) return "기원전";
  if (year < 500) return "고대";
  if (year < 1500) return "중세";
  if (year < 1800) return "근세";
  if (year < 1900) return "근대";
  if (year < 2000) return "현대";
  return "21세기";
}

export default function GraphPage() {
  const navigate = useNavigate();
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const nodesRef = useRef([]);
  const edgesRef = useRef([]);
  const iterationRef = useRef(0);

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [search, setSearch] = useState("");
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [, forceRerender] = useState(0);
  const [simulationSpeed, setSimulationSpeed] = useState(0.1);
  const [groupBy, setGroupBy] = useState("country");

  const cameraRef = useRef({ x: 0, y: 0, z: 1 });
  const dragRef = useRef({ active: false, kind: "", nodeIndex: -1, startX: 0, startY: 0, cameraStartX: 0, cameraStartY: 0, moved: false });
  const simulationSpeedRef = useRef(simulationSpeed);
  simulationSpeedRef.current = simulationSpeed;

  // Fetch
  useEffect(() => {
    api.get("/documents?limit=500")
      .then(j => setDocs(j.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Measure — use ResizeObserver for accuracy
  useEffect(() => {
    if (!wrapRef.current) return;
    const ro = new ResizeObserver(entries => {
      for (const e of entries) {
        const { width, height } = e.contentRect;
        if (width > 10 && height > 10) setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
      }
    });
    ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, []);

  // Group key extractor — works for all document types
  const getGroup = useCallback((meta, doc) => {
    if (groupBy === "country") return meta?.country || "기타";
    if (groupBy === "region") return meta?.region || "기타";
    if (groupBy === "category") return CATEGORY_LABELS_KR[meta?.category] || "기타";
    if (groupBy === "era") return meta?.year != null ? getEra(meta.year) : "기타";
    if (groupBy === "type") return getTypeLabel(doc?.documentType || "note");
    return "기타";
  }, [groupBy]);

  // Filtered docs
  const filtered = useMemo(() =>
    docs.filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase())),
  [docs, search]);

  // Build graph with MEANINGFUL edges
  useEffect(() => {
    if (filtered.length === 0 || canvasSize.width < 50) { nodesRef.current = []; edgesRef.current = []; forceRerender(t => t + 1); return; }
    const centerX = canvasSize.width / 2, centerY = canvasSize.height / 2;

    // Parse metadata for all docs
    const metas = filtered.map(d => parseMeta(d));

    // Build meaningful edges — hybrid: metadata + tags + keywords
    const EXCLUDED_TAGS = new Set(["세계사", "World History"]);
    const edges = [];
    for (let i = 0; i < filtered.length; i++) {
      const mi = metas[i];
      const tagsI = (filtered[i].tags || []).map(t => typeof t === "string" ? t : t.name).filter(t => !EXCLUDED_TAGS.has(t));
      const titleI = filtered[i].title.toLowerCase();
      const typeI = filtered[i].documentType;

      for (let j = i + 1; j < filtered.length; j++) {
        const mj = metas[j];
        const tagsJ = (filtered[j].tags || []).map(t => typeof t === "string" ? t : t.name).filter(t => !EXCLUDED_TAGS.has(t));
        const titleJ = filtered[j].title.toLowerCase();
        const typeJ = filtered[j].documentType;

        let weight = 0;
        const reasons = [];

        // --- A. History event ↔ History event (both have year) ---
        if (mi.year && mj.year) {
          const yearDiff = Math.abs(mi.year - mj.year);

          if (mi.country && mi.country === mj.country && yearDiff < GRAPH_CONFIG.SAME_COUNTRY_YEAR_THRESHOLD) {
            weight += 3;
            reasons.push(`같은 국가 (${mi.country}), ${yearDiff}년 차이`);
            if (yearDiff < GRAPH_CONFIG.SAME_COUNTRY_CLOSE_YEAR) weight += 2;
          }

          if (mi.region && mi.region === mj.region && getEra(mi.year) === getEra(mj.year)) {
            weight += 1;
            reasons.push(`같은 지역 (${mi.region}), 같은 시대 (${getEra(mi.year)})`);
          }

          if (mi.category && mi.category === mj.category && yearDiff < GRAPH_CONFIG.SAME_CATEGORY_YEAR_THRESHOLD && mi.region === mj.region) {
            weight += 2;
            reasons.push(`같은 분류 (${CATEGORY_LABELS_KR[mi.category] || mi.category}), ${mi.region}에서 ${yearDiff}년 차이`);
          }
        }

        // --- B. Tag-based connection (works for all document types) ---
        const sharedTags = tagsI.filter(t => tagsJ.includes(t));
        if (sharedTags.length >= 2) {
          weight += sharedTags.length;
          reasons.push(`공통 태그: ${sharedTags.join(", ")}`);
        }

        // --- C. News ↔ History: keyword match in title ---
        if ((typeI === "news" || typeJ === "news") && (typeI !== typeJ || typeI === "news")) {
          // Check if news title contains country/region/keyword from history event
          const newsTitle = typeI === "news" ? titleI : titleJ;
          const otherMeta = typeI === "news" ? mj : mi;
          const otherTitle = typeI === "news" ? titleJ : titleI;

          if (otherMeta.country && newsTitle.includes(otherMeta.country.toLowerCase())) {
            weight += 3;
            reasons.push(`뉴스에서 "${otherMeta.country}" 언급 — 역사적 맥락 연결`);
          }

          // Keyword overlap in titles
          const wordsA = new Set(newsTitle.replace(/[[\]세계사]/g, "").split(/\s+/).filter(w => w.length >= 2));
          const wordsB = new Set(otherTitle.replace(/[[\]세계사]/g, "").split(/\s+/).filter(w => w.length >= 2));
          const commonWords = [...wordsA].filter(w => wordsB.has(w));
          if (commonWords.length >= 1) {
            weight += commonWords.length * 2;
            reasons.push(`키워드 일치: ${commonWords.join(", ")}`);
          }
        }

        // --- D. Same document type (non-note) ---
        if (typeI === typeJ && typeI !== "note" && sharedTags.length >= 1) {
          weight += 1;
          reasons.push(`같은 문서 유형 (${getTypeLabel(typeI)})`);
        }

        if (weight >= GRAPH_CONFIG.MIN_EDGE_WEIGHT) edges.push({ s: i, t: j, w: weight, reasons });
      }
    }

    // Keep top edges if too many
    const maxE = Math.min(edges.length, filtered.length * 3);
    const finalEdges = edges.length > maxE
      ? [...edges].sort((a, b) => b.w - a.w).slice(0, maxE)
      : edges;

    const connectionCounts = new Array(filtered.length).fill(0);
    for (const e of finalEdges) { connectionCounts[e.s]++; connectionCounts[e.t]++; }

    // Group and position
    const groups = {};
    filtered.forEach((d, i) => {
      const key = getGroup(metas[i], filtered[i]);
      (groups[key] ??= []).push(i);
    });

    // Sort groups: biggest first. Use grid layout so groups never overlap initially.
    const groupKeys = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);
    const cols = Math.ceil(Math.sqrt(groupKeys.length * (canvasSize.width / canvasSize.height)));
    const rows = Math.ceil(groupKeys.length / cols);
    const cellW = canvasSize.width / (cols + 1);
    const cellH = canvasSize.height / (rows + 1);
    const groupCenters = {};
    groupKeys.forEach((k, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      groupCenters[k] = {
        x: cellW * (col + 1),
        y: cellH * (row + 1),
      };
    });

    const nodes = filtered.map((d, i) => {
      const m = metas[i];
      const key = getGroup(m, d);
      const groupCenter = groupCenters[key] || { x: centerX, y: centerY };
      const gs = (groups[key] || []).length;
      const gi = (groups[key] || []).indexOf(i);
      const subA = (2 * Math.PI * gi) / Math.max(gs, 1);
      const subR = Math.min(cellW * 0.25, 12 + gs * 2); // fit within cell

      return {
        id: d.id, idx: i,
        title: d.title.replace("[세계사] ", ""),
        fullTitle: d.title,
        subtitle: d.subtitle || "",
        type: d.documentType,
        importance: d.importance || 3,
        group: key,
        year: m.year,
        country: m.country || "",
        region: m.region || "",
        category: m.category || "",
        conns: connectionCounts[i],
        baseR: 2 + (d.importance || 3) * 0.6 + Math.sqrt(connectionCounts[i]) * 0.5, // base radius — small, scaled by zoom at render time
        r: 0, // computed at render time
        x: groupCenter.x + Math.cos(subA) * subR + (Math.random() - 0.5) * 12,
        y: groupCenter.y + Math.sin(subA) * subR + (Math.random() - 0.5) * 12,
        vx: 0, vy: 0,
      };
    });

    nodesRef.current = nodes;
    edgesRef.current = finalEdges;
    iterationRef.current = 0;
    cameraRef.current = { x: 0, y: 0, z: 1 };
    forceRerender(t => t + 1);
  }, [filtered, canvasSize, groupBy, getGroup]);

  // Physics
  useEffect(() => {
    let run = true;
    const centerX = canvasSize.width / 2, centerY = canvasSize.height / 2;
    let settled = false;
    const step = () => {
      if (!run) return;
      const ns = nodesRef.current, es = edgesRef.current;
      if (ns.length === 0) { animationRef.current = requestAnimationFrame(step); return; }
      const N = ns.length;

      // If already settled, only re-render (no physics), and check less often
      if (settled) {
        // Still need to re-render for hover/select updates
        forceRerender(t => t + 1);
        animationRef.current = requestAnimationFrame(step);
        return;
      }

      iterationRef.current++;
      // Cooling: force decreases over time → simulation settles
      const alpha = Math.max(0, 1 - iterationRef.current / 400); // reaches 0 at frame 400 (~7s)
      if (alpha <= 0) { settled = true; forceRerender(t => t + 1); animationRef.current = requestAnimationFrame(step); return; }

      const damp = 0.85;
      for (const node of ns) { node.vx *= damp; node.vy *= damp; }

      // Repulsion
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const dx = ns[j].x - ns[i].x, dy = ns[j].y - ns[i].y;
        const distSq = dx * dx + dy * dy;
        if (distSq > 490000) continue;
        const distance = Math.sqrt(distSq) || 1;
        const force = (GRAPH_CONFIG.REPULSION_STRENGTH / (distance * distance)) * alpha;
        ns[i].vx -= (dx / distance) * force; ns[i].vy -= (dy / distance) * force;
        ns[j].vx += (dx / distance) * force; ns[j].vy += (dy / distance) * force;
      }

      // Edge attraction
      for (const edge of es) {
        const nodeA = ns[edge.s], nodeB = ns[edge.t];
        const dx = nodeB.x - nodeA.x, dy = nodeB.y - nodeA.y, distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (distance - GRAPH_CONFIG.SPRING_REST_LENGTH) * GRAPH_CONFIG.SPRING_STIFFNESS * Math.min(edge.w, 4) * alpha;
        nodeA.vx += (dx / distance) * force; nodeA.vy += (dy / distance) * force;
        nodeB.vx -= (dx / distance) * force; nodeB.vy -= (dy / distance) * force;
      }

      // Group: pull toward centroid
      const groupCentroids = {};
      for (const node of ns) {
        if (!node.group || node.group === "기타") continue;
        if (!groupCentroids[node.group]) groupCentroids[node.group] = { sx: 0, sy: 0, cnt: 0 };
        groupCentroids[node.group].sx += node.x; groupCentroids[node.group].sy += node.y; groupCentroids[node.group].cnt++;
      }
      for (const k in groupCentroids) { groupCentroids[k].cx = groupCentroids[k].sx / groupCentroids[k].cnt; groupCentroids[k].cy = groupCentroids[k].sy / groupCentroids[k].cnt; }

      for (const node of ns) {
        if (!node.group || node.group === "기타" || !groupCentroids[node.group]) continue;
        const centroid = groupCentroids[node.group];
        const dx = centroid.cx - node.x, dy = centroid.cy - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        if (distance > 15) {
          const force = GRAPH_CONFIG.GROUP_ATTRACTION * alpha * distance;
          node.vx += (dx / distance) * force; node.vy += (dy / distance) * force;
        }
      }

      // Group repulsion — push apart, decays with alpha like everything else
      const centroidKeys = Object.keys(groupCentroids);
      for (let i = 0; i < centroidKeys.length; i++) for (let j = i + 1; j < centroidKeys.length; j++) {
        const centroidA = groupCentroids[centroidKeys[i]], centroidB = groupCentroids[centroidKeys[j]];
        const dx = centroidB.cx - centroidA.cx, dy = centroidB.cy - centroidA.cy;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const radiusA = Math.sqrt(centroidA.cnt) * 18 + 30;
        const radiusB = Math.sqrt(centroidB.cnt) * 18 + 30;
        const minD = radiusA + radiusB + 50;
        if (distance < minD) {
          const push = (minD - distance) * 0.025 * alpha;
          for (const node of ns) {
            if (node.group === centroidKeys[i]) { node.vx -= (dx / distance) * push; node.vy -= (dy / distance) * push; }
            if (node.group === centroidKeys[j]) { node.vx += (dx / distance) * push; node.vy += (dy / distance) * push; }
          }
        }
      }

      // Center gravity
      for (const node of ns) {
        node.vx += (centerX - node.x) * 0.0004 * alpha;
        node.vy += (centerY - node.y) * 0.0004 * alpha;
      }

      // Apply — check total energy to detect settling
      let totalEnergy = 0;
      for (const node of ns) {
        if (dragRef.current.active && dragRef.current.kind === "node" && ns[dragRef.current.nodeIndex]?.id === node.id) { node.vx = 0; node.vy = 0; continue; }
        const sp = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (sp > 3) { node.vx = (node.vx / sp) * 3; node.vy = (node.vy / sp) * 3; }
        node.x += node.vx; node.y += node.vy;
        totalEnergy += node.vx * node.vx + node.vy * node.vy;
      }

      // If total energy is very low, mark as settled
      if (totalEnergy < 0.01 * N) settled = true;

      forceRerender(t => t + 1);
      animationRef.current = requestAnimationFrame(step);
    };
    animationRef.current = requestAnimationFrame(step);
    return () => { run = false; cancelAnimationFrame(animationRef.current); };
  }, [canvasSize, filtered]);

  // ---- Mouse helpers ----
  const s2w = useCallback((clientX, clientY) => {
    const c = cameraRef.current, el = canvasRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    // Account for CSS scaling: actual canvas coords
    const scaleX = canvasSize.width / rect.width, scaleY = canvasSize.height / rect.height;
    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;
    const wcx = canvasSize.width / 2 - c.x, wcy = canvasSize.height / 2 - c.y;
    return {
      x: (canvasX - canvasSize.width / 2) / c.z + wcx,
      y: (canvasY - canvasSize.height / 2) / c.z + wcy,
    };
  }, [canvasSize]);

  const hitNode = useCallback((wx, wy) => {
    const ns = nodesRef.current;
    const z = cameraRef.current.z;
    const sc = Math.sqrt(z);
    for (let i = ns.length - 1; i >= 0; i--) {
      const dx = wx - ns[i].x, dy = wy - ns[i].y;
      const hr = ns[i].baseR * sc + 4; // world-coord hit area
      if (dx * dx + dy * dy < hr * hr) return i;
    }
    return -1;
  }, []);

  const onDown = useCallback((e) => {
    if (e.button !== 0) return;
    const { x, y } = s2w(e.clientX, e.clientY);
    const ni = hitNode(x, y);
    dragRef.current = { active: true, kind: ni >= 0 ? "node" : "pan", nodeIndex: ni, startX: e.clientX, startY: e.clientY, cameraStartX: cameraRef.current.x, cameraStartY: cameraRef.current.y, moved: false };
  }, [s2w, hitNode]);

  const onMove = useCallback((e) => {
    if (!dragRef.current.active) {
      const { x, y } = s2w(e.clientX, e.clientY);
      const ni = hitNode(x, y);
      setHoveredNodeId(ni >= 0 ? nodesRef.current[ni]?.id : null);
    }
    const drag = dragRef.current;
    if (!drag.active) return;
    const dx = e.clientX - drag.startX, dy = e.clientY - drag.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true;
    if (drag.kind === "pan") {
      const rect = canvasRef.current?.getBoundingClientRect();
      const scaleX = rect ? canvasSize.width / rect.width : 1;
      cameraRef.current.x = drag.cameraStartX + (dx * scaleX) / cameraRef.current.z;
      cameraRef.current.y = drag.cameraStartY + (dy * scaleX) / cameraRef.current.z;
      forceRerender(t => t + 1);
    } else if (drag.kind === "node" && drag.nodeIndex >= 0) {
      const node = nodesRef.current[drag.nodeIndex];
      if (node) { const w = s2w(e.clientX, e.clientY); node.x = w.x; node.y = w.y; node.vx = 0; node.vy = 0; iterationRef.current = Math.max(0, iterationRef.current - 100); }
    }
  }, [s2w, hitNode, canvasSize]);

  const onUp = useCallback(() => {
    const drag = dragRef.current;
    if (drag.active && !drag.moved) {
      if (drag.kind === "node" && drag.nodeIndex >= 0) {
        const nid = nodesRef.current[drag.nodeIndex]?.id;
        if (selectedNodeId === nid) {
          // Already selected → open document
          navigate(`/vault/${nid}`);
        } else {
          setSelectedNodeId(nid);
        }
      } else {
        setSelectedNodeId(null);
      }
    }
    dragRef.current.active = false;
  }, [selectedNodeId, navigate]);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const c = cameraRef.current, el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const scaleX = canvasSize.width / rect.width;
    const factor = e.deltaY > 0 ? 0.93 : 1.07;
    const nz = Math.max(0.15, Math.min(6, c.z * factor));
    const mx = (e.clientX - rect.left) * scaleX - canvasSize.width / 2;
    const my = (e.clientY - rect.top) * scaleX - canvasSize.height / 2;
    const wcx = canvasSize.width / 2 - c.x, wcy = canvasSize.height / 2 - c.y;
    const wmx = mx / c.z + wcx, wmy = my / c.z + wcy;
    c.x = canvasSize.width / 2 - wmx + mx / nz;
    c.y = canvasSize.height / 2 - wmy + my / nz;
    c.z = nz;
    forceRerender(t => t + 1);
  }, [canvasSize]);

  const resetView = useCallback(() => { cameraRef.current = { x: 0, y: 0, z: 1 }; iterationRef.current = 0; forceRerender(t => t + 1); }, []);

  // ---- Derived ----
  const ns = nodesRef.current, es = edgesRef.current, cam = cameraRef.current;
  const selDoc = useMemo(() => docs.find(d => d.id === selectedNodeId), [docs, selectedNodeId]);

  const nbIds = useMemo(() => {
    if (!hoveredNodeId) return new Set();
    const idx = ns.findIndex(n => n.id === hoveredNodeId);
    if (idx < 0) return new Set();
    const s = new Set([hoveredNodeId]);
    for (const e of es) { if (e.s === idx) s.add(ns[e.t]?.id); if (e.t === idx) s.add(ns[e.s]?.id); }
    return s;
  }, [hoveredNodeId, ns, es]);

  const selConns = useMemo(() => {
    if (!selectedNodeId) return [];
    const idx = ns.findIndex(n => n.id === selectedNodeId);
    if (idx < 0) return [];
    return es.filter(e => e.s === idx || e.t === idx).map(e => {
      const nd = ns[e.s === idx ? e.t : e.s];
      if (!nd) return null;
      const maxW = 7; // theoretical max weight (3+2+1+2 = 8, but practical max ~7)
      const pct = Math.round((e.w / maxW) * 100);
      return { id: nd.id, title: nd.title, type: nd.type, year: nd.year, country: nd.country, region: nd.region, category: nd.category, w: e.w, pct, reasons: e.reasons || [] };
    }).filter(Boolean).sort((a, b) => b.w - a.w);
  }, [selectedNodeId, ns, es]);

  // Generate multi-perspective insights: curated + auto-generated
  const selInsights = useMemo(() => {
    if (!selectedNodeId) return [];
    const selNode = ns.find(n => n.id === selectedNodeId);
    if (!selNode) return [];
    const insights = [];
    const yr = selNode.year;
    const yrStr = yr < 0 ? `기원전 ${Math.abs(yr)}년` : `${yr}년`;
    const sameCountry = selConns.filter(c => c.country && c.country === selNode.country);
    const crossRegion = selConns.filter(c => c.region && c.region !== selNode.region);
    const cats = [...new Set(selConns.map(c => c.category).filter(Boolean))];
    const catKrs = cats.map(c => CATEGORY_LABELS_KR[c] || c);

    // ===== 1. Curated insights (from history-insights.js) =====
    const curated = CURATED_INSIGHTS[selNode.title];
    if (curated) {
      // International significance
      if (curated.international) {
        insights.push({ title: "국제적 의의", icon: "🌐", text: curated.international });
      }

      // Multi-perspective analysis
      if (curated.perspectives) {
        for (const p of curated.perspectives) {
          insights.push({ title: p.viewpoint, icon: p.viewpoint.includes("법") ? "⚖️" : p.viewpoint.includes("경제") ? "📊" : p.viewpoint.includes("철학") ? "💭" : p.viewpoint.includes("사회") ? "👥" : "📌", text: p.text });
        }
      }

      // Parallel events in other countries
      if (curated.parallels) {
        for (const p of curated.parallels) {
          // Check if this parallel event exists in our connected nodes
          const found = selConns.find(c => c.title === p.event);
          insights.push({
            title: `비교 사례: ${p.country}`,
            icon: "🔄",
            text: p.text + (found ? ` (연결 강도: ${found.pct}%)` : ""),
          });
        }
      }
    }

    // ===== 2. News ↔ History connection insights =====
    const selDocObj = docs.find(d => d.id === selectedNodeId);
    const selType = selDocObj?.documentType;
    const historyConns = selConns.filter(c => c.type === "note");
    const newsConns = selConns.filter(c => c.type === "news");

    if (selType === "news" && historyConns.length > 0) {
      const examples = historyConns.slice(0, 3).map(c => `"${c.title}"(${c.year < 0 ? "BC" + Math.abs(c.year) : c.year || ""})`).join(", ");
      insights.push({
        title: "현재 뉴스의 역사적 맥락", icon: "📰",
        text: `이 뉴스 기사는 ${historyConns.length}개의 역사적 사건과 연결됩니다: ${examples}. 현재 사건을 역사적 맥락에서 이해하면 그 원인과 향후 전개 방향에 대한 더 깊은 통찰을 얻을 수 있습니다.`
      });
    }

    if (selType === "note" && newsConns.length > 0) {
      insights.push({
        title: "현대적 반향", icon: "📰",
        text: `이 역사적 사건과 관련된 ${newsConns.length}개의 최근 뉴스가 있습니다. 과거의 사건이 현재에도 여전히 영향을 미치고 있음을 보여줍니다.`
      });
    }

    // ===== 3. Auto-generated insights (for events without curated data) =====
    if (!curated || insights.length < 3) {
      // Causal chain
      const strongest = selConns[0];
      if (strongest && strongest.w >= 5 && strongest.country === selNode.country) {
        const diff = Math.abs((strongest.year || 0) - yr);
        const before = (strongest.year || 0) < yr;
        insights.push({
          title: "인과적 연쇄", icon: "🔗",
          text: `"${strongest.title}"${before ? "이(가) 선행하여" : "이(가) 뒤이어"} ${diff}년 ${before ? "후" : "전"} ${selNode.country}에서 발생. ${before ? "이 사건의 역사적 배경이자 직접적 원인으로 작용했을 가능성이 높습니다." : "이 사건의 직접적 결과물로 볼 수 있습니다."}`
        });
      }

      // National trajectory
      if (sameCountry.length >= 2 && selNode.country) {
        const sorted = [...sameCountry].sort((a, b) => (a.year || 0) - (b.year || 0));
        const earliest = sorted[0], latest = sorted[sorted.length - 1];
        const span = Math.abs((latest.year || 0) - (earliest.year || 0));
        insights.push({
          title: `${selNode.country}의 역사적 궤적`, icon: "🏛️",
          text: `"${earliest.title}"(${earliest.year < 0 ? "BC" + Math.abs(earliest.year) : earliest.year})부터 "${latest.title}"(${latest.year})까지 ${span}년에 걸친 ${sameCountry.length}개 사건과 연결. 국가적 변혁의 흐름 속에 위치합니다.`
        });
      }

      // Cross-civilizational
      if (crossRegion.length > 0) {
        const regions = [...new Set(crossRegion.map(c => c.region))];
        insights.push({
          title: "문명 간 파급효과", icon: "🌐",
          text: `${selNode.region}에서 발생한 사건이 ${regions.join("·")} 등에까지 영향. ${yrStr} 전후 동서양 간 역사적 상호작용이 활발했음을 시사합니다.`
        });
      }

      // Thematic convergence
      if (catKrs.length >= 3) {
        insights.push({
          title: "복합적 역사 동인", icon: "📌",
          text: `${catKrs.join(", ")} 등 ${catKrs.length}개 영역에 걸친 사건들과 연결. 정치·군사적 사건에 그치지 않고, 사회·경제·문화적 구조 변동이 복합적으로 작용한 결과물입니다.`
        });
      }

      // Historical turning point
      if (selConns.length >= 5) {
        const beforeCount = selConns.filter(c => c.year && c.year < yr).length;
        const afterCount = selConns.filter(c => c.year && c.year >= yr).length;
        insights.push({
          title: "역사적 전환점", icon: "⚡",
          text: `${selConns.length}개 사건과 연결된 허브 노드. 이전 ${beforeCount}개 사건이 수렴하고 이후 ${afterCount}개 사건으로 분기하는 전환점입니다.`
        });
      }

      // Temporal clustering
      if (selConns.length >= 3) {
        const close = selConns.filter(c => c.year && Math.abs(c.year - yr) < 20);
        if (close.length >= 3) {
          insights.push({
            title: "동시대 연쇄 반응", icon: "⏱️",
            text: `${close.length}개 사건이 ${yrStr} 전후 20년 이내에 집중. 위기의 시대(Age of Crisis) 패턴을 보여줍니다.`
          });
        }
      }
    }

    return insights;
  }, [selectedNodeId, selConns, ns]);

  // ---- Canvas rendering ----
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Proper DPR handling
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    canvas.style.width = canvasSize.width + "px";
    canvas.style.height = canvasSize.height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Clear
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    if (ns.length === 0) return;

    const wcx = canvasSize.width / 2 - cam.x, wcy = canvasSize.height / 2 - cam.y;
    ctx.save();
    ctx.translate(canvasSize.width / 2, canvasSize.height / 2);
    ctx.scale(cam.z, cam.z);
    ctx.translate(-wcx, -wcy);

    // ---- Group background bubbles (only when zoomed in) ----
    const GROUP_COLORS = [
      [59,130,246], [239,68,68], [34,197,94],
      [168,85,247], [245,158,11], [20,184,166],
      [236,72,153], [99,102,241], [234,88,12],
      [107,114,128],
    ];

    // Compute group bounding info (always needed for labels)
    const groupData = {};
    for (const node of ns) {
      if (!node.group || node.group === "기타") continue;
      if (!groupData[node.group]) groupData[node.group] = { nodes: [], sx: 0, sy: 0 };
      groupData[node.group].nodes.push(node);
      groupData[node.group].sx += node.x;
      groupData[node.group].sy += node.y;
    }
    const gNames = Object.keys(groupData).sort((a, b) => groupData[b].nodes.length - groupData[a].nodes.length);

    // Only draw group bubbles when zoomed in past threshold
    if (cam.z > GRAPH_CONFIG.BUBBLE_FADE_START_ZOOM) {
      const bubbleAlpha = Math.min(1, (cam.z - GRAPH_CONFIG.BUBBLE_FADE_START_ZOOM) / GRAPH_CONFIG.BUBBLE_FADE_RANGE); // fade in from z=0.8 to z=1.2
      for (let gi = 0; gi < gNames.length; gi++) {
        const gd = groupData[gNames[gi]];
        if (gd.nodes.length < 2) continue;
        const cx2 = gd.sx / gd.nodes.length, cy2 = gd.sy / gd.nodes.length;
        let maxDist = 0;
        for (const node of gd.nodes) {
          const dist = Math.sqrt((node.x - cx2) ** 2 + (node.y - cy2) ** 2);
          if (dist > maxDist) maxDist = dist;
        }
        const bubbleR = maxDist + 40;
        const [cr, cg, cb] = GROUP_COLORS[gi % GROUP_COLORS.length];

        ctx.globalAlpha = bubbleAlpha;
        ctx.beginPath();
        ctx.arc(cx2, cy2, bubbleR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},0.04)`;
        ctx.fill();
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},0.12)`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Group label
        if (cam.z > 1.0) {
          const groupFs = Math.max(10, Math.min(16, 13 / cam.z));
          ctx.font = `600 ${groupFs}px "Noto Sans KR", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = `rgba(${cr},${cg},${cb},0.5)`;
          ctx.fillText(gNames[gi], cx2, cy2 - bubbleR + 14);
        }
        ctx.globalAlpha = 1;
      }
    }

    // ---- Zoom-aware rendering ----
    const z = cam.z;
    // Nodes should shrink when zoomed out, but not linearly — use sqrt for gentle scaling
    // At z=1: normal size. At z=0.3: ~55% size. At z=2: ~140% size.
    const nodeScale = Math.sqrt(z);
    // For text/strokes, keep them screen-consistent
    const pxToWorld = 1 / z;

    // ---- Edges — Obsidian style: thin gray lines, always visible ----
    for (const edge of es) {
      const nodeA = ns[edge.s], nodeB = ns[edge.t];
      if (!nodeA || !nodeB) continue;
      const hl = hoveredNodeId && (nodeA.id === hoveredNodeId || nodeB.id === hoveredNodeId);
      const sl = selectedNodeId && (nodeA.id === selectedNodeId || nodeB.id === selectedNodeId);
      const faded = hoveredNodeId && !hl;

      ctx.globalAlpha = faded ? 0.03 : hl ? 0.6 : sl ? 0.5 : 0.25;
      ctx.beginPath();
      ctx.moveTo(nodeA.x, nodeA.y);
      ctx.lineTo(nodeB.x, nodeB.y);
      ctx.strokeStyle = hl ? "#555" : sl ? "#888" : "#bbb";
      ctx.lineWidth = (hl ? 1.5 : sl ? 1.2 : 0.7) * pxToWorld;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // ---- Nodes — Obsidian style: two-tone dark/light gray dots ----
    for (const node of ns) {
      const hov = node.id === hoveredNodeId, nb = nbIds.has(node.id), sel = node.id === selectedNodeId;
      const faded = hoveredNodeId && !hov && !nb;

      // Radius: connected nodes bigger, orphan nodes smaller
      // At zoom-out, dots stay visually small but constant screen-size
      const r0 = node.baseR * nodeScale;
      const r = sel ? r0 * 1.4 : hov ? r0 * 1.6 : r0;

      ctx.globalAlpha = faded ? 0.12 : 1;

      // Glow for hovered/selected only
      if (hov || sel) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 5 * nodeScale, 0, Math.PI * 2);
        ctx.fillStyle = sel ? "rgba(80,80,80,0.1)" : "rgba(60,60,60,0.08)";
        ctx.fill();
      }

      // Circle — Obsidian two-tone:
      // High connections + importance → dark (almost black)
      // Low connections → light gray
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      if (sel) ctx.fillStyle = "#333";
      else if (hov) ctx.fillStyle = "#222";
      else if (nb && hoveredNodeId) ctx.fillStyle = "#444";
      else {
        // Darkness based on connections: 0 conns = light gray (#bbb), many conns = dark (#333)
        const t = Math.min(1, node.conns / 8); // normalize: 8+ connections = fully dark
        const gray = Math.round(187 - t * 130); // 187 (#bbb) to 57 (#393939)
        ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
      }
      ctx.fill();

      // No stroke at zoom-out (clean dots). Thin stroke only when zoomed in or interacted.
      if (sel) {
        ctx.strokeStyle = "#222"; ctx.lineWidth = 1.5 * pxToWorld; ctx.stroke();
      } else if (hov) {
        ctx.strokeStyle = "#111"; ctx.lineWidth = 1 * pxToWorld; ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }

    // ---- Node labels — Obsidian style: hidden at zoom-out, visible at zoom-in ----
    // Zoomed out (z < 0.7): NO labels at all (pure dots like Obsidian)
    // z 0.7~1.0: only hovered/selected labels
    // z > 1.0: progressive disclosure based on importance
    // z > 1.5: all labels visible
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    for (const node of ns) {
      const hov = node.id === hoveredNodeId, nb = nbIds.has(node.id), sel = node.id === selectedNodeId;
      const faded = hoveredNodeId && !hov && !nb;
      const isInteracted = hov || sel || (nb && hoveredNodeId);

      // Strict progressive disclosure matching Obsidian behavior:
      let showLabel = false;
      if (isInteracted && z >= 0.5) showLabel = true;  // show hover/select labels at moderate zoom
      if (z > 1.5) showLabel = true;                     // all labels at high zoom
      if (z > 1.2 && node.importance >= 4) showLabel = true; // important nodes at medium-high zoom
      if (z > 1.0 && node.conns >= 5) showLabel = true;     // hub nodes at normal-high zoom
      if (!showLabel) continue;

      ctx.globalAlpha = faded ? 0.04 : isInteracted ? 1 : 0.55;

      const screenFs = isInteracted ? 11 : 9;
      const worldFs = screenFs * pxToWorld;
      const maxLen = z > 1.5 ? 30 : z > 1.0 ? 20 : 14;
      const label = node.title.length > maxLen ? node.title.slice(0, maxLen) + "\u2026" : node.title;

      ctx.font = `${isInteracted ? "600" : "400"} ${worldFs}px "Noto Sans KR", sans-serif`;
      ctx.fillStyle = sel ? "#333" : hov ? "#111" : "#777";
      ctx.fillText(label, node.x, node.y + node.baseR * nodeScale + 3 * pxToWorld);
    }
    ctx.globalAlpha = 1;

    ctx.restore();
  });

  // ---- Loading ----
  if (loading) return (
    <div className="section"><div className="container" style={{ textAlign: "center", padding: 80 }}>
      <div className="spinner" style={{ margin: "0 auto 16px" }} /><p style={{ color: "#999" }}>불러오는 중...</p>
    </div></div>
  );

  // ---- Render ----
  return (
    <div style={{ paddingTop: "clamp(120px, 13vw, 150px)", paddingBottom: 40, background: "#fff", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 20px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
          <div>
            <p className="font-en" style={{ fontSize: 10, letterSpacing: "0.2em", color: "#b08d57", marginBottom: 6 }}>KNOWLEDGE GRAPH</p>
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

        {/* Main */}
        <div style={{ display: "grid", gridTemplateColumns: selDoc ? "1fr 300px" : "1fr", gap: 14 }}>
          {/* Canvas */}
          <div ref={wrapRef} style={{
            height: "max(500px, calc(100vh - 280px))",
            borderRadius: 10, overflow: "hidden",
            border: "1px solid rgba(0,0,0,0.08)",
            background: "#fff", position: "relative",
          }}>
            <canvas ref={canvasRef}
              style={{ display: "block", cursor: dragRef.current.active ? "grabbing" : "grab" }}
              onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp} onWheel={onWheel}
            />

            {/* Bottom bar */}
            <div style={{ position: "absolute", bottom: 8, left: 10, right: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 10, color: "#bbb", pointerEvents: "none" }}>
                {filtered.length}개 노드 &middot; {es.length}개 연결 &middot; 클릭: 선택 &middot; 다시 클릭: 문서 열기
              </span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
                  <button onClick={() => { cameraRef.current.z = Math.min(6, cameraRef.current.z * 1.3); forceRerender(t => t + 1); }}
                    style={{ width: 22, height: 22, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 3, background: "#fff", color: "#888", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                  <span style={{ fontSize: 9, color: "#bbb", width: 28, textAlign: "center" }}>{Math.round(cam.z * 100)}%</span>
                  <button onClick={() => { cameraRef.current.z = Math.max(0.15, cameraRef.current.z * 0.7); forceRerender(t => t + 1); }}
                    style={{ width: 22, height: 22, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 3, background: "#fff", color: "#888", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>&minus;</button>
                </div>
              </div>
            </div>

            {/* Tooltip */}
            {hoveredNodeId && (() => {
              const node = ns.find(n => n.id === hoveredNodeId);
              if (!node) return null;
              const rect = canvasRef.current?.getBoundingClientRect();
              if (!rect) return null;
              const scX = rect.width / canvasSize.width, scY = rect.height / canvasSize.height;
              const wcx2 = canvasSize.width / 2 - cam.x, wcy2 = canvasSize.height / 2 - cam.y;
              const sx = ((node.x - wcx2) * cam.z + canvasSize.width / 2) * scX;
              const sy = ((node.y - wcy2) * cam.z + canvasSize.height / 2) * scY;
              let left = sx + 14, top = sy - 8;
              if (left + 240 > rect.width) left = sx - 254;
              if (top + 90 > rect.height) top = rect.height - 100;
              if (left < 4) left = 4; if (top < 4) top = 4;
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

          {/* Detail Panel */}
          {selDoc && (() => {
            const selMeta = parseMeta(selDoc);
            return (
              <div style={{ alignSelf: "start", position: "sticky", top: 120 }}>
                <div style={{ background: "#fff", borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)", overflow: "hidden" }}>
                  <div style={{ height: 3, background: "#b08d57" }} />
                  <div style={{ padding: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 10, color: "#b08d57", fontWeight: 600 }}>
                        {selMeta.country || ""} {selMeta.year ? (selMeta.year < 0 ? `BC ${Math.abs(selMeta.year)}` : selMeta.year) : ""}
                      </span>
                      <button onClick={() => setSelectedNodeId(null)} style={{ background: "none", border: "none", color: "#ccc", fontSize: 16, cursor: "pointer" }}>&times;</button>
                    </div>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.4, marginBottom: 6 }}>{selDoc.title}</h3>
                    {selDoc.subtitle && <p style={{ fontSize: 11, color: "#888", lineHeight: 1.6, marginBottom: 8 }}>{selDoc.subtitle}</p>}

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                      {selMeta.region && <span style={{ fontSize: 10, color: "#999", background: "#f5f5f3", borderRadius: 4, padding: "2px 6px" }}>{selMeta.region}</span>}
                      {selMeta.category && <span style={{ fontSize: 10, color: "#999", background: "#f5f5f3", borderRadius: 4, padding: "2px 6px" }}>{CATEGORY_LABELS_KR[selMeta.category] || selMeta.category}</span>}
                    </div>

                    <div style={{ display: "flex", gap: 2, marginBottom: 4 }}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} style={{ color: i < (selDoc.importance || 3) ? "#b08d57" : "#ddd", fontSize: 11 }}>{"\u2605"}</span>
                      ))}
                    </div>

                    {/* ---- Insights ---- */}
                    {selInsights.length > 0 && (
                      <>
                        <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "10px 0" }} />
                        <p style={{ fontSize: 9, color: "#b08d57", fontWeight: 700, marginBottom: 6, letterSpacing: "0.08em" }}>HISTORICAL INSIGHT</p>
                        <div style={{ maxHeight: 300, overflowY: "auto" }}>
                        {selInsights.map((ins, i) => (
                          <div key={i} style={{ background: "#fafaf6", border: "1px solid rgba(0,0,0,0.05)", borderRadius: 6, padding: "8px 10px", marginBottom: 6 }}>
                            <p style={{ fontSize: 10, color: "#b08d57", fontWeight: 600, margin: "0 0 3px" }}>
                              {ins.icon && <span style={{ marginRight: 4 }}>{ins.icon}</span>}
                              {ins.title}
                            </p>
                            <p style={{ fontSize: 10, color: "#555", margin: 0, lineHeight: 1.65 }}>{ins.text}</p>
                          </div>
                        ))}
                        </div>
                      </>
                    )}

                    {/* ---- Connections ---- */}
                    {selConns.length > 0 && (
                      <>
                        <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "10px 0" }} />
                        <p style={{ fontSize: 10, color: "#999", fontWeight: 600, marginBottom: 6 }}>
                          연결된 사건 ({selConns.length})
                        </p>
                        {selConns.slice(0, 15).map(cn => (
                          <div key={cn.id} onClick={() => setSelectedNodeId(cn.id)}
                            style={{ padding: "7px 0", borderBottom: "1px solid rgba(0,0,0,0.04)", cursor: "pointer" }}>
                            {/* Title + year */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                              <span style={{ fontSize: 10, color: "#aaa", width: 38, flexShrink: 0, textAlign: "right" }}>
                                {cn.year ? (cn.year < 0 ? `BC${Math.abs(cn.year)}` : cn.year) : ""}
                              </span>
                              <span style={{ fontSize: 11, color: "#1a1a1a", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                                {cn.title}
                              </span>
                            </div>
                            {/* Strength bar + percentage */}
                            <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: 44 }}>
                              <div style={{ flex: 1, height: 3, background: "#f0f0ee", borderRadius: 2, overflow: "hidden" }}>
                                <div style={{ width: `${cn.pct}%`, height: "100%", background: cn.pct >= 70 ? "#b08d57" : cn.pct >= 40 ? "#ccc" : "#ddd", borderRadius: 2 }} />
                              </div>
                              <span style={{ fontSize: 9, color: cn.pct >= 70 ? "#b08d57" : "#bbb", fontWeight: 600, width: 30, textAlign: "right" }}>
                                {cn.pct}%
                              </span>
                            </div>
                            {/* Reasons */}
                            {cn.reasons.length > 0 && (
                              <div style={{ paddingLeft: 44, marginTop: 3 }}>
                                {cn.reasons.map((r, ri) => (
                                  <p key={ri} style={{ fontSize: 9, color: "#aaa", margin: 0, lineHeight: 1.5 }}>
                                    {r}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    )}

                    <button onClick={() => navigate(`/vault/${selDoc.id}`)}
                      style={{ marginTop: 14, width: "100%", padding: "8px 0", borderRadius: 6, background: "#b08d57", color: "#fff", border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                      문서 보기 &rarr;
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
