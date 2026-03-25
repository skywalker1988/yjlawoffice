/**
 * TimelineClip — 타임라인 내 개별 클립 렌더링
 * 드래그 이동, 트리밍 핸들, 선택 상태
 */
"use client";

import { useState, useRef, useCallback } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { useTimelineStore } from "@/stores/timelineStore";
import type { Clip, Track } from "@/types";

interface TimelineClipProps {
  clip: Clip;
  track: Track;
}

export default function TimelineClip({ clip, track }: TimelineClipProps) {
  const pxPerFrame = useTimelineStore((s) => s.pxPerFrame);
  const { selectedClipIds, selectClip, updateClip } = useProjectStore();
  const isSelected = selectedClipIds.includes(clip.id);
  const [trimSide, setTrimSide] = useState<"left" | "right" | null>(null);

  const clipWidth = (clip.endFrame - clip.startFrame) * pxPerFrame;
  const clipLeft = clip.startFrame * pxPerFrame;
  const isVideo = track.type === "video";
  const baseColor = isVideo ? "var(--clip-video)" : "var(--clip-audio)";
  const selectedColor = "var(--clip-selected)";

  const dragStartRef = useRef<{ x: number; startFrame: number } | null>(null);

  /** 클립 드래그 이동 */
  const onMouseDownMove = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      selectClip(clip.id, e.shiftKey);
      dragStartRef.current = { x: e.clientX, startFrame: clip.startFrame };

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragStartRef.current) return;
        const dx = ev.clientX - dragStartRef.current.x;
        const dFrames = Math.round(dx / pxPerFrame);
        const newStart = Math.max(0, dragStartRef.current.startFrame + dFrames);
        const duration = clip.endFrame - clip.startFrame;
        updateClip(clip.id, { startFrame: newStart, endFrame: newStart + duration });
      };
      const onMouseUp = () => {
        dragStartRef.current = null;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [clip, pxPerFrame, selectClip, updateClip]
  );

  /** 트림 핸들 드래그 */
  const onTrimStart = useCallback(
    (side: "left" | "right", e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setTrimSide(side);
      const startX = e.clientX;
      const origStart = clip.startFrame;
      const origEnd = clip.endFrame;
      const origSrcIn = clip.sourceInFrame;
      const origSrcOut = clip.sourceOutFrame;

      const onMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dFrames = Math.round(dx / pxPerFrame);
        if (side === "left") {
          const newStart = Math.max(0, origStart + dFrames);
          if (newStart < origEnd - 1) {
            updateClip(clip.id, {
              startFrame: newStart,
              sourceInFrame: origSrcIn + (newStart - origStart),
            });
          }
        } else {
          const newEnd = Math.max(origStart + 1, origEnd + dFrames);
          updateClip(clip.id, {
            endFrame: newEnd,
            sourceOutFrame: origSrcOut + (newEnd - origEnd),
          });
        }
      };
      const onMouseUp = () => {
        setTrimSide(null);
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [clip, pxPerFrame, updateClip]
  );

  const mediaItem = useProjectStore((s) =>
    s.project.mediaBin.find((m) => m.id === clip.mediaId)
  );

  return (
    <div
      style={{
        position: "absolute",
        left: clipLeft,
        top: 2,
        width: clipWidth,
        height: "calc(100% - 4px)",
        background: isSelected ? selectedColor : baseColor,
        border: `1px solid ${isSelected ? "#ffffff40" : "rgba(0,0,0,0.3)"}`,
        borderRadius: 2,
        cursor: "move",
        overflow: "hidden",
        opacity: clip.disabled ? 0.4 : 1,
        transition: "opacity 0.15s",
        minWidth: 4,
      }}
      onMouseDown={onMouseDownMove}
    >
      {/* 좌측 트림 핸들 */}
      <div
        style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 6,
          cursor: "ew-resize", zIndex: 2,
          background: trimSide === "left" ? "rgba(255,255,255,0.3)" : "transparent",
        }}
        onMouseDown={(e) => onTrimStart("left", e)}
      />

      {/* 클립 라벨 */}
      <div style={{
        padding: "2px 8px",
        fontSize: 9,
        fontWeight: 500,
        color: "rgba(255,255,255,0.85)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        pointerEvents: "none",
      }}>
        {mediaItem?.name ?? "Clip"}
      </div>

      {/* 우측 트림 핸들 */}
      <div
        style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: 6,
          cursor: "ew-resize", zIndex: 2,
          background: trimSide === "right" ? "rgba(255,255,255,0.3)" : "transparent",
        }}
        onMouseDown={(e) => onTrimStart("right", e)}
      />
    </div>
  );
}
