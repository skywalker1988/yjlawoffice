/**
 * graphUtils.js — 지식 그래프 데이터 전처리 유틸리티
 * 문서 메타데이터 파싱, 시대 판정, 엣지/노드 생성 로직을 담당한다.
 */

import { getTypeLabel } from "../../utils/document-types";
import { EDGE_RULES, CATEGORY_LABELS_KR } from "./graphConstants";

/**
 * 문서의 metadata 필드를 안전하게 파싱한다.
 * @param {object} doc - 문서 객체
 * @returns {object} 파싱된 메타데이터 (실패 시 빈 객체)
 */
export function parseMeta(doc) {
  if (!doc.metadata) return {};
  if (typeof doc.metadata === "object") return doc.metadata;
  try {
    return JSON.parse(doc.metadata);
  } catch {
    return {};
  }
}

/**
 * 연도를 시대 문자열로 변환한다.
 * @param {number} year
 * @returns {string} 시대명
 */
export function getEra(year) {
  if (year < -500) return "기원전";
  if (year < 500) return "고대";
  if (year < 1500) return "중세";
  if (year < 1800) return "근세";
  if (year < 1900) return "근대";
  if (year < 2000) return "현대";
  return "21세기";
}

/**
 * 그룹핑 기준에 따라 노드의 그룹 키를 반환한다.
 * @param {string} groupBy - 그룹핑 기준 ("country" | "region" | "category" | "era" | "type")
 * @param {object} meta - 파싱된 메타데이터
 * @param {object} doc - 문서 객체
 * @returns {string} 그룹 키
 */
export function getGroupKey(groupBy, meta, doc) {
  if (groupBy === "country") return meta?.country || "기타";
  if (groupBy === "region") return meta?.region || "기타";
  if (groupBy === "category") return CATEGORY_LABELS_KR[meta?.category] || "기타";
  if (groupBy === "era") return meta?.year != null ? getEra(meta.year) : "기타";
  if (groupBy === "type") return getTypeLabel(doc?.documentType || "note");
  return "기타";
}

/**
 * 문서 쌍 간의 의미 기반 엣지(연결)를 생성한다.
 * 메타데이터(국가/지역/카테고리/연도) + 키워드 일치를 종합적으로 판정한다.
 *
 * @param {Array} filtered - 필터링된 문서 배열
 * @param {Array} metas - 각 문서의 파싱된 메타데이터 배열
 * @returns {Array} 엣지 배열 [{ s, t, w, reasons }]
 */
export function buildEdges(filtered, metas) {
  const edges = [];

  for (let i = 0; i < filtered.length; i++) {
    const mi = metas[i];
    const titleI = filtered[i].title.toLowerCase();
    const typeI = filtered[i].documentType;

    for (let j = i + 1; j < filtered.length; j++) {
      const mj = metas[j];
      const titleJ = filtered[j].title.toLowerCase();
      const typeJ = filtered[j].documentType;

      let weight = 0;
      const reasons = [];

      // A. 역사 이벤트 간 연결 (양쪽 모두 연도 보유)
      if (mi.year && mj.year) {
        const yearDiff = Math.abs(mi.year - mj.year);

        if (mi.country && mi.country === mj.country && yearDiff < EDGE_RULES.SAME_COUNTRY_YEAR_THRESHOLD) {
          weight += 3;
          reasons.push(`같은 국가 (${mi.country}), ${yearDiff}년 차이`);
          if (yearDiff < EDGE_RULES.SAME_COUNTRY_CLOSE_YEAR) weight += 2;
        }

        if (mi.region && mi.region === mj.region && getEra(mi.year) === getEra(mj.year)) {
          weight += 1;
          reasons.push(`같은 지역 (${mi.region}), 같은 시대 (${getEra(mi.year)})`);
        }

        if (mi.category && mi.category === mj.category && yearDiff < EDGE_RULES.SAME_CATEGORY_YEAR_THRESHOLD && mi.region === mj.region) {
          weight += 2;
          reasons.push(`같은 분류 (${mi.category}), ${mi.region}에서 ${yearDiff}년 차이`);
        }
      }

      // B. 뉴스 <-> 역사: 제목 키워드 매칭
      if ((typeI === "news" || typeJ === "news") && (typeI !== typeJ || typeI === "news")) {
        const newsTitle = typeI === "news" ? titleI : titleJ;
        const otherMeta = typeI === "news" ? mj : mi;
        const otherTitle = typeI === "news" ? titleJ : titleI;

        if (otherMeta.country && newsTitle.includes(otherMeta.country.toLowerCase())) {
          weight += 3;
          reasons.push(`뉴스에서 "${otherMeta.country}" 언급 -- 역사적 맥락 연결`);
        }

        const wordsA = new Set(newsTitle.replace(/[[\]세계사]/g, "").split(/\s+/).filter(w => w.length >= 2));
        const wordsB = new Set(otherTitle.replace(/[[\]세계사]/g, "").split(/\s+/).filter(w => w.length >= 2));
        const commonWords = [...wordsA].filter(w => wordsB.has(w));
        if (commonWords.length >= 1) {
          weight += commonWords.length * 2;
          reasons.push(`키워드 일치: ${commonWords.join(", ")}`);
        }
      }

      // C. 동일 문서 유형 (note 제외)
      if (typeI === typeJ && typeI !== "note") {
        weight += 1;
        reasons.push(`같은 문서 유형 (${getTypeLabel(typeI)})`);
      }

      if (weight >= EDGE_RULES.MIN_WEIGHT) {
        edges.push({ s: i, t: j, w: weight, reasons });
      }
    }
  }

  return edges;
}

