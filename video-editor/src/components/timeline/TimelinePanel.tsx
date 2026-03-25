/**
 * TimelinePanel — 멀티트랙 타임라인
 * 클립 렌더링, 미디어 드롭, 줌, 플레이헤드, 트랙 컨트롤
 */
"use client";

import { useRef, useCallback } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { usePlaybackStore } from "@/stores/playbackStore";
import { useTimelineStore } from "@/stores/timelineStore";
import { useUIStore } from "@/stores/uiStore";
import { framesToShort, secondsToFrames } from "@/utils/timeCode";
import TimelineClip from "./TimelineClip";
import type { Clip } from "@/types";

export default function TimelinePanel() {
  const { getActiveSequence, toggleTrackLock, toggleTrackMute, toggleTrackVisibility, addClipToTrack, clearSelection } = useProjectStore();
  const project = useProjectStore((s) => s.project);
  const { currentFrame, setCurrentFrame } = usePlaybackStore();
  const { pxPerFrame, zoomIn, zoomOut } = useTimelineStore();
  const { snapEnabled } = useUIStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const seq = getActiveSequence();
  if (!seq) return null;

  const videoTracks = seq.tracks.filter((t) => t.type === "video");
  const audioTracks = seq.tracks.filter((t) => t.type === "audio");
  const totalDuration = Math.max(seq.duration + 300, 1800);
  const totalWidth = totalDuration * pxPerFrame;

  /** 눈금자 클릭 → 플레이헤드 이동 */
  const onRulerClick = useCallback(
    (e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const scrollLeft = scrollContainerRef.current?.scrollLeft ?? 0;
      const x = e.clientX - rect.left + scrollLeft;
      setCurrentFrame(Math.max(0, Math.round(x / pxPerFrame)));
    },
    [pxPerFrame, setCurrentFrame]
  );

  /** 빈 영역 클릭 → 선택 해제 */
  const onTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).dataset.trackBg === "true") {
        clearSelection();
        const rect = e.currentTarget.getBoundingClientRect();
        const scrollLeft = scrollContainerRef.current?.scrollLeft ?? 0;
        const x = e.clientX - rect.left + scrollLeft;
        setCurrentFrame(Math.max(0, Math.round(x / pxPerFrame)));
      }
    },
    [pxPerFrame, clearSelection, setCurrentFrame]
  );

  /** 미디어 드롭 → 클립 생성 */
  const onDrop = useCallback(
    (e: React.DragEvent, trackId: string) => {
      e.preventDefault();
      const mediaId = e.dataTransfer.getData("application/x-media-id");
      if (!mediaId) return;
      const media = project.mediaBin.find((m) => m.id === mediaId);
      if (!media) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const scrollLeft = scrollContainerRef.current?.scrollLeft ?? 0;
      const x = e.clientX - rect.left + scrollLeft;
      const startFrame = Math.max(0, Math.round(x / pxPerFrame));
      const durationFrames = secondsToFrames(media.duration, seq.frameRate);

      const clip: Clip = {
        id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        mediaId,
        trackId,
        startFrame,
        endFrame: startFrame + durationFrames,
        sourceInFrame: 0,
        sourceOutFrame: durationFrames,
        speed: 1,
        reversed: false,
        disabled: false,
        effects: [],
        transitions: {},
        label: media.name,
      };
      addClipToTrack(trackId, clip);
    },
    [project.mediaBin, seq.frameRate, pxPerFrame, addClipToTrack]
  );

  /** 마우스 휠 줌 (Alt+Wheel) */
  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.altKey) {
        e.preventDefault();
        if (e.deltaY < 0) zoomIn();
        else zoomOut();
      }
    },
    [zoomIn, zoomOut]
  );

  /** 눈금 간격 계산 */
  const rulerStep = (() => {
    const minPx = 60;
    const candidates = [1, 5, 10, 15, 30, 60, 150, 300, 600, 900, 1800];
    for (const c of candidates) {
      if (c * pxPerFrame >= minPx) return c;
    }
    return 1800;
  })();

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--timeline-bg)" }} onWheel={onWheel}>
      {/* 헤더 */}
      <div style={{
        height: 28, display: "flex", alignItems: "center", padding: "0 8px",
        background: "var(--bg-tertiary)", borderBottom: "1px solid var(--border-primary)",
        gap: 8, flexShrink: 0,
      }}>
        <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>{seq.name}</span>
        <div style={{ flex: 1 }} />

        {/* 줌 컨트롤 */}
        <button className="tool-btn" onClick={zoomOut} style={{ width: 20, height: 20, fontSize: 10 }}>−</button>
        <input
          type="range" min={0.5} max={20} step={0.1} value={pxPerFrame}
          onChange={(e) => useTimelineStore.getState().setZoom(Number(e.target.value))}
          style={{ width: 80, accentColor: "var(--accent)" }}
        />
        <button className="tool-btn" onClick={zoomIn} style={{ width: 20, height: 20, fontSize: 10 }}>+</button>

        <span style={{ fontSize: 9, color: "var(--text-muted)", minWidth: 48 }}>
          {seq.resolution.width}×{seq.resolution.height}
        </span>
        <span style={{ fontSize: 9, color: snapEnabled ? "var(--accent)" : "var(--text-muted)" }}>
          {snapEnabled ? "🧲" : ""}
        </span>
      </div>

      {/* 타임라인 본체 */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* 트랙 헤더 */}
        <div style={{
          width: 140, flexShrink: 0,
          background: "var(--bg-secondary)", borderRight: "1px solid var(--border-primary)",
          overflowY: "hidden",
        }}>
          {videoTracks.map((track) => (
            <TrackHeader key={track.id} track={track}
              onToggleLock={() => toggleTrackLock(track.id)}
              onToggleVis={() => toggleTrackVisibility(track.id)}
              onToggleMute={() => toggleTrackMute(track.id)}
            />
          ))}
          <div style={{ height: 4, background: "var(--bg-primary)" }} />
          {audioTracks.map((track) => (
            <TrackHeader key={track.id} track={track}
              onToggleLock={() => toggleTrackLock(track.id)}
              onToggleVis={() => toggleTrackVisibility(track.id)}
              onToggleMute={() => toggleTrackMute(track.id)}
            />
          ))}
        </div>

        {/* 스크롤 가능한 트랙 영역 */}
        <div ref={scrollContainerRef} style={{ flex: 1, overflow: "auto", position: "relative" }}>
          {/* 눈금자 */}
          <div
            style={{
              height: 22, position: "sticky", top: 0, zIndex: 10,
              background: "var(--timeline-ruler)", borderBottom: "1px solid var(--border-primary)",
              minWidth: totalWidth, cursor: "pointer",
            }}
            onClick={onRulerClick}
          >
            {Array.from({ length: Math.ceil(totalDuration / rulerStep) + 1 }, (_, i) => {
              const frame = i * rulerStep;
              return (
                <div key={i} style={{
                  position: "absolute", left: frame * pxPerFrame,
                  fontSize: 9, color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                  top: 3,
                }}>
                  {framesToShort(frame, seq.frameRate)}
                </div>
              );
            })}
          </div>

          {/* 트랙 + 클립 */}
          <div style={{ minWidth: totalWidth, position: "relative" }} onClick={onTrackClick}>
            {videoTracks.map((track) => (
              <div
                key={track.id}
                data-track-bg="true"
                style={{
                  height: track.height,
                  background: "var(--timeline-track)",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  position: "relative",
                }}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
                onDrop={(e) => onDrop(e, track.id)}
              >
                {track.clips.map((clip) => (
                  <TimelineClip key={clip.id} clip={clip} track={track} />
                ))}
              </div>
            ))}

            <div style={{ height: 4, background: "var(--bg-primary)" }} />

            {audioTracks.map((track) => (
              <div
                key={track.id}
                data-track-bg="true"
                style={{
                  height: track.height,
                  background: "var(--timeline-track-alt)",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  position: "relative",
                }}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; }}
                onDrop={(e) => onDrop(e, track.id)}
              >
                {track.clips.map((clip) => (
                  <TimelineClip key={clip.id} clip={clip} track={track} />
                ))}
              </div>
            ))}

            {/* 플레이헤드 */}
            <div style={{
              position: "absolute", left: currentFrame * pxPerFrame,
              top: 0, bottom: 0, width: 2,
              background: "var(--playhead)", zIndex: 20,
              pointerEvents: "none",
              boxShadow: "0 0 6px var(--playhead)",
            }}>
              <div style={{
                position: "absolute", top: -22, left: -5,
                width: 0, height: 0,
                borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
                borderTop: "8px solid var(--playhead)",
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 트랙 헤더 컴포넌트 */
function TrackHeader({ track, onToggleLock, onToggleVis, onToggleMute }: {
  track: import("@/types").Track;
  onToggleLock: () => void;
  onToggleVis: () => void;
  onToggleMute: () => void;
}) {
  return (
    <div style={{
      height: track.height, display: "flex", alignItems: "center", padding: "0 6px",
      borderBottom: "1px solid var(--border-primary)", gap: 3,
    }}>
      <div style={{ width: 3, height: "60%", background: track.color, borderRadius: 1 }} />
      <span style={{ fontSize: 10, fontWeight: 500, color: "var(--text-secondary)", flex: 1 }}>{track.name}</span>
      {track.type === "video" ? (
        <button className="tool-btn" style={{ width: 16, height: 16, fontSize: 7 }}
          title={track.visible ? "Hide" : "Show"} onClick={onToggleVis}>
          {track.visible ? "👁" : "—"}
        </button>
      ) : (
        <button className="tool-btn" style={{ width: 16, height: 16, fontSize: 7 }}
          title={track.muted ? "Unmute" : "Mute"} onClick={onToggleMute}>
          {track.muted ? "🔇" : "🔊"}
        </button>
      )}
      <button className="tool-btn" style={{ width: 16, height: 16, fontSize: 7 }}
        title={track.locked ? "Unlock" : "Lock"} onClick={onToggleLock}>
        {track.locked ? "🔒" : "🔓"}
      </button>
    </div>
  );
}
