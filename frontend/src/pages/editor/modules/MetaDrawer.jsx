/**
 * MetaDrawer — 문서 속성 편집 서랍 패널
 * - 에디터 우측에 슬라이드 오버레이로 표시
 * - 부제, 저자, 출처, 날짜, 유형, 상태, 중요도 편집
 */
import { DOC_TYPES } from "./constants";

export function MetaDrawer({ doc, setDoc, open, onClose }) {
  if (!open) return null;

  const field = (label, key, type) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>{label}</label>
      {type === "textarea" ? (
        <textarea
          value={doc[key] || ""}
          onChange={(e) => setDoc((d) => ({ ...d, [key]: e.target.value }))}
          rows={3}
          style={{ width: "100%", padding: "6px 8px", border: "1px solid #ddd", borderRadius: 3, fontSize: 13, resize: "vertical", fontFamily: "inherit" }}
        />
      ) : (
        <input
          type={type || "text"}
          value={doc[key] || ""}
          onChange={(e) => setDoc((d) => ({ ...d, [key]: e.target.value }))}
          style={{ width: "100%", padding: "6px 8px", border: "1px solid #ddd", borderRadius: 3, fontSize: 13 }}
        />
      )}
    </div>
  );

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, width: 340, height: "100vh",
      background: "#fff", borderLeft: "1px solid #e2e8f0", zIndex: 1000,
      overflowY: "auto", padding: "20px 16px", boxShadow: "-4px 0 16px rgba(0,0,0,0.08)",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>문서 속성</span>
        <button type="button" onClick={onClose} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#999" }}>✕</button>
      </div>
      {field("부제", "subtitle")}
      {field("저자", "author")}
      {field("출처", "source")}
      {field("발행일", "publishedDate", "date")}
      {field("요약", "summary", "textarea")}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>문서 유형</label>
        <select value={doc.documentType || "article"} onChange={(e) => setDoc((d) => ({ ...d, documentType: e.target.value }))}
          style={{ width: "100%", padding: "6px 8px", border: "1px solid #ddd", borderRadius: 3, fontSize: 13 }}>
          {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>상태</label>
        <select value={doc.status || "draft"} onChange={(e) => setDoc((d) => ({ ...d, status: e.target.value }))}
          style={{ width: "100%", padding: "6px 8px", border: "1px solid #ddd", borderRadius: 3, fontSize: 13 }}>
          <option value="draft">초안</option>
          <option value="published">발행</option>
          <option value="archived">보관</option>
        </select>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 11, color: "#888", marginBottom: 4 }}>중요도 (1~5)</label>
        <input type="number" min={1} max={5} value={doc.importance || 3}
          onChange={(e) => setDoc((d) => ({ ...d, importance: parseInt(e.target.value) || 3 }))}
          style={{ width: 60, padding: "6px 8px", border: "1px solid #ddd", borderRadius: 3, fontSize: 13 }}
        />
      </div>
    </div>
  );
}
