/**
 * useGraphCanvas.js — Canvas2D 렌더링 + 물리 시뮬레이션 훅
 * 노드/엣지의 물리 연산, 캔버스 그리기, 마우스 상호작용을 관리한다.
 */

import { useEffect, useRef, useCallback, useState } from "react";
import { PHYSICS, RENDER } from "./graphConstants";
import { drawGroupBubbles, drawEdges, drawNodes, drawLabels } from "./graphRenderer";

/**
 * 그룹 간 반발력을 노드에 적용한다.
 * 가까운 그룹 쌍을 찾아 소속 노드들을 밀어낸다.
 * @param {object} groupCentroids - { [group]: { cx, cy, cnt } }
 * @param {Array} nodes - 노드 배열 (vx, vy 직접 수정)
 * @param {number} alpha - 감쇠 계수
 */
function applyGroupRepulsion(groupCentroids, nodes, alpha) {
  const keys = Object.keys(groupCentroids);
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const cA = groupCentroids[keys[i]];
      const cB = groupCentroids[keys[j]];
      const dx = cB.cx - cA.cx;
      const dy = cB.cy - cA.cy;
      const distance = Math.sqrt(dx * dx + dy * dy) || 1;
      const minD = Math.sqrt(cA.cnt) * 18 + 30 + Math.sqrt(cB.cnt) * 18 + 30 + PHYSICS.GROUP_REPULSION_PADDING;
      if (distance >= minD) continue;

      const push = (minD - distance) * PHYSICS.GROUP_REPULSION_FORCE * alpha;
      const fx = (dx / distance) * push;
      const fy = (dy / distance) * push;
      for (const node of nodes) {
        if (node.group === keys[i]) { node.vx -= fx; node.vy -= fy; }
        else if (node.group === keys[j]) { node.vx += fx; node.vy += fy; }
      }
    }
  }
}

/**
 * @param {object} params
 * @param {React.RefObject} params.canvasRef
 * @param {React.RefObject} params.wrapRef
 * @param {React.MutableRefObject} params.nodesRef
 * @param {React.MutableRefObject} params.edgesRef
 * @param {{ width: number, height: number }} params.canvasSize
 * @param {string|null} params.hoveredNodeId
 * @param {string|null} params.selectedNodeId
 * @param {Set} params.neighborIds - 호버된 노드의 이웃 ID 집합
 * @param {Function} params.onHover - (id|null) => void
 * @param {Function} params.onSelect - (id|null) => void
 * @param {Function} params.onNavigate - (id) => void  노드 더블클릭 시 문서 열기
 */
