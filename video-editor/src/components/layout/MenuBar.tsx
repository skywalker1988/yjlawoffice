/**
 * MenuBar — Premiere Pro 스타일 상단 메뉴바
 */
"use client";

import { useState, useRef, useEffect } from "react";

interface MenuItem {
  label: string;
  shortcut?: string;
  action?: () => void;
  divider?: boolean;
  disabled?: boolean;
  children?: MenuItem[];
}

const MENUS: { label: string; items: MenuItem[] }[] = [
  {
    label: "File",
    items: [
      { label: "New Project", shortcut: "Ctrl+N" },
      { label: "Open Project", shortcut: "Ctrl+O" },
      { divider: true, label: "" },
      { label: "Save", shortcut: "Ctrl+S" },
      { label: "Save As...", shortcut: "Ctrl+Shift+S" },
      { divider: true, label: "" },
      { label: "Import...", shortcut: "Ctrl+I" },
      { label: "Export Media", shortcut: "Ctrl+M" },
    ],
  },
  {
    label: "Edit",
    items: [
      { label: "Undo", shortcut: "Ctrl+Z" },
      { label: "Redo", shortcut: "Ctrl+Shift+Z" },
      { divider: true, label: "" },
      { label: "Cut", shortcut: "Ctrl+X" },
      { label: "Copy", shortcut: "Ctrl+C" },
      { label: "Paste", shortcut: "Ctrl+V" },
      { label: "Delete", shortcut: "Del" },
      { divider: true, label: "" },
      { label: "Select All", shortcut: "Ctrl+A" },
      { label: "Deselect All", shortcut: "Ctrl+Shift+A" },
    ],
  },
  {
    label: "Sequence",
    items: [
      { label: "Add Edit", shortcut: "Ctrl+K" },
      { label: "Ripple Delete", shortcut: "Shift+Del" },
      { divider: true, label: "" },
      { label: "Apply Default Transition", shortcut: "Ctrl+D" },
      { divider: true, label: "" },
      { label: "Add Marker", shortcut: "M" },
      { label: "Clear In/Out", shortcut: "Ctrl+Shift+X" },
      { divider: true, label: "" },
      { label: "Render Preview" },
      { label: "Sequence Settings..." },
    ],
  },
  {
    label: "Effects",
    items: [
      { label: "Video Effects" },
      { label: "Audio Effects" },
      { label: "Video Transitions" },
      { label: "Audio Transitions" },
    ],
  },
  {
    label: "Window",
    items: [
      { label: "Reset Layout" },
      { divider: true, label: "" },
      { label: "Media Browser" },
      { label: "Effects" },
      { label: "Audio Mixer" },
      { label: "Keyframe Editor" },
    ],
  },
  {
    label: "Help",
    items: [
      { label: "Keyboard Shortcuts" },
      { label: "About" },
    ],
  },
];

export default function MenuBar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div
      ref={barRef}
      style={{
        height: 28,
        background: "var(--bg-tertiary)",
        borderBottom: "1px solid var(--border-primary)",
        display: "flex",
        alignItems: "center",
        padding: "0 8px",
        gap: 0,
        zIndex: 100,
        flexShrink: 0,
      }}
    >
      {/* 로고 */}
      <div style={{
        width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center",
        marginRight: 8, color: "var(--accent)", fontWeight: 700, fontSize: 12,
      }}>
        ◆
      </div>

      {MENUS.map((menu) => (
        <div key={menu.label} style={{ position: "relative" }}>
          <button
            style={{
              padding: "4px 10px",
              background: openMenu === menu.label ? "var(--bg-active)" : "transparent",
              color: openMenu === menu.label ? "var(--text-active)" : "var(--text-secondary)",
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              transition: "background 0.1s",
            }}
            onClick={() => setOpenMenu(openMenu === menu.label ? null : menu.label)}
            onMouseEnter={() => openMenu && setOpenMenu(menu.label)}
          >
            {menu.label}
          </button>

          {openMenu === menu.label && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              minWidth: 220,
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-primary)",
              boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              padding: "4px 0",
              zIndex: 200,
            }}>
              {menu.items.map((item, i) =>
                item.divider ? (
                  <div key={i} style={{
                    height: 1,
                    background: "var(--border-primary)",
                    margin: "4px 8px",
                  }} />
                ) : (
                  <button
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                      padding: "5px 16px",
                      background: "transparent",
                      border: "none",
                      color: item.disabled ? "var(--text-muted)" : "var(--text-primary)",
                      cursor: item.disabled ? "default" : "pointer",
                      fontSize: 12,
                      textAlign: "left",
                    }}
                    onClick={() => {
                      item.action?.();
                      setOpenMenu(null);
                    }}
                    onMouseEnter={(e) => {
                      if (!item.disabled) (e.target as HTMLElement).style.background = "var(--accent)";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.background = "transparent";
                    }}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span style={{
                        fontSize: 10,
                        color: "var(--text-muted)",
                        marginLeft: 32,
                      }}>
                        {item.shortcut}
                      </span>
                    )}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ))}

      {/* 우측 — 프로젝트명 + 시간 */}
      <div style={{ flex: 1 }} />
      <span style={{ fontSize: 11, color: "var(--text-muted)", marginRight: 8 }}>
        Untitled Project
      </span>
    </div>
  );
}
