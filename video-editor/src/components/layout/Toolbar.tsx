/**
 * Toolbar — Premiere Pro 스타일 편집 도구 모음
 */
"use client";

import { useUIStore } from "@/stores/uiStore";
import type { Tool } from "@/types";

const TOOLS: { id: Tool; label: string; icon: string; shortcut: string }[] = [
  { id: "selection", label: "Selection Tool", icon: "⬚", shortcut: "V" },
  { id: "track-select", label: "Track Select", icon: "⇥", shortcut: "A" },
  { id: "ripple", label: "Ripple Edit", icon: "⟺", shortcut: "B" },
  { id: "rolling", label: "Rolling Edit", icon: "⟷", shortcut: "N" },
  { id: "razor", label: "Razor Tool", icon: "✂", shortcut: "C" },
  { id: "slip", label: "Slip Tool", icon: "⊟", shortcut: "Y" },
  { id: "slide", label: "Slide Tool", icon: "⊞", shortcut: "U" },
  { id: "hand", label: "Hand Tool", icon: "✋", shortcut: "H" },
  { id: "zoom", label: "Zoom Tool", icon: "🔍", shortcut: "Z" },
  { id: "type", label: "Type Tool", icon: "T", shortcut: "T" },
];

export default function Toolbar() {
  const { activeTool, setActiveTool, snapEnabled, toggleSnap } = useUIStore();

  return (
    <div style={{
      width: 34,
      background: "var(--bg-tertiary)",
      borderRight: "1px solid var(--border-primary)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "6px 0",
      gap: 2,
      flexShrink: 0,
    }}>
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          className={`tool-btn ${activeTool === tool.id ? "active" : ""}`}
          title={`${tool.label} (${tool.shortcut})`}
          onClick={() => setActiveTool(tool.id)}
          style={{ width: 26, height: 26, fontSize: 13 }}
        >
          {tool.icon}
        </button>
      ))}

      <div style={{ flex: 1 }} />

      {/* 스냅 토글 */}
      <button
        className={`tool-btn ${snapEnabled ? "active" : ""}`}
        title="Snap (S)"
        onClick={toggleSnap}
        style={{ width: 26, height: 26, fontSize: 11 }}
      >
        🧲
      </button>
    </div>
  );
}
