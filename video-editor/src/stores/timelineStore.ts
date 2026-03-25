/**
 * 타임라인 뷰 상태 — 줌, 스크롤, 드래그 상태
 */
import { create } from "zustand";

interface TimelineState {
  /** 프레임당 픽셀 수 (줌 레벨) */
  pxPerFrame: number;
  /** 수평 스크롤 위치 (px) */
  scrollLeft: number;

  zoomIn: () => void;
  zoomOut: () => void;
  setZoom: (ppf: number) => void;
  setScrollLeft: (left: number) => void;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 20;

export const useTimelineStore = create<TimelineState>((set) => ({
  pxPerFrame: 3,
  scrollLeft: 0,

  zoomIn: () => set((s) => ({ pxPerFrame: Math.min(MAX_ZOOM, s.pxPerFrame * 1.3) })),
  zoomOut: () => set((s) => ({ pxPerFrame: Math.max(MIN_ZOOM, s.pxPerFrame / 1.3) })),
  setZoom: (ppf) => set({ pxPerFrame: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, ppf)) }),
  setScrollLeft: (left) => set({ scrollLeft: left }),
}));
