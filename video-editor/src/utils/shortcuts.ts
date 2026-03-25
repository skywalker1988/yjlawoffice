/**
 * 단축키 매니저 — Premiere Pro 호환 키보드 단축키
 */
import { useEffect } from "react";
import { useUIStore } from "@/stores/uiStore";
import { usePlaybackStore } from "@/stores/playbackStore";
import { useProjectStore } from "@/stores/projectStore";
import { useTimelineStore } from "@/stores/timelineStore";
import { useHistoryStore } from "@/stores/historyStore";
import { autoSave } from "@/utils/serialization";
import type { Tool } from "@/types";

const TOOL_SHORTCUTS: Record<string, Tool> = {
  v: "selection",
  a: "track-select",
  b: "ripple",
  n: "rolling",
  c: "razor",
  y: "slip",
  u: "slide",
  h: "hand",
  z: "zoom",
  t: "type",
};

export function useKeyboardShortcuts() {
  const setActiveTool = useUIStore((s) => s.setActiveTool);
  const toggleSnap = useUIStore((s) => s.toggleSnap);
  const { togglePlay, stepFrame, setCurrentFrame, setInPoint, setOutPoint, currentFrame } = usePlaybackStore();
  const { selectedClipIds, removeClip, getActiveSequence } = useProjectStore();
  const { zoomIn, zoomOut } = useTimelineStore();
  const { undo, redo } = useHistoryStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // 입력 필드에서는 단축키 무시
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // 도구 전환
      if (!ctrl && !shift && TOOL_SHORTCUTS[key]) {
        e.preventDefault();
        setActiveTool(TOOL_SHORTCUTS[key]);
        return;
      }

      switch (key) {
        case " ": // Space: 재생/정지
          e.preventDefault();
          togglePlay();
          break;
        case "arrowleft":
          e.preventDefault();
          stepFrame(shift ? -5 : -1);
          break;
        case "arrowright":
          e.preventDefault();
          stepFrame(shift ? 5 : 1);
          break;
        case "home":
          e.preventDefault();
          setCurrentFrame(0);
          break;
        case "end": {
          e.preventDefault();
          const seq = getActiveSequence();
          if (seq) setCurrentFrame(seq.duration);
          break;
        }
        case "i": // In 포인트
          if (!ctrl) { e.preventDefault(); setInPoint(currentFrame); }
          break;
        case "o": // Out 포인트
          if (!ctrl) { e.preventDefault(); setOutPoint(currentFrame); }
          break;
        case "s": // Snap 토글 또는 Ctrl+S 저장
          if (!ctrl) { e.preventDefault(); toggleSnap(); }
          break;
        case "delete":
        case "backspace":
          if (selectedClipIds.length > 0) {
            e.preventDefault();
            selectedClipIds.forEach((id) => removeClip(id));
          }
          break;
        case "=":
        case "+":
          e.preventDefault();
          zoomIn();
          break;
        case "-":
          if (!ctrl) { e.preventDefault(); zoomOut(); }
          break;
        case "z": // Ctrl+Z: Undo, Ctrl+Shift+Z: Redo
          if (ctrl) {
            e.preventDefault();
            if (shift) redo();
            else undo();
          }
          break;
        case "s": // Ctrl+S: 저장
          if (ctrl) {
            e.preventDefault();
            autoSave(useProjectStore.getState().project);
          } else if (!ctrl) {
            e.preventDefault();
            toggleSnap();
          }
          break;
        case "k": // Ctrl+K: 재생헤드에서 클립 자르기
          if (ctrl) {
            e.preventDefault();
            razorAtPlayhead();
          }
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    setActiveTool, togglePlay, stepFrame, setCurrentFrame,
    setInPoint, setOutPoint, currentFrame, selectedClipIds,
    removeClip, getActiveSequence, toggleSnap, zoomIn, zoomOut,
  ]);
}

/** 재생헤드 위치에서 모든 클립 자르기 (Ctrl+K / Razor) */
function razorAtPlayhead() {
  const frame = usePlaybackStore.getState().currentFrame;
  const seq = useProjectStore.getState().getActiveSequence();
  if (!seq) return;

  for (const track of seq.tracks) {
    for (const clip of track.clips) {
      if (frame > clip.startFrame && frame < clip.endFrame) {
        const clipDuration = clip.endFrame - clip.startFrame;
        const splitOffset = frame - clip.startFrame;

        // 기존 클립을 앞부분으로 줄이기
        useProjectStore.getState().updateClip(clip.id, {
          endFrame: frame,
          sourceOutFrame: clip.sourceInFrame + splitOffset,
        });

        // 뒷부분 새 클립 생성
        const newClip = {
          ...clip,
          id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          startFrame: frame,
          endFrame: clip.startFrame + clipDuration,
          sourceInFrame: clip.sourceInFrame + splitOffset,
        };
        useProjectStore.getState().addClipToTrack(track.id, newClip);
      }
    }
  }
}

export { razorAtPlayhead };