/**
 * 문서 + 엣지 정보를 바탕으로 노드 배열을 생성한다.
 * 그룹별로 초기 위치를 격자 배치한다.
 *
 * @param {Array} filtered - 문서 배열
 * @param {Array} metas - 메타데이터 배열
 * @param {Array} edges - 엣지 배열
 * @param {string} groupBy - 그룹핑 기준
 * @param {{ width: number, height: number }} canvasSize
 * @returns {{ nodes: Array, finalEdges: Array }}
 */
export function buildGraph(filtered, metas, edges, groupBy, canvasSize) {
  const centerX = canvasSize.width / 2;
  const centerY = canvasSize.height / 2;

  // 엣지 수 제한: 너무 많으면 상위 가중치만 유지
  const maxEdgeCount = Math.min(edges.length, filtered.length * 3);
  const finalEdges = edges.length > maxEdgeCount
    ? [...edges].sort((a, b) => b.w - a.w).slice(0, maxEdgeCount)
    : edges;

  // 각 노드의 연결 수 집계
  const connectionCounts = new Array(filtered.length).fill(0);
  for (const e of finalEdges) {
    connectionCounts[e.s]++;
    connectionCounts[e.t]++;
  }

  // 그룹별 분류
  const groups = {};
  filtered.forEach((d, i) => {
    const key = getGroupKey(groupBy, metas[i], filtered[i]);
    (groups[key] ??= []).push(i);
  });

  // 그룹 격자 배치 (큰 그룹 우선)
  const groupKeys = Object.keys(groups).sort((a, b) => groups[b].length - groups[a].length);
  const cols = Math.ceil(Math.sqrt(groupKeys.length * (canvasSize.width / canvasSize.height)));
  const rows = Math.ceil(groupKeys.length / cols);
  const cellW = canvasSize.width / (cols + 1);
  const cellH = canvasSize.height / (rows + 1);

  const groupCenters = {};
  groupKeys.forEach((k, i) => {
    groupCenters[k] = {
      x: cellW * ((i % cols) + 1),
      y: cellH * (Math.floor(i / cols) + 1),
    };
  });

  // 노드 생성
  const nodes = filtered.map((d, i) => {
    const meta = metas[i];
    const key = getGroupKey(groupBy, meta, d);
    const groupCenter = groupCenters[key] || { x: centerX, y: centerY };
    const groupSize = (groups[key] || []).length;
    const groupIndex = (groups[key] || []).indexOf(i);
    const subAngle = (2 * Math.PI * groupIndex) / Math.max(groupSize, 1);
    const subRadius = Math.min(cellW * 0.25, 12 + groupSize * 2);

    return {
      id: d.id,
      idx: i,
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
      baseR: 2 + (d.importance || 3) * 0.6 + Math.sqrt(connectionCounts[i]) * 0.5,
      r: 0,
      x: groupCenter.x + Math.cos(subAngle) * subRadius + (Math.random() - 0.5) * 12,
      y: groupCenter.y + Math.sin(subAngle) * subRadius + (Math.random() - 0.5) * 12,
      vx: 0,
      vy: 0,
    };
  });

  return { nodes, finalEdges };
}
