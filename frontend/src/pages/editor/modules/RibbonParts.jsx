/**
 * Ribbon UI primitives - shared across all tabs
 * All icons from lucide-react (no emoji)
 */
import { useState, useRef, useEffect } from "react";

/* ── Basic Ribbon Button ── */
export function RibbonBtn({ children, active, onClick, title, style, small, disabled, className }) {
  return (
    <button
      type="button"
      className={`word-ribbon-btn${active ? " active" : ""}${className ? " " + className : ""}`}
      onMouseDown={(e) => { e.preventDefault(); if (!disabled) onClick?.(); }}
      title={title || ""}
      disabled={disabled}
      style={{
        height: small ? 22 : 26,
        minWidth: small ? 22 : 26,
        padding: small ? "0 4px" : "0 6px",
        background: active ? "var(--ribbon-active-bg, #c8daf0)" : "transparent",
        color: disabled ? "var(--ribbon-disabled, #bbb)" : "var(--ribbon-fg, #333)",
        border: active ? "1px solid var(--ribbon-active-border, #8ab4e8)" : "1px solid transparent",
        borderRadius: 3,
        fontSize: small ? 11 : 12,
        cursor: disabled ? "default" : "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        fontFamily: "'Segoe UI', '맑은 고딕', sans-serif",
        lineHeight: 1,
        position: "relative",
        opacity: disabled ? 0.45 : 1,
        transition: "background 0.08s, border-color 0.08s",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/* ── Large Ribbon Button (for paste, etc.) ── */
export function RibbonBtnLarge({ icon, label, onClick, title, active, split, onDropdown }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <button
        type="button"
        className="word-ribbon-btn"
        onMouseDown={(e) => { e.preventDefault(); onClick?.(); }}
        title={title || label}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          height: split ? 42 : 56, width: 48, background: active ? "var(--ribbon-active-bg, #c8daf0)" : "transparent",
          border: active ? "1px solid var(--ribbon-active-border, #8ab4e8)" : "1px solid transparent",
          borderRadius: "3px 3px 0 0", cursor: "pointer", padding: "4px",
          color: "var(--ribbon-fg, #333)",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 20, height: 20 }}>{icon}</span>
        <span style={{ fontSize: 9, marginTop: 2 }}>{label}</span>
      </button>
      {split && (
        <button
          type="button"
          className="word-ribbon-btn"
          onMouseDown={(e) => { e.preventDefault(); onDropdown?.(); }}
          style={{
            height: 14, width: 48, border: "1px solid transparent", borderTop: "1px solid #e0e0e0",
            background: "transparent", cursor: "pointer", fontSize: 7, borderRadius: "0 0 3px 3px",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--ribbon-fg, #555)",
          }}
        >▼</button>
      )}
    </div>
  );
}

/* ── Select Dropdown ── */
export function RibbonSelect({ value, options, onChange, title, style, renderOption }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      title={title}
      style={{
        height: 24, padding: "0 4px",
        background: "var(--ribbon-input-bg, #fff)",
        border: "1px solid var(--ribbon-input-border, #c0c0c0)",
        borderRadius: 2, fontSize: 11, cursor: "pointer",
        color: "var(--ribbon-fg, #333)",
        fontFamily: "'Segoe UI', '맑은 고딕', sans-serif",
        ...style,
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} style={o.style}>{o.label}</option>
      ))}
    </select>
  );
}

/* ── Group Separator ── */
export function GroupSep() {
  return (
    <div style={{
      width: 1, alignSelf: "stretch",
      background: "var(--ribbon-sep, #d1d5db)", margin: "4px 6px",
    }} />
  );
}

/* ── Ribbon Group with label + dialog launcher ── */
export function RibbonGroup({ label, children, dialogLauncher }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      position: "relative", padding: "4px 8px 0",
    }}>
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", gap: 2,
        alignItems: "flex-start", justifyContent: "flex-start",
      }}>
        {children}
      </div>
      <div style={{
        fontSize: 9, color: "var(--ribbon-label, #888)", marginTop: 2, paddingBottom: 2,
        fontFamily: "'Segoe UI', '맑은 고딕', sans-serif", whiteSpace: "nowrap",
        display: "flex", alignItems: "center", gap: 3,
      }}>
        {label}
        {dialogLauncher && (
          <button
            type="button" onClick={dialogLauncher} title={`${label} 대화 상자`}
            style={{
              width: 11, height: 11, border: "1px solid var(--ribbon-sep, #ccc)",
              background: "transparent", cursor: "pointer", fontSize: 7,
              color: "var(--ribbon-label, #aaa)", padding: 0,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              borderRadius: 2,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--ribbon-active-bg, #dbeafe)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >↘</button>
        )}
      </div>
    </div>
  );
}

/* ── Dropdown Button (click to show dropdown) ── */
export function DropdownButton({ trigger, children, align = "left", width }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <div onClick={() => setOpen(!open)} style={{ display: "inline-flex" }}>{trigger}</div>
      {open && (
        <div
          className="word-dropdown-menu"
          style={{
            [align === "right" ? "right" : "left"]: 0,
            ...(width ? { width, minWidth: width } : {}),
          }}
          onClick={(e) => {
            // Only close if the click is directly on a dropdown item
            if (e.target.closest(".word-dropdown-item")) setOpen(false);
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/* ── Color Picker Grid ── */
export function ColorGrid({ colors, value, onChange, columns = 10, recentColors = [] }) {
  return (
    <div>
      {recentColors.length > 0 && (
        <div style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 10, color: "#888", marginBottom: 3 }}>최근 사용</div>
          <div style={{ display: "flex", gap: 2 }}>
            {recentColors.slice(0, columns).map((c, i) => (
              <button key={`r-${i}`} type="button" onClick={() => onChange(c)} title={c}
                style={{
                  width: 16, height: 16, background: c,
                  border: value === c ? "2px solid #333" : "1px solid #ccc",
                  borderRadius: 1, cursor: "pointer", padding: 0,
                }} />
            ))}
          </div>
        </div>
      )}
      <div style={{
        display: "grid", gridTemplateColumns: `repeat(${columns}, 16px)`, gap: 2, padding: 2,
      }}>
        {colors.map((c) => (
          <button key={c} type="button" onClick={() => onChange(c)} title={c}
            style={{
              width: 16, height: 16, background: c,
              border: value === c ? "2px solid #333" : "1px solid #ccc",
              borderRadius: 1, cursor: "pointer", padding: 0,
              transition: "transform 0.05s",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.3)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          />
        ))}
      </div>
    </div>
  );
}
