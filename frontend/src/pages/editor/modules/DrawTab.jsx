/**
 * 그리기 탭 - MS Word 365 스타일 드로잉 도구 모음
 * 펜, 형광펜, 지우개, 올가미 선택 등 잉크 입력 도구와
 * 잉크→텍스트/도형/수식 변환, 그리기 캔버스 삽입 기능 제공
 */
import { useState, useCallback, useRef, useEffect } from "react";
import {
  Pen, Pencil, Highlighter, Eraser, Lasso,
  Type, Shapes, Sigma, Frame,
  Undo2, Redo2, ChevronDown,
} from "lucide-react";
import {
  RibbonBtn, RibbonBtnLarge, GroupSep, RibbonGroup, DropdownButton, ColorGrid,
} from "./RibbonParts";

/* ── 상수 ── */
const ICON_SIZE = 12;
const ICON_SIZE_LARGE = 18;

/** 펜 도구 종류 정의 */
const PEN_TOOLS = [
  { id: "fine", label: "가는 펜", width: 1, icon: Pencil },
  { id: "medium", label: "중간 펜", width: 3, icon: Pen },
  { id: "thick", label: "굵은 펜", width: 6, icon: Pen },
];

/** 형광펜 도구 종류 정의 */
const HIGHLIGHTER_TOOLS = [
  { id: "highlight-thin", label: "가는 형광펜", width: 8, opacity: 0.4 },
  { id: "highlight-thick", label: "굵은 형광펜", width: 16, opacity: 0.4 },
];

/** 기본 펜 색상 팔레트 */
const PEN_COLORS = [
  "#000000", "#FF0000", "#0000FF", "#008000", "#FF8C00",
  "#800080", "#A52A2A", "#4169E1", "#2E8B57", "#DC143C",
];

/** 형광펜 기본 색상 팔레트 */
const HIGHLIGHTER_COLORS = [
  "#FFFF00", "#00FF00", "#00FFFF", "#FF69B4", "#FFA500",
  "#87CEEB", "#DDA0DD", "#98FB98", "#FFB6C1", "#FFDAB9",
];

/** 최대 보관할 최근 사용 색상 수 */
const MAX_RECENT_COLORS = 10;

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
function useDrawingState() {
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
 *  서브 컴포넌트
 * ================================================================ */

/** 도구 선택 버튼 - 현재 색상을 하단에 표시 */
function ToolButton({ icon: Icon, label, active, color, onClick, title }) {
  return (
    <RibbonBtn active={active} onClick={onClick} title={title || label} small>
      <span style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
        <Icon size={ICON_SIZE} />
        {/* 도구의 현재 색상 표시 바 */}
        {color && (
          <span style={{
            position: "absolute",
            bottom: -3,
            left: 0,
            right: 0,
            height: 2,
            background: color,
            borderRadius: 1,
          }} />
        )}
      </span>
      <span style={{ fontSize: 10 }}>{label}</span>
    </RibbonBtn>
  );
}

/** 두께 슬라이더 - 1~10px 범위 */
function ThicknessSlider({ value, onChange, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 9, color: "#888", minWidth: 28 }}>{label}</span>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: 60, height: 14, accentColor: "#0078D4" }}
        title={`${value}px`}
      />
      <span style={{ fontSize: 9, color: "#666", minWidth: 20 }}>{value}px</span>
    </div>
  );
}

/** 불투명도 슬라이더 - 형광펜용 (10~100%) */
function OpacitySlider({ value, onChange }) {
  const percent = Math.round(value * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <span style={{ fontSize: 9, color: "#888", minWidth: 28 }}>투명도</span>
      <input
        type="range"
        min={10}
        max={100}
        value={percent}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        style={{ width: 60, height: 14, accentColor: "#0078D4" }}
        title={`${percent}%`}
      />
      <span style={{ fontSize: 9, color: "#666", minWidth: 24 }}>{percent}%</span>
    </div>
  );
}

/* ================================================================
 *  SVG 드로잉 오버레이
 * ================================================================ */

/**
 * 에디터 위에 표시되는 SVG 드로잉 캔버스
 * 마우스/터치 이벤트를 캡처하여 자유곡선을 그림
 */
