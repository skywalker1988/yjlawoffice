/** 서명 캔버스 커스텀 훅 — 속도 기반 필압 + 베지어 곡선으로 부드러운 필기 구현 */
import { useRef, useState, useCallback } from "react";

/** 서명 캔버스 크기 (고해상도 렌더링용) */
const CANVAS_WIDTH = 680;
const CANVAS_HEIGHT = 240;

/** 필압 설정 — 속도에 따른 선 굵기 범위 */
const MIN_LINE_WIDTH = 1.2;
const MAX_LINE_WIDTH = 4.5;
const VELOCITY_FACTOR = 3;
const SMOOTHING_FACTOR = 0.6;

const STROKE_COLOR = "#1a1a1a";

/**
 * 서명 패드 로직을 캡슐화하는 커스텀 훅
 * @returns {{ canvasRef, signatureData, canvasProps, handlers }} 서명 캔버스에 필요한 ref, 데이터, props
 */
export default function useSignaturePad() {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const pointsRef = useRef([]);
  const lastVelocityRef = useRef(0);
  const [signatureData, setSignatureData] = useState(null);

  /** 마우스/터치 좌표를 캔버스 좌표로 변환 */
  const getPosition = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
      t: Date.now(),
    };
  }, []);

  /** 획 시작 */
  const handleStart = useCallback((e) => {
    e.preventDefault();
    drawingRef.current = true;
    const pos = getPosition(e);
    pointsRef.current = [pos];
    lastVelocityRef.current = 0;
  }, [getPosition]);

  /** 획 진행 — 속도 기반 필압 + 베지어 곡선 */
  const handleMove = useCallback((e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPosition(e);
    const points = pointsRef.current;
    points.push(pos);

    if (points.length < 3) return;
    const prev = points[points.length - 3];
    const mid = points[points.length - 2];
    const cur = pos;

    /* 속도 계산 → 필압 변환 (빠르면 가늘고, 느리면 굵게) */
    const dx = cur.x - prev.x;
    const dy = cur.y - prev.y;
    const dt = Math.max(cur.t - prev.t, 1);
    const velocity = Math.sqrt(dx * dx + dy * dy) / dt;
    const smoothedVelocity = lastVelocityRef.current * SMOOTHING_FACTOR + velocity * (1 - SMOOTHING_FACTOR);
    lastVelocityRef.current = smoothedVelocity;
    const lineWidth = Math.max(MIN_LINE_WIDTH, Math.min(MAX_LINE_WIDTH, MAX_LINE_WIDTH - smoothedVelocity * VELOCITY_FACTOR));

    /* 베지어 곡선으로 부드러운 획 */
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.quadraticCurveTo(mid.x, mid.y, (mid.x + cur.x) / 2, (mid.y + cur.y) / 2);
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }, [getPosition]);

  /** 획 종료 */
  const handleEnd = useCallback(() => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    pointsRef.current = [];
  }, []);

  /** 캔버스 초기화 */
  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  }, []);

  /** 서명 확인 — 빈 캔버스가 아닌 경우에만 데이터 저장 */
  const confirm = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    /* 알파 채널에 값이 있는 픽셀이 있으면 서명이 있는 것 */
    const hasContent = pixels.some((v, i) => i % 4 === 3 && v > 0);
    if (!hasContent) return;
    setSignatureData(canvas.toDataURL("image/png"));
  }, []);

  /** 캔버스 element에 바인딩할 props */
  const canvasProps = {
    ref: canvasRef,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    style: { width: "100%", height: 140, touchAction: "none", cursor: "crosshair", background: "#fff" },
    onMouseDown: handleStart,
    onMouseMove: handleMove,
    onMouseUp: handleEnd,
    onMouseLeave: handleEnd,
    onTouchStart: handleStart,
    onTouchMove: handleMove,
    onTouchEnd: handleEnd,
  };

  return { canvasRef, signatureData, canvasProps, clear, confirm };
}