export function useGraphCanvas({
  canvasRef,
  nodesRef,
  edgesRef,
  canvasSize,
  hoveredNodeId,
  selectedNodeId,
  neighborIds,
  onHover,
  onSelect,
  onNavigate,
}) {
  const cameraRef = useRef({ x: 0, y: 0, z: 1 });
  const dragRef = useRef({
    active: false, kind: "", nodeIndex: -1,
    startX: 0, startY: 0, cameraStartX: 0, cameraStartY: 0, moved: false,
  });
  const iterationRef = useRef(0);
  const animationRef = useRef(null);
  const [, forceRerender] = useState(0);
  const tick = () => forceRerender(t => t + 1);

  // --- 좌표 변환: 스크린 -> 월드 ---
  const screenToWorld = useCallback((clientX, clientY) => {
    const camera = cameraRef.current;
    const el = canvasRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    const scaleX = canvasSize.width / rect.width;
    const scaleY = canvasSize.height / rect.height;
    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;
    const worldCenterX = canvasSize.width / 2 - camera.x;
    const worldCenterY = canvasSize.height / 2 - camera.y;
    return {
      x: (canvasX - canvasSize.width / 2) / camera.z + worldCenterX,
      y: (canvasY - canvasSize.height / 2) / camera.z + worldCenterY,
    };
  }, [canvasSize, canvasRef]);

  // --- 히트테스트: 월드 좌표에서 노드 인덱스 반환 ---
  const hitNode = useCallback((wx, wy) => {
    const ns = nodesRef.current;
    const sc = Math.sqrt(cameraRef.current.z);
    for (let i = ns.length - 1; i >= 0; i--) {
      const dx = wx - ns[i].x;
      const dy = wy - ns[i].y;
      const hr = ns[i].baseR * sc + 4;
      if (dx * dx + dy * dy < hr * hr) return i;
    }
    return -1;
  }, [nodesRef]);

  // --- 마우스 이벤트 핸들러 ---
  const onDown = useCallback((e) => {
    if (e.button !== 0) return;
    const { x, y } = screenToWorld(e.clientX, e.clientY);
    const ni = hitNode(x, y);
    dragRef.current = {
      active: true,
      kind: ni >= 0 ? "node" : "pan",
      nodeIndex: ni,
      startX: e.clientX,
      startY: e.clientY,
      cameraStartX: cameraRef.current.x,
      cameraStartY: cameraRef.current.y,
      moved: false,
    };
  }, [screenToWorld, hitNode]);

  const onMove = useCallback((e) => {
    if (!dragRef.current.active) {
      const { x, y } = screenToWorld(e.clientX, e.clientY);
      const ni = hitNode(x, y);
      onHover(ni >= 0 ? nodesRef.current[ni]?.id : null);
    }
    const drag = dragRef.current;
    if (!drag.active) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) drag.moved = true;

    if (drag.kind === "pan") {
      const rect = canvasRef.current?.getBoundingClientRect();
      const scaleX = rect ? canvasSize.width / rect.width : 1;
      cameraRef.current.x = drag.cameraStartX + (dx * scaleX) / cameraRef.current.z;
      cameraRef.current.y = drag.cameraStartY + (dy * scaleX) / cameraRef.current.z;
      tick();
    } else if (drag.kind === "node" && drag.nodeIndex >= 0) {
      const node = nodesRef.current[drag.nodeIndex];
      if (node) {
        const worldPos = screenToWorld(e.clientX, e.clientY);
        node.x = worldPos.x;
        node.y = worldPos.y;
        node.vx = 0;
        node.vy = 0;
        iterationRef.current = Math.max(0, iterationRef.current - 100);
      }
    }
  }, [screenToWorld, hitNode, canvasSize, canvasRef, nodesRef, onHover]);

  const onUp = useCallback(() => {
    const drag = dragRef.current;
    if (drag.active && !drag.moved) {
      if (drag.kind === "node" && drag.nodeIndex >= 0) {
        const nid = nodesRef.current[drag.nodeIndex]?.id;
        if (selectedNodeId === nid) {
          onNavigate(nid);
        } else {
          onSelect(nid);
        }
      } else {
        onSelect(null);
      }
    }
    dragRef.current.active = false;
  }, [selectedNodeId, nodesRef, onSelect, onNavigate]);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const camera = cameraRef.current;
    const el = canvasRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const scaleX = canvasSize.width / rect.width;
    const factor = e.deltaY > 0 ? 0.93 : 1.07;
    const newZoom = Math.max(RENDER.MIN_ZOOM, Math.min(RENDER.MAX_ZOOM, camera.z * factor));
    const mouseX = (e.clientX - rect.left) * scaleX - canvasSize.width / 2;
    const mouseY = (e.clientY - rect.top) * scaleX - canvasSize.height / 2;
    const worldCenterX = canvasSize.width / 2 - camera.x;
    const worldCenterY = canvasSize.height / 2 - camera.y;
    const worldMouseX = mouseX / camera.z + worldCenterX;
    const worldMouseY = mouseY / camera.z + worldCenterY;
    camera.x = canvasSize.width / 2 - worldMouseX + mouseX / newZoom;
    camera.y = canvasSize.height / 2 - worldMouseY + mouseY / newZoom;
    camera.z = newZoom;
    tick();
  }, [canvasSize, canvasRef]);

  const resetView = useCallback(() => {
    cameraRef.current = { x: 0, y: 0, z: 1 };
    iterationRef.current = 0;
    tick();
  }, []);

  const zoomIn = useCallback(() => {
    cameraRef.current.z = Math.min(RENDER.MAX_ZOOM, cameraRef.current.z * 1.3);
    tick();
  }, []);

  const zoomOut = useCallback(() => {
    cameraRef.current.z = Math.max(RENDER.MIN_ZOOM, cameraRef.current.z * 0.7);
    tick();
  }, []);

  // --- 물리 시뮬레이션 루프 ---
  useEffect(() => {
    let run = true;
    const centerX = canvasSize.width / 2;
    const centerY = canvasSize.height / 2;
    let settled = false;

    const step = () => {
      if (!run) return;
      const ns = nodesRef.current;
      const es = edgesRef.current;
      if (ns.length === 0) {
        animationRef.current = requestAnimationFrame(step);
        return;
      }

      if (settled) {
        tick();
        animationRef.current = requestAnimationFrame(step);
        return;
      }

      iterationRef.current++;
      const alpha = Math.max(0, 1 - iterationRef.current / PHYSICS.COOLING_FRAMES);
      if (alpha <= 0) {
        settled = true;
        tick();
        animationRef.current = requestAnimationFrame(step);
        return;
      }

      const N = ns.length;

      // 감쇠
      for (const node of ns) {
        node.vx *= PHYSICS.DAMPING;
        node.vy *= PHYSICS.DAMPING;
      }

      // 척력
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = ns[j].x - ns[i].x;
          const dy = ns[j].y - ns[i].y;
          const distSq = dx * dx + dy * dy;
          if (distSq > PHYSICS.REPULSION_CUTOFF_SQ) continue;
          const distance = Math.sqrt(distSq) || 1;
          const force = (PHYSICS.REPULSION_STRENGTH / (distance * distance)) * alpha;
          ns[i].vx -= (dx / distance) * force;
          ns[i].vy -= (dy / distance) * force;
          ns[j].vx += (dx / distance) * force;
          ns[j].vy += (dy / distance) * force;
        }
      }

      // 엣지 인력
      for (const edge of es) {
        const nodeA = ns[edge.s];
        const nodeB = ns[edge.t];
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (distance - PHYSICS.SPRING_REST_LENGTH) * PHYSICS.SPRING_STIFFNESS * Math.min(edge.w, 4) * alpha;
        nodeA.vx += (dx / distance) * force;
        nodeA.vy += (dy / distance) * force;
        nodeB.vx -= (dx / distance) * force;
        nodeB.vy -= (dy / distance) * force;
      }

      // 그룹 중심 인력
      const groupCentroids = {};
      for (const node of ns) {
        if (!node.group || node.group === "기타") continue;
        if (!groupCentroids[node.group]) groupCentroids[node.group] = { sx: 0, sy: 0, cnt: 0 };
        groupCentroids[node.group].sx += node.x;
        groupCentroids[node.group].sy += node.y;
        groupCentroids[node.group].cnt++;
      }
      for (const k in groupCentroids) {
        groupCentroids[k].cx = groupCentroids[k].sx / groupCentroids[k].cnt;
        groupCentroids[k].cy = groupCentroids[k].sy / groupCentroids[k].cnt;
      }

      for (const node of ns) {
        if (!node.group || node.group === "기타" || !groupCentroids[node.group]) continue;
        const centroid = groupCentroids[node.group];
        const dx = centroid.cx - node.x;
        const dy = centroid.cy - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        if (distance > 15) {
          const force = PHYSICS.GROUP_ATTRACTION * alpha * distance;
          node.vx += (dx / distance) * force;
          node.vy += (dy / distance) * force;
        }
      }

      // 그룹 간 반발
      applyGroupRepulsion(groupCentroids, ns, alpha);

      // 중앙 중력
      for (const node of ns) {
        node.vx += (centerX - node.x) * PHYSICS.CENTER_GRAVITY * alpha;
        node.vy += (centerY - node.y) * PHYSICS.CENTER_GRAVITY * alpha;
      }

      // 속도 적용 + 에너지 체크
      let totalEnergy = 0;
      for (const node of ns) {
        if (dragRef.current.active && dragRef.current.kind === "node" && ns[dragRef.current.nodeIndex]?.id === node.id) {
          node.vx = 0;
          node.vy = 0;
          continue;
        }
        const sp = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
        if (sp > PHYSICS.MAX_SPEED) {
          node.vx = (node.vx / sp) * PHYSICS.MAX_SPEED;
          node.vy = (node.vy / sp) * PHYSICS.MAX_SPEED;
        }
        node.x += node.vx;
        node.y += node.vy;
        totalEnergy += node.vx * node.vx + node.vy * node.vy;
      }

      if (totalEnergy < 0.01 * N) settled = true;

      tick();
      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);
    return () => {
      run = false;
      cancelAnimationFrame(animationRef.current);
    };
  }, [canvasSize, nodesRef, edgesRef]);

  // --- 캔버스 렌더링 ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * dpr;
    canvas.height = canvasSize.height * dpr;
    canvas.style.width = canvasSize.width + "px";
    canvas.style.height = canvasSize.height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

    const ns = nodesRef.current;
    const es = edgesRef.current;
    const cam = cameraRef.current;
    if (ns.length === 0) return;

    const wcx = canvasSize.width / 2 - cam.x;
    const wcy = canvasSize.height / 2 - cam.y;
    ctx.save();
    ctx.translate(canvasSize.width / 2, canvasSize.height / 2);
    ctx.scale(cam.z, cam.z);
    ctx.translate(-wcx, -wcy);

    drawGroupBubbles(ctx, ns, cam);
    drawEdges(ctx, ns, es, cam, hoveredNodeId, selectedNodeId);
    drawNodes(ctx, ns, cam, hoveredNodeId, selectedNodeId, neighborIds);
    drawLabels(ctx, ns, cam, hoveredNodeId, selectedNodeId, neighborIds);

    ctx.restore();
  });

  return {
    camera: cameraRef.current,
    onDown,
    onMove,
    onUp,
    onWheel,
    resetView,
    zoomIn,
    zoomOut,
    isDragging: dragRef.current.active,
    resetIteration: () => { iterationRef.current = 0; },
  };
}
