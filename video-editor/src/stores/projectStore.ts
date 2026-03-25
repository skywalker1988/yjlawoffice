/**
 * 프로젝트 상태 관리 — 시퀀스, 미디어, 트랙, 클립
 */
import { create } from "zustand";
import type { Project, Sequence, Track, Clip, MediaItem } from "@/types";

const DEFAULT_SEQUENCE: Sequence = {
  id: "seq-1",
  name: "Sequence 01",
  resolution: { width: 1920, height: 1080 },
  frameRate: 30,
  tracks: [
    { id: "v3", type: "video", name: "V3", clips: [], locked: false, muted: false, solo: false, visible: true, height: 48, color: "#6c63ff" },
    { id: "v2", type: "video", name: "V2", clips: [], locked: false, muted: false, solo: false, visible: true, height: 48, color: "#3b82f6" },
    { id: "v1", type: "video", name: "V1", clips: [], locked: false, muted: false, solo: false, visible: true, height: 48, color: "#22c55e" },
    { id: "a1", type: "audio", name: "A1", clips: [], locked: false, muted: false, solo: false, visible: true, height: 40, color: "#22c55e" },
    { id: "a2", type: "audio", name: "A2", clips: [], locked: false, muted: false, solo: false, visible: true, height: 40, color: "#3b82f6" },
    { id: "a3", type: "audio", name: "A3", clips: [], locked: false, muted: false, solo: false, visible: true, height: 40, color: "#6c63ff" },
  ],
  markers: [],
  duration: 0,
};

interface ProjectState {
  project: Project;
  activeSequenceId: string;
  selectedClipIds: string[];

  getActiveSequence: () => Sequence | undefined;
  addMediaItem: (item: MediaItem) => void;
  removeMediaItem: (id: string) => void;
  addClipToTrack: (trackId: string, clip: Clip) => void;
  removeClip: (clipId: string) => void;
  updateClip: (clipId: string, updates: Partial<Clip>) => void;
  selectClip: (clipId: string, multi?: boolean) => void;
  clearSelection: () => void;
  addTrack: (type: "video" | "audio") => void;
  toggleTrackLock: (trackId: string) => void;
  toggleTrackMute: (trackId: string) => void;
  toggleTrackVisibility: (trackId: string) => void;
}

let trackCounter = 7;

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: {
    id: "proj-1",
    name: "Untitled Project",
    sequences: [DEFAULT_SEQUENCE],
    mediaBin: [],
    settings: {
      defaultSequenceWidth: 1920,
      defaultSequenceHeight: 1080,
      defaultFrameRate: 30,
      autoSaveInterval: 30,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  activeSequenceId: "seq-1",
  selectedClipIds: [],

  getActiveSequence: () => {
    const { project, activeSequenceId } = get();
    return project.sequences.find((s) => s.id === activeSequenceId);
  },

  addMediaItem: (item) =>
    set((s) => ({
      project: { ...s.project, mediaBin: [...s.project.mediaBin, item] },
    })),

  removeMediaItem: (id) =>
    set((s) => ({
      project: {
        ...s.project,
        mediaBin: s.project.mediaBin.filter((m) => m.id !== id),
      },
    })),

  addClipToTrack: (trackId, clip) =>
    set((s) => {
      const sequences = s.project.sequences.map((seq) => {
        if (seq.id !== s.activeSequenceId) return seq;
        const tracks = seq.tracks.map((t) => {
          if (t.id !== trackId) return t;
          return { ...t, clips: [...t.clips, { ...clip, trackId }] };
        });
        const allClips = tracks.flatMap((t) => t.clips);
        const duration = allClips.length > 0 ? Math.max(...allClips.map((c) => c.endFrame)) : 0;
        return { ...seq, tracks, duration };
      });
      return { project: { ...s.project, sequences } };
    }),

  removeClip: (clipId) =>
    set((s) => {
      const sequences = s.project.sequences.map((seq) => {
        if (seq.id !== s.activeSequenceId) return seq;
        const tracks = seq.tracks.map((t) => ({
          ...t,
          clips: t.clips.filter((c) => c.id !== clipId),
        }));
        return { ...seq, tracks };
      });
      return {
        project: { ...s.project, sequences },
        selectedClipIds: s.selectedClipIds.filter((id) => id !== clipId),
      };
    }),

  updateClip: (clipId, updates) =>
    set((s) => {
      const sequences = s.project.sequences.map((seq) => {
        if (seq.id !== s.activeSequenceId) return seq;
        const tracks = seq.tracks.map((t) => ({
          ...t,
          clips: t.clips.map((c) => (c.id === clipId ? { ...c, ...updates } : c)),
        }));
        return { ...seq, tracks };
      });
      return { project: { ...s.project, sequences } };
    }),

  selectClip: (clipId, multi) =>
    set((s) => ({
      selectedClipIds: multi
        ? s.selectedClipIds.includes(clipId)
          ? s.selectedClipIds.filter((id) => id !== clipId)
          : [...s.selectedClipIds, clipId]
        : [clipId],
    })),

  clearSelection: () => set({ selectedClipIds: [] }),

  addTrack: (type) =>
    set((s) => {
      const id = `${type === "video" ? "v" : "a"}${trackCounter++}`;
      const name = `${type === "video" ? "V" : "A"}${trackCounter - 1}`;
      const newTrack: Track = {
        id, type, name, clips: [], locked: false, muted: false,
        solo: false, visible: true, height: type === "video" ? 48 : 40,
        color: "#6c63ff",
      };
      const sequences = s.project.sequences.map((seq) => {
        if (seq.id !== s.activeSequenceId) return seq;
        const videoTracks = seq.tracks.filter((t) => t.type === "video");
        const audioTracks = seq.tracks.filter((t) => t.type === "audio");
        const tracks = type === "video"
          ? [newTrack, ...videoTracks, ...audioTracks]
          : [...videoTracks, ...audioTracks, newTrack];
        return { ...seq, tracks };
      });
      return { project: { ...s.project, sequences } };
    }),

  toggleTrackLock: (trackId) =>
    set((s) => {
      const sequences = s.project.sequences.map((seq) => ({
        ...seq,
        tracks: seq.tracks.map((t) => (t.id === trackId ? { ...t, locked: !t.locked } : t)),
      }));
      return { project: { ...s.project, sequences } };
    }),

  toggleTrackMute: (trackId) =>
    set((s) => {
      const sequences = s.project.sequences.map((seq) => ({
        ...seq,
        tracks: seq.tracks.map((t) => (t.id === trackId ? { ...t, muted: !t.muted } : t)),
      }));
      return { project: { ...s.project, sequences } };
    }),

  toggleTrackVisibility: (trackId) =>
    set((s) => {
      const sequences = s.project.sequences.map((seq) => ({
        ...seq,
        tracks: seq.tracks.map((t) => (t.id === trackId ? { ...t, visible: !t.visible } : t)),
      }));
      return { project: { ...s.project, sequences } };
    }),
}));
