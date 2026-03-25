/**
 * UI 상태 관리 — 패널 레이아웃, 활성 도구, 선택 상태
 */
import { create } from "zustand";
import type { Tool, PanelId } from "@/types";

interface UIState {
  /* 도구 */
  activeTool: Tool;
  setActiveTool: (tool: Tool) => void;

  /* 패널 */
  activePanel: PanelId | null;
  setActivePanel: (panel: PanelId | null) => void;
  maximizedPanel: PanelId | null;
  toggleMaximize: (panel: PanelId) => void;

  /* 메뉴 */
  activeMenu: string | null;
  setActiveMenu: (menu: string | null) => void;

  /* 스냅 */
  snapEnabled: boolean;
  toggleSnap: () => void;

  /* 사이드바 */
  leftPanelTab: "media" | "effects";
  setLeftPanelTab: (tab: "media" | "effects") => void;
  bottomPanelTab: "inspector" | "keyframes" | "audio-mixer";
  setBottomPanelTab: (tab: "inspector" | "keyframes" | "audio-mixer") => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTool: "selection",
  setActiveTool: (tool) => set({ activeTool: tool }),

  activePanel: null,
  setActivePanel: (panel) => set({ activePanel: panel }),
  maximizedPanel: null,
  toggleMaximize: (panel) =>
    set((s) => ({ maximizedPanel: s.maximizedPanel === panel ? null : panel })),

  activeMenu: null,
  setActiveMenu: (menu) => set({ activeMenu: menu }),

  snapEnabled: true,
  toggleSnap: () => set((s) => ({ snapEnabled: !s.snapEnabled })),

  leftPanelTab: "media",
  setLeftPanelTab: (tab) => set({ leftPanelTab: tab }),
  bottomPanelTab: "inspector",
  setBottomPanelTab: (tab) => set({ bottomPanelTab: tab }),
}));
