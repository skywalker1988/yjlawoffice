/**
 * ProgramMonitor — 프로그램 모니터
 * Canvas 기반 실시간 프리뷰 + 전송 컨트롤 + JKL 셔틀
 */
"use client";

import { useRef, useEffect, useCallback } from "react";
import { usePlaybackStore } from "@/stores/playbackStore";
import { useProjectStore } from "@/stores/projectStore";
import { Compositor } from "@/engine/compositor";
import { framesToTimecode } from "@/utils/timeCode";

export default function ProgramMonitor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const compositorRef = useRef<Compositor | null>(null);
  const rafRef = useRef<number>(0);
  const lastFrameTimeRef = useRef<number>(0);

  const {
    currentFrame, playing, looping, previewQuality,
    setCurrentFrame, togglePlay, pause, stepFrame,
    setInPoint, setOutPoint, inPoint, outPoint,
  } = usePlaybackStore();

  const getActiveSequence = useProjectStore((s) => s.getActiveSequence);
  const mediaBin = useProjectStore((s) => s.project.mediaBin);

  const seq = getActiveSequence();
  const fps = seq?.frameRate ?? 30;

  /** 컴포지터 초기화 */
  useEffect(() => {
    if (!canvasRef.current) return;
    compositorRef.current = new Compositor(canvasRef.current);
    return () => compositorRef.current?.destroy();
  }, []);

  /** 미디어 프리로드 */
  useEffect(() => {
    compositorRef.current?.preloadMedia(mediaBin);
  }, [mediaBin]);

  /** 프레임 렌더링 */
  const renderCurrentFrame = useCallback(() => {
    if (!compositorRef.current || !seq) return;
    compositorRef.current.renderFrame(seq, currentFrame, mediaBin);
  }, [seq, currentFrame, mediaBin]);

  useEffect(() => {
    renderCurrentFrame();
  }, [renderCurrentFrame]);

  /** 재생 루프 */
  useEffect(() => {
    if (!playing || !seq) return;
    lastFrameTimeRef.current = performance.now();

    const loop = (now: number) => {
      const elapsed = now - lastFrameTimeRef.current;
      const frameInterval = 1000 / fps;

      if (elapsed >= frameInterval) {
        lastFrameTimeRef.current = now - (elapsed % frameInterval);
        const nextFrame = currentFrame + 1;

        if (nextFrame >= (seq.duration || 1800)) {
          if (looping) setCurrentFrame(0);
          else pause();
        } else {
          setCurrentFrame(nextFrame);
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, currentFrame, fps, seq, looping, setCurrentFrame, pause]);

  /** 프리뷰 크기 계산 */
  const scale = previewQuality === "quarter" ? 0.25 : previewQuality === "half" ? 0.5 : 1;
  const displayWidth = (seq?.resolution.width ?? 1920) * scale;
  const displayHeight = (seq?.resolution.height ?? 1080) * scale;

  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column", background: "#0a0a0a",
    }}>
      {/* Canvas 프리뷰 */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
      }}>
        <canvas
          ref={canvasRef}
          style={{
            maxWidth: "100%", maxHeight: "100%",
            width: displayWidth, height: displayHeight,
            imageRendering: "auto",
          }}
        />
      </div>

      {/* 전송 컨트롤 */}
      <div style={{
        height: 40, background: "var(--bg-tertiary)",
        borderTop: "1px solid var(--border-primary)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        flexShrink: 0,
      }}>
        {/* In 포인트 */}
        <button className="tool-btn" style={{ fontSize: 9, width: 22, height: 22 }}
          title="Set In Point (I)" onClick={() => setInPoint(currentFrame)}>
          [
        </button>
        {/* 구간 시작 */}
        <button className="tool-btn" style={{ fontSize: 10, width: 22, height: 22 }}
          title="Go to In" onClick={() => inPoint !== null && setCurrentFrame(inPoint)}>
          ⏮
        </button>
        {/* 프레임 뒤로 */}
        <button className="tool-btn" style={{ fontSize: 10, width: 22, height: 22 }}
          onClick={() => stepFrame(-1)}>
          ◀◀
        </button>
        {/* 재생/일시정지 */}
        <button
          className="tool-btn"
          style={{
            width: 34, height: 34, fontSize: 16,
            background: "var(--accent)", borderRadius: "50%", color: "white",
          }}
          onClick={togglePlay}
        >
          {playing ? "⏸" : "▶"}
        </button>
        {/* 프레임 앞으로 */}
        <button className="tool-btn" style={{ fontSize: 10, width: 22, height: 22 }}
          onClick={() => stepFrame(1)}>
          ▶▶
        </button>
        {/* 구간 끝 */}
        <button className="tool-btn" style={{ fontSize: 10, width: 22, height: 22 }}
          title="Go to Out" onClick={() => outPoint !== null && setCurrentFrame(outPoint)}>
          ⏭
        </button>
        {/* Out 포인트 */}
        <button className="tool-btn" style={{ fontSize: 9, width: 22, height: 22 }}
          title="Set Out Point (O)" onClick={() => setOutPoint(currentFrame)}>
          ]
        </button>

        <div style={{ width: 1, height: 20, background: "var(--border-primary)", margin: "0 8px" }} />

        {/* 타임코드 */}
        <span className="timecode" style={{ fontSize: 13, minWidth: 100 }}>
          {framesToTimecode(currentFrame, fps)}
        </span>
      </div>
    </div>
  );
}
