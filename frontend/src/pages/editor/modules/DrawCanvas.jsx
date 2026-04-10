/**
 * 드로잉 캔버스 — SVG 오버레이 및 드로잉 상태 관리 훅
 * 에디터 위에 표시되는 SVG 캔버스에서 자유곡선을 그린다.
 */
import { useState, useCallback, useRef } from "react";

/* ── SVG 경로 생성 헬퍼 ── */

/**
 * 포인트 배열을 SVG path d 문자열로 변환
 * @param {Array<{x:number, y:number}>} points - 좌표 배열
 * @returns {string} SVG path d 속성 문자열
 */
function buildPathData(points) {
  if (points.length === 0) return "";
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y} L ${points[0].x} ${points[0].y}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
}

/* ================================================================
 *  드로잉 상태 관리 훅
 * ================================================================ */

/**
 * 드로잉 캔버스의 스트로크 상태를 관리하는 커스텀 훅
 * - 스트로크 배열, 실행취소/다시실행 스택 관리
 * - 현재 진행 중인 스트로크 추적
 */
export function useDrawingState() {
  const [strokes, setStrokes] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [currentStroke, setCurrentStroke] = useState(null);

  /** 새 스트로크 시작 */
  const startStroke = useCallback((strokeConfig) => {
    setCurrentStroke({ ...strokeConfig, points: [] });
  }, []);

  /** 현재 스트로크에 포인트 추가 */
  const addPoint = useCallback((point) => {
    setCurrentStroke((prev) => {
      if (!prev) return null;
      return { ...prev, points: [...prev.points, point] };
    });
  }, []);

  /** 현재 스트로크 완료 후 스트로크 목록에 추가 */
  const finishStroke = useCallback(() => {
    setCurrentStroke((prev) => {
      if (!prev || prev.points.length === 0) return null;
      setStrokes((s) => [...s, prev]);
      setRedoStack([]);
      return null;
    });
  }, []);

  /** 마지막 스트로크 실행취소 */
  const undo = useCallback(() => {
    setStrokes((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setRedoStack((r) => [...r, last]);
      return prev.slice(0, -1);
    });
  }, []);

  /** 실행취소한 스트로크 다시실행 */
  const redo = useCallback(() => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setStrokes((s) => [...s, last]);
      return prev.slice(0, -1);
    });
  }, []);

  /** 지우개: 특정 좌표 근처의 스트로크 제거 */
  const eraseAt = useCallback((x, y, radius = 10) => {
    setStrokes((prev) => {
      const remaining = prev.filter((stroke) => {
        return !stroke.points.some(
          (p) => Math.abs(p.x - x) < radius && Math.abs(p.y - y) < radius
        );
      });
      if (remaining.length < prev.length) {
        setRedoStack([]);
      }
      return remaining;
    });
  }, []);

  /** 모든 스트로크를 SVG 문자열로 직렬화 */
  const toSvgString = useCallback((width, height) => {
    const paths = strokes.map((s) => {
      const d = buildPathData(s.points);
      const opacity = s.opacity != null ? s.opacity : 1;
      return `<path d="${d}" stroke="${s.color}" stroke-width="${s.width}" fill="none" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"/>`;
    }).join("\n  ");
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">\n  ${paths}\n</svg>`;
  }, [strokes]);

  return {
    strokes,
    currentStroke,
    redoStack,
    startStroke,
    addPoint,
    finishStroke,
    undo,
    redo,
    eraseAt,
    toSvgString,
    canUndo: strokes.length > 0,
    canRedo: redoStack.length > 0,
  };
}

/* ================================================================
 *  SVG 드로잉 오버레이
 * ================================================================ */

/**
 * 에디터 위에 표시되는 SVG 드로잉 캔버스
 * 마우스/터치 이벤트를 캡처하여 자유곡선을 그림
 */
export function DrawingOverlay({
  activeTool,
  penColor,
  penWidth,
  highlighterOpacity,
  drawingState,
}) {
  const svgRef = useRef(null);
  const isDrawingRef = useRef(false);

  /** SVG 요소 기준 좌표 계산 */
  const getPoint = useCallback((e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }, []);

  /** 그리기 도구의 스트로크 설정값 반환 */
  const getStrokeConfig = useCallback(() => {
    const isHighlighter = activeTool?.startsWith("highlight");
    return {
      color: penColor,
      width: penWidth,
      opacity: isHighlighter ? highlighterOpacity : 1,
      tool: activeTool,
    };
  }, [activeTool, penColor, penWidth, highlighterOpacity]);

  /** 포인터 다운: 스트로크 시작 또는 지우개 처리 */
  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    if (!activeTool) return;

    if (activeTool === "eraser") {
      const pt = getPoint(e);
      drawingState.eraseAt(pt.x, pt.y);
      isDrawingRef.current = true;
      return;
    }

    if (activeTool === "lasso") return;

    isDrawingRef.current = true;
    const pt = getPoint(e);
    drawingState.startStroke(getStrokeConfig());
    drawingState.addPoint(pt);
  }, [activeTool, getPoint, getStrokeConfig, drawingState]);

  /** 포인터 이동: 포인트 추가 또는 지우개 이동 */
  const handlePointerMove = useCallback((e) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const pt = getPoint(e);

    if (activeTool === "eraser") {
      drawingState.eraseAt(pt.x, pt.y);
      return;
    }

    drawingState.addPoint(pt);
  }, [activeTool, getPoint, drawingState]);

  /** 포인터 업: 스트로크 완료 */
  const handlePointerUp = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (activeTool !== "eraser") {
      drawingState.finishStroke();
    }
  }, [activeTool, drawingState]);

  /** 지우개 커서 스타일 결정 */
  const getCursorStyle = () => {
    if (activeTool === "eraser") return "cell";
    if (activeTool === "lasso") return "crosshair";
    if (activeTool) return "crosshair";
    return "default";
  };

  return (
    <svg
      ref={svgRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 50,
        cursor: getCursorStyle(),
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* 완료된 스트로크 렌더링 */}
      {drawingState.strokes.map((stroke, i) => (
        <path
          key={`stroke-${i}`}
          d={buildPathData(stroke.points)}
          stroke={stroke.color}
          strokeWidth={stroke.width}
          fill="none"
          opacity={stroke.opacity != null ? stroke.opacity : 1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}

      {/* 현재 진행 중인 스트로크 렌더링 */}
      {drawingState.currentStroke && drawingState.currentStroke.points.length > 0 && (
        <path
          d={buildPathData(drawingState.currentStroke.points)}
          stroke={drawingState.currentStroke.color}
          strokeWidth={drawingState.currentStroke.width}
          fill="none"
          opacity={drawingState.currentStroke.opacity != null ? drawingState.currentStroke.opacity : 1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
