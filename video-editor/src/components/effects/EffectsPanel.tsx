/**
 * EffectsPanel — 이펙트 브라우저 + 드래그하여 클립에 적용
 */
"use client";

import { useState } from "react";

interface EffectDef {
  id: string;
  name: string;
}

interface EffectCategory {
  name: string;
  children: { name: string; items: EffectDef[] }[];
}

const EFFECTS: EffectCategory[] = [
  {
    name: "Video Effects",
    children: [
      { name: "Color Correction", items: [
        { id: "brightness-contrast", name: "Brightness & Contrast" },
        { id: "hue-saturation", name: "Hue/Saturation" },
        { id: "curves", name: "Curves" },
        { id: "levels", name: "Levels" },
        { id: "color-balance", name: "Color Balance" },
      ]},
      { name: "Blur & Sharpen", items: [
        { id: "gaussian-blur", name: "Gaussian Blur" },
        { id: "directional-blur", name: "Directional Blur" },
        { id: "sharpen", name: "Sharpen" },
        { id: "unsharp-mask", name: "Unsharp Mask" },
      ]},
      { name: "Distort", items: [
        { id: "mirror", name: "Mirror" },
        { id: "spherize", name: "Spherize" },
        { id: "wave-warp", name: "Wave Warp" },
        { id: "corner-pin", name: "Corner Pin" },
      ]},
      { name: "Stylize", items: [
        { id: "find-edges", name: "Find Edges" },
        { id: "posterize", name: "Posterize" },
        { id: "mosaic", name: "Mosaic" },
        { id: "glow", name: "Glow" },
      ]},
      { name: "Keying", items: [
        { id: "chroma-key", name: "Chroma Key" },
        { id: "luma-key", name: "Luma Key" },
      ]},
      { name: "Generate", items: [
        { id: "noise", name: "Noise" },
        { id: "gradient", name: "Gradient" },
      ]},
    ],
  },
  {
    name: "Video Transitions",
    children: [
      { name: "Dissolve", items: [
        { id: "cross-dissolve", name: "Cross Dissolve" },
        { id: "dip-to-black", name: "Dip to Black" },
        { id: "dip-to-white", name: "Dip to White" },
      ]},
      { name: "Wipe", items: [
        { id: "wipe-left", name: "Wipe (Left)" },
        { id: "wipe-right", name: "Wipe (Right)" },
        { id: "clock-wipe", name: "Clock Wipe" },
      ]},
      { name: "Slide", items: [
        { id: "slide", name: "Slide" },
        { id: "push", name: "Push" },
      ]},
    ],
  },
  {
    name: "Audio Effects",
    children: [
      { name: "Volume", items: [
        { id: "volume", name: "Volume" },
        { id: "pan-balance", name: "Pan/Balance" },
      ]},
      { name: "EQ", items: [
        { id: "parametric-eq", name: "Parametric EQ" },
      ]},
      { name: "Dynamics", items: [
        { id: "compressor", name: "Compressor" },
        { id: "limiter", name: "Limiter" },
      ]},
      { name: "Reverb & Delay", items: [
        { id: "reverb", name: "Reverb" },
        { id: "delay", name: "Delay" },
      ]},
    ],
  },
];

export default function EffectsPanel() {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["Video Effects"]));

  const toggle = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const matchesSearch = (name: string) =>
    !search || name.toLowerCase().includes(search.toLowerCase());

  return (
    <div style={{ padding: 4, overflow: "auto", height: "100%" }}>
      <input
        className="input"
        placeholder="Search effects..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ width: "100%", marginBottom: 6, fontSize: 10, padding: "3px 6px" }}
      />

      {EFFECTS.map((cat) => (
        <div key={cat.name}>
          {/* 카테고리 헤더 */}
          <button
            style={{
              display: "flex", alignItems: "center", gap: 4,
              width: "100%", padding: "4px 4px",
              background: "none", border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: 600, color: "var(--text-secondary)",
              textAlign: "left",
            }}
            onClick={() => toggle(cat.name)}
          >
            <span style={{ fontSize: 8 }}>{expanded.has(cat.name) ? "▾" : "▸"}</span>
            {cat.name}
          </button>

          {expanded.has(cat.name) && cat.children.map((sub) => {
            const filteredItems = sub.items.filter((item) => matchesSearch(item.name));
            if (search && filteredItems.length === 0) return null;

            return (
              <div key={sub.name} style={{ paddingLeft: 12 }}>
                <button
                  style={{
                    display: "flex", alignItems: "center", gap: 4,
                    width: "100%", padding: "3px 4px",
                    background: "none", border: "none", cursor: "pointer",
                    fontSize: 10, color: "var(--text-muted)",
                    textAlign: "left",
                  }}
                  onClick={() => toggle(sub.name)}
                >
                  <span style={{ fontSize: 7 }}>{expanded.has(sub.name) ? "▾" : "▸"}</span>
                  {sub.name}
                </button>

                {expanded.has(sub.name) && filteredItems.map((item) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/x-effect-id", item.id);
                      e.dataTransfer.effectAllowed = "copy";
                    }}
                    style={{
                      padding: "3px 8px 3px 24px",
                      fontSize: 10,
                      color: "var(--text-primary)",
                      cursor: "grab",
                    }}
                    onMouseEnter={(e) => {
                      (e.target as HTMLElement).style.background = "var(--bg-hover)";
                    }}
                    onMouseLeave={(e) => {
                      (e.target as HTMLElement).style.background = "transparent";
                    }}
                  >
                    {item.name}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
