/**
 * graphRenderer.js — Canvas2D 그래프 렌더링 함수
 * 그룹 버블, 엣지, 노드, 라벨의 그리기 로직을 담당한다.
 * useGraphCanvas에서 호출된다.
 */

import { RENDER, GROUP_COLORS } from "./graphConstants";

/**
 * 그룹 배경 버블을 그린다. 줌 레벨에 따라 페이드인된다.
 */
export function drawGroupBubbles(ctx, ns, cam) {
  const groupData = {};
  for (const node of ns) {
    if (!node.group || node.group === "기타") continue;
    if (!groupData[node.group]) groupData[node.group] = { nodes: [], sx: 0, sy: 0 };
    groupData[node.group].nodes.push(node);
    groupData[node.group].sx += node.x;
    groupData[node.group].sy += node.y;
  }
  const gNames = Object.keys(groupData).sort((a, b) => groupData[b].nodes.length - groupData[a].nodes.length);

  if (cam.z <= RENDER.BUBBLE_FADE_START_ZOOM) return;

  const bubbleAlpha = Math.min(1, (cam.z - RENDER.BUBBLE_FADE_START_ZOOM) / RENDER.BUBBLE_FADE_RANGE);

  for (let gi = 0; gi < gNames.length; gi++) {
    const gd = groupData[gNames[gi]];
    if (gd.nodes.length < 2) continue;
    const cx2 = gd.sx / gd.nodes.length;
    const cy2 = gd.sy / gd.nodes.length;
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

/**
 * 엣지(연결선)를 그린다. 호버/선택 상태에 따라 강조 또는 페이드 처리한다.
 */
export function drawEdges(ctx, ns, es, cam, hoveredNodeId, selectedNodeId) {
  const pxToWorld = 1 / cam.z;

  for (const edge of es) {
    const nodeA = ns[edge.s];
    const nodeB = ns[edge.t];
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
}

/**
 * 노드(원)를 그린다. 연결 수에 따라 명암을 조절한다.
 */
export function drawNodes(ctx, ns, cam, hoveredNodeId, selectedNodeId, neighborIds) {
  const nodeScale = Math.sqrt(cam.z);
  const pxToWorld = 1 / cam.z;

  for (const node of ns) {
    const hov = node.id === hoveredNodeId;
    const nb = neighborIds.has(node.id);
    const sel = node.id === selectedNodeId;
    const faded = hoveredNodeId && !hov && !nb;

    const baseRadius = node.baseR * nodeScale;
    const radius = sel ? baseRadius * 1.4 : hov ? baseRadius * 1.6 : baseRadius;

    ctx.globalAlpha = faded ? 0.12 : 1;

    // 글로우 (호버/선택 시)
    if (hov || sel) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius + 5 * nodeScale, 0, Math.PI * 2);
      ctx.fillStyle = sel ? "rgba(80,80,80,0.1)" : "rgba(60,60,60,0.08)";
      ctx.fill();
    }

    // 원 본체 -- 연결 수에 따라 밝은 회색(#bbb)~어두운 회색(#393939) 보간
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    if (sel) ctx.fillStyle = "#333";
    else if (hov) ctx.fillStyle = "#222";
    else if (nb && hoveredNodeId) ctx.fillStyle = "#444";
    else {
      const connRatio = Math.min(1, node.conns / 8);
      const gray = Math.round(187 - connRatio * 130);
      ctx.fillStyle = `rgb(${gray},${gray},${gray})`;
    }
    ctx.fill();

    if (sel) {
      ctx.strokeStyle = "#222";
      ctx.lineWidth = 1.5 * pxToWorld;
      ctx.stroke();
    } else if (hov) {
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 1 * pxToWorld;
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }
}

/**
 * 노드 라벨을 그린다. 줌 레벨에 따라 점진적으로 표시(progressive disclosure)한다.
 */
export function drawLabels(ctx, ns, cam, hoveredNodeId, selectedNodeId, neighborIds) {
  const zoom = cam.z;
  const nodeScale = Math.sqrt(zoom);
  const pxToWorld = 1 / zoom;

  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  for (const node of ns) {
    const hov = node.id === hoveredNodeId;
    const nb = neighborIds.has(node.id);
    const sel = node.id === selectedNodeId;
    const faded = hoveredNodeId && !hov && !nb;
    const isInteracted = hov || sel || (nb && hoveredNodeId);

    let showLabel = false;
    if (isInteracted && zoom >= 0.5) showLabel = true;
    if (zoom > 1.5) showLabel = true;
    if (zoom > 1.2 && node.importance >= 4) showLabel = true;
    if (zoom > 1.0 && node.conns >= 5) showLabel = true;
    if (!showLabel) continue;

    ctx.globalAlpha = faded ? 0.04 : isInteracted ? 1 : 0.55;

    const screenFs = isInteracted ? 11 : 9;
    const worldFs = screenFs * pxToWorld;
    const maxLen = zoom > 1.5 ? 30 : zoom > 1.0 ? 20 : 14;
    const label = node.title.length > maxLen ? node.title.slice(0, maxLen) + "\u2026" : node.title;

    ctx.font = `${isInteracted ? "600" : "400"} ${worldFs}px "Noto Sans KR", sans-serif`;
    ctx.fillStyle = sel ? "#333" : hov ? "#111" : "#777";
    ctx.fillText(label, node.x, node.y + node.baseR * nodeScale + 3 * pxToWorld);
  }
  ctx.globalAlpha = 1;
}
