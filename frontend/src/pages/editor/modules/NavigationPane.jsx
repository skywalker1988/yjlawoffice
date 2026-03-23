/**
 * Navigation Pane - 문서 구조 탐색 창
 */
import { useState, useEffect, useMemo } from "react";

export function NavigationPane({ editor, onClose }) {
  const [headings, setHeadings] = useState([]);
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if (!editor) return;

    const updateHeadings = () => {
      const items = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          items.push({
            level: node.attrs.level,
            text: node.textContent,
            pos,
          });
        }
      });
      setHeadings(items);
    };

    updateHeadings();
    editor.on("update", updateHeadings);
    return () => editor.off("update", updateHeadings);
  }, [editor]);

  const filtered = useMemo(() => {
    if (!searchText) return headings;
    return headings.filter(h => h.text.toLowerCase().includes(searchText.toLowerCase()));
  }, [headings, searchText]);

  const scrollToHeading = (pos) => {
    if (!editor) return;
    editor.chain().focus().setTextSelection(pos).run();
    // Scroll into view
    const domPos = editor.view.domAtPos(pos);
    if (domPos?.node) {
      const el = domPos.node.nodeType === Node.TEXT_NODE ? domPos.node.parentElement : domPos.node;
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div style={{
      width: 220, flexShrink: 0, background: "#f8f9fa", borderRight: "1px solid #e0e0e0",
      display: "flex", flexDirection: "column", overflow: "hidden",
      fontFamily: "'맑은 고딕', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        padding: "8px 10px", borderBottom: "1px solid #e0e0e0",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#333" }}>탐색</span>
        <button onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#999", padding: "0 2px" }}>
          ✕
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: "6px 10px", borderBottom: "1px solid #e0e0e0" }}>
        <input
          type="text"
          placeholder="문서 검색..."
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{
            width: "100%", padding: "4px 8px", fontSize: 11,
            border: "1px solid #d5d5d5", borderRadius: 3, outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Tab buttons */}
      <div style={{
        display: "flex", borderBottom: "1px solid #e0e0e0", background: "#fff",
      }}>
        <button style={{
          flex: 1, padding: "6px 0", fontSize: 10, border: "none", borderBottom: "2px solid #0078d4",
          background: "transparent", color: "#0078d4", cursor: "pointer", fontWeight: 600,
        }}>
          제목
        </button>
        <button style={{
          flex: 1, padding: "6px 0", fontSize: 10, border: "none", borderBottom: "2px solid transparent",
          background: "transparent", color: "#888", cursor: "pointer",
        }}>
          페이지
        </button>
      </div>

      {/* Headings list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "4px 0" }}>
        {filtered.length === 0 && (
          <div style={{ padding: "16px 12px", fontSize: 11, color: "#999", textAlign: "center" }}>
            {searchText ? "검색 결과 없음" : "문서에 제목이 없습니다.\n제목 스타일을 적용하세요."}
          </div>
        )}
        {filtered.map((h, i) => (
          <button
            key={i}
            type="button"
            onClick={() => scrollToHeading(h.pos)}
            style={{
              display: "block", width: "100%", textAlign: "left",
              padding: `4px 10px 4px ${10 + (h.level - 1) * 14}px`,
              border: "none", background: "transparent",
              fontSize: h.level === 1 ? 12 : h.level === 2 ? 11 : 10,
              fontWeight: h.level <= 2 ? 600 : 400,
              color: h.level === 1 ? "#1e3a5f" : h.level === 2 ? "#333" : "#555",
              cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis",
              whiteSpace: "nowrap", fontFamily: "'맑은 고딕', sans-serif",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#eff6ff"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            {h.text || "(빈 제목)"}
          </button>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        padding: "6px 10px", borderTop: "1px solid #e0e0e0",
        fontSize: 10, color: "#999",
      }}>
        {headings.length}개 제목
      </div>
    </div>
  );
}
