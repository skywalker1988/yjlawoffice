/**
 * 소스 모니터 상태 — 선택된 미디어 프리뷰, In/Out 포인트
 */
import { create } from "zustand";

interface SourceMonitorState {
  mediaId: string | null;
  mediaUrl: string | null;
  mediaType: "video" | "audio" | "image" | null;
  mediaName: string | null;
  inPoint: number | null;
  outPoint: number | null;
  playing: boolean;
  currentTime: number;
  duration: number;

  openMedia: (id: string, url: string, type: "video" | "audio" | "image", name: string) => void;
  closeMedia: () => void;
  setInPoint: (t: number | null) => void;
  setOutPoint: (t: number | null) => void;
  setPlaying: (p: boolean) => void;
  togglePlay: () => void;
  setCurrentTime: (t: number) => void;
  setDuration: (d: number) => void;
}

export const useSourceMonitorStore = create<SourceMonitorState>((set) => ({
  mediaId: null,
  mediaUrl: null,
  mediaType: null,
  mediaName: null,
  inPoint: null,
  outPoint: null,
  playing: false,
  currentTime: 0,
  duration: 0,

  openMedia: (id, url, type, name) =>
    set({ mediaId: id, mediaUrl: url, mediaType: type, mediaName: name, inPoint: null, outPoint: null, playing: false, currentTime: 0, duration: 0 }),
  closeMedia: () =>
    set({ mediaId: null, mediaUrl: null, mediaType: null, mediaName: null, inPoint: null, outPoint: null, playing: false, currentTime: 0, duration: 0 }),
  setInPoint: (t) => set({ inPoint: t }),
  setOutPoint: (t) => set({ outPoint: t }),
  setPlaying: (p) => set({ playing: p }),
  togglePlay: () => set((s) => ({ playing: !s.playing })),
  setCurrentTime: (t) => set({ currentTime: t }),
  setDuration: (d) => set({ duration: d }),
}));
