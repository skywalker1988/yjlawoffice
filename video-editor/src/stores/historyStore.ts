/**
 * Undo/Redo 히스토리 — 프로젝트 상태 스냅샷 기반
 */
import { create } from "zustand";
import type { Project } from "@/types";
import { useProjectStore } from "./projectStore";

interface HistoryState {
  undoStack: string[];
  redoStack: string[];
  maxHistory: number;

  pushState: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  undoStack: [],
  redoStack: [],
  maxHistory: 50,

  pushState: () => {
    const project = useProjectStore.getState().project;
    const snapshot = JSON.stringify(project);
    set((s) => ({
      undoStack: [...s.undoStack.slice(-(s.maxHistory - 1)), snapshot],
      redoStack: [],
    }));
  },

  undo: () => {
    const { undoStack } = get();
    if (undoStack.length === 0) return;

    const currentSnapshot = JSON.stringify(useProjectStore.getState().project);
    const prevSnapshot = undoStack[undoStack.length - 1];
    const prevProject = JSON.parse(prevSnapshot) as Project;

    useProjectStore.setState({ project: prevProject });

    set((s) => ({
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [...s.redoStack, currentSnapshot],
    }));
  },

  redo: () => {
    const { redoStack } = get();
    if (redoStack.length === 0) return;

    const currentSnapshot = JSON.stringify(useProjectStore.getState().project);
    const nextSnapshot = redoStack[redoStack.length - 1];
    const nextProject = JSON.parse(nextSnapshot) as Project;

    useProjectStore.setState({ project: nextProject });

    set((s) => ({
      redoStack: s.redoStack.slice(0, -1),
      undoStack: [...s.undoStack, currentSnapshot],
    }));
  },

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,
}));
