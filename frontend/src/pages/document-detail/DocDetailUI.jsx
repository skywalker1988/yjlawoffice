/**
 * DocDetailUI — 재사용 UI 프리미티브 (리본 버튼, 구분선, 모달, 토스트, 눈금자)
 * 문서 상세 에디터 전용 공통 컴포넌트
 */
import { useState, useCallback } from "react";
import { TOAST_DURATION_MS } from "../../utils/timing";

/* ── 리본 버튼 (소형) ── */
export function RibbonBtn({ icon, label, active, onClick, disabled, style, vertical, small }) {
  return (
    <button
      onClick={onClick}
      title={label}
      disabled={disabled}
      className="word-rb"
      style={{
        display: "flex", flexDirection: vertical ? "column" : "row",
        alignItems: "center", justifyContent: "center", gap: vertical ? 1 : 3,
        minWidth: vertical ? 44 : 26, height: vertical ? 56 : 26,
        border: "none", borderRadius: 2,
        background: active ? "rgba(0,0,0,0.08)" : "transparent",
        color: disabled ? "#bbb" : (active ? "#1a1a1a" : "#444"),
        cursor: disabled ? "default" : "pointer",
        transition: "background 0.12s", padding: vertical ? "4px 6px" : "0 3px",
        fontSize: small ? 9 : 10, whiteSpace: "nowrap",
        ...style,
      }}
    >
      {icon}
      {vertical && label && <span style={{ fontSize: 9, marginTop: 1 }}>{label}</span>}
    </button>
  );
}

/* ── 리본 버튼 (대형) ── */
export function RibbonBtnLarge({ icon, label, onClick, disabled, style }) {
  return (
    <button
      onClick={onClick}
      title={label}
      disabled={disabled}
      className="word-rb"
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 2, minWidth: 50, height: 62, border: "none", borderRadius: 2,
        background: "transparent", color: disabled ? "#bbb" : "#444",
        cursor: disabled ? "default" : "pointer", transition: "background 0.12s",
        padding: "4px 6px", fontSize: 9, whiteSpace: "nowrap",
        ...style,
      }}
    >
      <div style={{ fontSize: 20, lineHeight: 1 }}>{icon}</div>
      <span>{label}</span>
    </button>
  );
}

/* ── 구분선 (대) ── */
export function Sep() {
  return <div style={{ width: 1, height: 52, background: "rgba(0,0,0,0.1)", margin: "0 5px", flexShrink: 0 }} />;
}

/* ── 구분선 (소) ── */
export function SepSmall() {
  return <div style={{ width: 1, height: 22, background: "rgba(0,0,0,0.08)", margin: "0 3px", flexShrink: 0 }} />;
}

/* ── 리본 그룹 ── */
export function RibbonGroup({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}>
        {children}
      </div>
      {label && (
        <div style={{ fontSize: 8, color: "#888", borderTop: "1px solid rgba(0,0,0,0.06)", width: "100%", textAlign: "center", paddingTop: 1, marginTop: 1 }}>
          {label}
        </div>
      )}
    </div>
  );
}

/* ── 드롭다운 ── */
export function Dropdown({ open, onClose, children, style }) {
  if (!open) return null;
  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={onClose} />
      <div style={{
        position: "absolute", top: "100%", left: 0, zIndex: 9999,
        background: "#fff", border: "1px solid #d0d0d0", borderRadius: 4,
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)", padding: 6,
        ...style,
      }}>
        {children}
      </div>
    </>
  );
}

/* ── 모달 ── */
export function Modal({ open, title, onClose, children, width }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }} onClick={onClose} />
      <div style={{
        position: "relative", background: "#fff", borderRadius: 6, padding: 0,
        maxWidth: width || 440, width: "92%", boxShadow: "0 16px 48px rgba(0,0,0,0.25)",
        maxHeight: "80vh", display: "flex", flexDirection: "column",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 16px", borderBottom: "1px solid #e8e8e8",
        }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: "#1a1a1a" }}>{title}</span>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 16, color: "#999", padding: "2px 6px" }}>&#x2715;</button>
        </div>
        <div style={{ padding: 16, overflowY: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ── 삭제 확인 모달 ── */
export function ConfirmModal({ open, title, message, onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <Modal open={open} title={title} onClose={onCancel} width={360}>
      <p style={{ fontSize: 13, color: "#555", marginBottom: 20, lineHeight: 1.6 }}>{message}</p>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button onClick={onCancel} style={{ padding: "6px 18px", border: "1px solid #ddd", borderRadius: 4, background: "#fff", fontSize: 12, cursor: "pointer" }}>취소</button>
        <button onClick={onConfirm} style={{ padding: "6px 18px", border: "none", borderRadius: 4, background: "#c44", color: "#fff", fontSize: 12, cursor: "pointer" }}>삭제</button>
      </div>
    </Modal>
  );
}

/* ── 토스트 훅 ── */
export function useToast() {
  const [msg, setMsg] = useState(null);
  const show = useCallback((text) => {
    setMsg(text);
    setTimeout(() => setMsg(null), TOAST_DURATION_MS);
  }, []);
  const Toast = msg ? (
    <div style={{
      position: "fixed", bottom: 48, left: "50%", transform: "translateX(-50%)",
      zIndex: 99999, background: "#333", color: "#fff", padding: "8px 20px",
      borderRadius: 6, fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
    }}>
      {msg}
    </div>
  ) : null;
  return { show, Toast };
}

/* ── 눈금자 ── */
export function Ruler({ zoom, show }) {
  if (!show) return null;
  const marks = [];
  const totalCm = 21;
  for (let i = 0; i <= totalCm; i++) {
    const isMajor = i % 5 === 0;
    marks.push(
      <div key={i} style={{ position: "absolute", left: `${(i / totalCm) * 100}%`, textAlign: "center" }}>
        <div style={{ width: 1, height: isMajor ? 8 : 5, background: "#999", margin: "0 auto" }} />
        {isMajor && i > 0 && (
          <span style={{ fontSize: 7, color: "#888", position: "absolute", top: 9, left: "50%", transform: "translateX(-50%)" }}>
            {i}
          </span>
        )}
      </div>
    );
    if (i < totalCm) {
      for (let j = 1; j <= 4; j++) {
        const pos = (i + j * 0.2) / totalCm * 100;
        marks.push(
          <div key={`${i}-${j}`} style={{ position: "absolute", left: `${pos}%` }}>
            <div style={{ width: 1, height: j === 2 ? 5 : 3, background: "#bbb", margin: "0 auto" }} />
          </div>
        );
      }
    }
  }
  return (
    <div style={{
      height: 20, background: "#f5f5f3", borderBottom: "1px solid rgba(0,0,0,0.08)",
      display: "flex", alignItems: "flex-end", justifyContent: "center", flexShrink: 0,
    }}>
      <div style={{ width: `${21 * zoom * 2.2}em`, maxWidth: "95vw", position: "relative", height: "100%", paddingTop: 2 }}>
        {marks}
      </div>
    </div>
  );
}
