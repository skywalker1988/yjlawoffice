/**
 * 재생 상태 관리 — 현재 시간, 재생 여부, In/Out 포인트
 */
import { create } from "zustand";

interface PlaybackState {
  currentFrame: number;
  playing: boolean;
  looping: boolean;
  inPoint: number | null;
  outPoint: number | null;
  previewQuality: "quarter" | "half" | "full";
  shuttleSpeed: number;

  setCurrentFrame: (frame: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  stop: () => void;
  setInPoint: (frame: number | null) => void;
  setOutPoint: (frame: number | null) => void;
  setPreviewQuality: (q: "quarter" | "half" | "full") => void;
  toggleLoop: () => void;
  setShuttleSpeed: (speed: number) => void;
  stepFrame: (delta: number) => void;
}

export const usePlaybackStore = create<PlaybackState>((set, get) => ({
  currentFrame: 0,
  playing: false,
  looping: false,
  inPoint: null,
  outPoint: null,
  previewQuality: "full",
  shuttleSpeed: 1,

  setCurrentFrame: (frame) => set({ currentFrame: Math.max(0, frame) }),
  play: () => set({ playing: true }),
  pause: () => set({ playing: false }),
  togglePlay: () => set((s) => ({ playing: !s.playing })),
  stop: () => set({ playing: false, currentFrame: 0 }),
  setInPoint: (frame) => set({ inPoint: frame }),
  setOutPoint: (frame) => set({ outPoint: frame }),
  setPreviewQuality: (q) => set({ previewQuality: q }),
  toggleLoop: () => set((s) => ({ looping: !s.looping })),
  setShuttleSpeed: (speed) => set({ shuttleSpeed: speed }),
  stepFrame: (delta) => set((s) => ({ currentFrame: Math.max(0, s.currentFrame + delta) })),
}));