function DrawingOverlay({
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

/* ================================================================
 *  메인 그리기 탭 컴포넌트
 * ================================================================ */

/**
 * 그리기 탭 - 에디터 리본 메뉴의 드로잉 도구 그룹
 * @param {object} props.editor - TipTap 에디터 인스턴스
 * @param {function} props.onCanvasToggle - 드로잉 캔버스 토글 콜백 (boolean 전달)
 */
export function DrawTab({ editor, onCanvasToggle }) {
  /* ── 도구 상태 ── */
  const [activeTool, setActiveTool] = useState(null);
  const [penColor, setPenColor] = useState("#000000");
  const [penWidth, setPenWidth] = useState(3);
  const [highlighterOpacity, setHighlighterOpacity] = useState(0.4);
  const [recentColors, setRecentColors] = useState([]);
  const [canvasActive, setCanvasActive] = useState(false);

  /* ── 드로잉 상태 ── */
  const drawingState = useDrawingState();

  /** 색상 선택 시 최근 사용 색상 목록에 추가 */
  const handleColorChange = useCallback((color) => {
    setPenColor(color);
    setRecentColors((prev) => {
      const filtered = prev.filter((c) => c !== color);
      return [color, ...filtered].slice(0, MAX_RECENT_COLORS);
    });
  }, []);

  /** 도구 선택 처리 - 같은 도구 재클릭 시 해제 */
  const handleToolSelect = useCallback((toolId) => {
    setActiveTool((prev) => (prev === toolId ? null : toolId));
  }, []);

  /** 펜 도구 선택 시 해당 도구의 기본 두께 적용 */
  const handlePenSelect = useCallback((pen) => {
    handleToolSelect(pen.id);
    setPenWidth(pen.width);
  }, [handleToolSelect]);

  /** 형광펜 선택 시 기본 두께와 투명도 적용 */
  const handleHighlighterSelect = useCallback((hl) => {
    handleToolSelect(hl.id);
    setPenWidth(hl.width);
    setHighlighterOpacity(hl.opacity);
  }, [handleToolSelect]);

  /** 드로잉 캔버스 토글 */
  const toggleCanvas = useCallback(() => {
    const next = !canvasActive;
    setCanvasActive(next);
    if (!next) {
      setActiveTool(null);
    }
    onCanvasToggle?.(next);
  }, [canvasActive, onCanvasToggle]);

  /** 잉크를 텍스트로 변환 (알림만 표시 - 실제 OCR은 미구현) */
  const convertInkToText = useCallback(() => {
    if (drawingState.strokes.length === 0) {
      window.alert("변환할 잉크 데이터가 없습니다.");
      return;
    }
    window.alert("잉크→텍스트 변환 기능은 향후 업데이트에서 제공됩니다.");
  }, [drawingState.strokes]);

  /** 잉크를 도형으로 변환 (알림만 표시) */
  const convertInkToShape = useCallback(() => {
    if (drawingState.strokes.length === 0) {
      window.alert("변환할 잉크 데이터가 없습니다.");
      return;
    }
    window.alert("잉크→도형 변환 기능은 향후 업데이트에서 제공됩니다.");
  }, [drawingState.strokes]);

  /** 잉크를 수식으로 변환 (알림만 표시) */
  const convertInkToMath = useCallback(() => {
    if (drawingState.strokes.length === 0) {
      window.alert("변환할 잉크 데이터가 없습니다.");
      return;
    }
    window.alert("잉크→수식 변환 기능은 향후 업데이트에서 제공됩니다.");
  }, [drawingState.strokes]);

  /** 현재 활성 도구가 형광펜인지 여부 */
  const isHighlighterActive = activeTool?.startsWith("highlight");

  /** 현재 도구에 맞는 색상 팔레트 선택 */
  const activeColorPalette = isHighlighterActive ? HIGHLIGHTER_COLORS : PEN_COLORS;

  if (!editor) return null;

  return (
    <div style={{
      display: "flex", alignItems: "stretch", background: "var(--ribbon-bg, #fff)",
      borderBottom: "1px solid var(--ribbon-sep, #d1d5db)", flexShrink: 0, minHeight: 84, padding: "0 2px",
    }}>

      {/* ── 도구 그룹: 펜, 형광펜, 지우개, 올가미 ── */}
      <RibbonGroup label="도구">
        <div style={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
          {/* 펜 도구 목록 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {PEN_TOOLS.map((pen) => (
              <ToolButton
                key={pen.id}
                icon={pen.icon}
                label={pen.label}
                active={activeTool === pen.id}
                color={activeTool === pen.id ? penColor : null}
                onClick={() => handlePenSelect(pen)}
                title={`${pen.label} (${pen.width}px)`}
              />
            ))}
          </div>

          {/* 형광펜 + 지우개 + 올가미 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {HIGHLIGHTER_TOOLS.map((hl) => (
              <ToolButton
                key={hl.id}
                icon={Highlighter}
                label={hl.label}
                active={activeTool === hl.id}
                color={activeTool === hl.id ? penColor : null}
                onClick={() => handleHighlighterSelect(hl)}
                title={`${hl.label} (${hl.width}px)`}
              />
            ))}
            <ToolButton
              icon={Eraser}
              label="지우개"
              active={activeTool === "eraser"}
              onClick={() => handleToolSelect("eraser")}
              title="스트로크 지우기"
            />
          </div>

          {/* 올가미 선택 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <ToolButton
              icon={Lasso}
              label="올가미"
              active={activeTool === "lasso"}
              onClick={() => handleToolSelect("lasso")}
              title="올가미 선택"
            />
          </div>
        </div>
      </RibbonGroup>

      <GroupSep />

      {/* ── 펜 설정 그룹: 색상, 두께, 투명도 ── */}
      <RibbonGroup label="펜">
        <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
          {/* 색상 선택 드롭다운 */}
          <DropdownButton trigger={
            <RibbonBtn title="펜 색상 선택">
              <span style={{
                display: "inline-block", width: 14, height: 14,
                background: penColor, border: "1px solid #ccc", borderRadius: 2,
              }} />
              <span style={{ fontSize: 10 }}>색상</span>
              <ChevronDown size={8} />
            </RibbonBtn>
          }>
            <div style={{ padding: 4, minWidth: 200 }}>
              <ColorGrid
                colors={activeColorPalette}
                value={penColor}
                onChange={handleColorChange}
                columns={5}
                recentColors={recentColors}
                showMoreColors
                moreColorsLabel="다른 색..."
              />
            </div>
          </DropdownButton>

          {/* 두께/투명도 슬라이더 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <ThicknessSlider
              value={penWidth}
              onChange={setPenWidth}
              label="두께"
            />
            {/* 형광펜 활성 시에만 투명도 슬라이더 표시 */}
            {isHighlighterActive && (
              <OpacitySlider
                value={highlighterOpacity}
                onChange={setHighlighterOpacity}
              />
            )}
          </div>
        </div>

        {/* 최근 사용 색상 빠른 선택 */}
        {recentColors.length > 0 && (
          <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
            {recentColors.slice(0, 6).map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setPenColor(color)}
                title={color}
                style={{
                  width: 14, height: 14,
                  background: color,
                  border: penColor === color ? "2px solid #333" : "1px solid #ccc",
                  borderRadius: 2,
                  cursor: "pointer",
                  padding: 0,
                  outline: "none",
                }}
              />
            ))}
          </div>
        )}
      </RibbonGroup>

      <GroupSep />

      {/* ── 변환 그룹: 잉크→텍스트/도형/수식 ── */}
      <RibbonGroup label="변환">
        <div style={{ display: "flex", gap: 4 }}>
          <RibbonBtnLarge
            icon={<Type size={ICON_SIZE_LARGE} />}
            label="잉크→텍스트"
            onClick={convertInkToText}
            title="잉크를 텍스트로 변환"
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <RibbonBtn onClick={convertInkToShape} title="잉크를 도형으로 변환" small>
              <Shapes size={ICON_SIZE} />
              <span style={{ fontSize: 10 }}>잉크→도형</span>
            </RibbonBtn>
            <RibbonBtn onClick={convertInkToMath} title="잉크를 수식으로 변환" small>
              <Sigma size={ICON_SIZE} />
              <span style={{ fontSize: 10 }}>잉크→수식</span>
            </RibbonBtn>
          </div>
        </div>
      </RibbonGroup>

      <GroupSep />

      {/* ── 삽입 그룹: 그리기 캔버스 ── */}
      <RibbonGroup label="삽입">
        <RibbonBtnLarge
          icon={<Frame size={ICON_SIZE_LARGE} />}
          label="그리기 캔버스"
          onClick={toggleCanvas}
          active={canvasActive}
          title="에디터 위에 그리기 캔버스를 표시합니다"
        />
      </RibbonGroup>

      <GroupSep />

      {/* ── 실행취소/다시실행 ── */}
      <RibbonGroup label="실행취소">
        <div style={{ display: "flex", gap: 2 }}>
          <RibbonBtn
            onClick={drawingState.undo}
            disabled={!drawingState.canUndo}
            title="스트로크 실행취소"
            small
          >
            <Undo2 size={ICON_SIZE} />
          </RibbonBtn>
          <RibbonBtn
            onClick={drawingState.redo}
            disabled={!drawingState.canRedo}
            title="스트로크 다시실행"
            small
          >
            <Redo2 size={ICON_SIZE} />
          </RibbonBtn>
        </div>
      </RibbonGroup>
    </div>
  );
}

/* ── 드로잉 오버레이 내보내기 (에디터에서 조건부 렌더링용) ── */
export { DrawingOverlay, useDrawingState };
