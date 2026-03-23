/**
 * 인쇄 미리보기, 스타일 관리자, 기호 삽입 대화상자
 * MS Word 365의 해당 대화상자를 정확히 재현한다.
 */
import { useState, useEffect, useRef } from "react";
import {
  X, Printer, ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Plus, Trash2, Edit3,
} from "lucide-react";
import { STYLE_PRESETS, FONT_LIST, FONT_SIZES, SPECIAL_CHARS, EQUATION_SYMBOLS } from "./constants";

/* ═══════════════════════════════════════════════
 *  인쇄 미리보기 대화상자
 * ═══════════════════════════════════════════════ */

/**
 * Word 365 스타일 인쇄 미리보기 전체화면 오버레이
 * @param {Object} props.editor - TipTap 에디터 인스턴스
 * @param {function} props.onClose - 닫기 핸들러
 * @param {function} props.onPrint - 인쇄 핸들러
 */
export function PrintPreviewDialog({ editor, onClose, onPrint, pageW = 794, pageH = 1123, marginTop = 96, marginBottom = 96, marginLeft = 120, marginRight = 120 }) {
  const [previewZoom, setPreviewZoom] = useState(60);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [copies, setCopies] = useState(1);
  const previewRef = useRef(null);

  /* Esc 키로 닫기 */
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  /* 페이지 수 계산 */
  useEffect(() => {
    if (!editor) return;
    const charCount = editor.storage.characterCount?.characters() || 0;
    setTotalPages(Math.max(1, Math.ceil(charCount / 1800)));
  }, [editor]);

  const scaledW = pageW * (previewZoom / 100);
  const scaledH = pageH * (previewZoom / 100);

  return (
    <div className="print-preview-overlay">
      {/* 상단 툴바 */}
      <div className="print-preview-toolbar">
        <button onClick={onClose} className="word-dialog-btn" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <ChevronLeft size={14} /> 돌아가기
        </button>

        <div style={{ width: 1, height: 24, background: "#ddd", margin: "0 8px" }} />

        <button onClick={() => { onPrint?.(); }} className="word-dialog-btn primary"
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 20px" }}>
          <Printer size={14} /> 인쇄
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
          <label style={{ fontSize: 11, color: "#555" }}>복사본:</label>
          <input type="number" value={copies} onChange={(e) => setCopies(Math.max(1, +e.target.value))}
            min={1} max={99}
            style={{ width: 48, padding: "3px 6px", border: "1px solid #ccc", borderRadius: 2, fontSize: 11 }} />
        </div>

        <div style={{ flex: 1 }} />

        {/* 페이지 네비게이션 */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1}
            style={{ border: "1px solid #ccc", background: "#fff", borderRadius: 2, padding: "2px 6px", cursor: "pointer" }}>
            <ChevronLeft size={12} />
          </button>
          <span style={{ fontSize: 11, color: "#555", minWidth: 60, textAlign: "center" }}>
            {currentPage} / {totalPages} 페이지
          </span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}
            style={{ border: "1px solid #ccc", background: "#fff", borderRadius: 2, padding: "2px 6px", cursor: "pointer" }}>
            <ChevronRight size={12} />
          </button>
        </div>

        <div style={{ width: 1, height: 24, background: "#ddd", margin: "0 8px" }} />

        {/* 줌 컨트롤 */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button onClick={() => setPreviewZoom(z => Math.max(25, z - 10))}
            style={{ border: "1px solid #ccc", background: "#fff", borderRadius: 2, padding: "2px 4px", cursor: "pointer" }}>
            <ZoomOut size={12} />
          </button>
          <span style={{ fontSize: 11, minWidth: 36, textAlign: "center" }}>{previewZoom}%</span>
          <button onClick={() => setPreviewZoom(z => Math.min(200, z + 10))}
            style={{ border: "1px solid #ccc", background: "#fff", borderRadius: 2, padding: "2px 4px", cursor: "pointer" }}>
            <ZoomIn size={12} />
          </button>
        </div>

        <button onClick={onClose} style={{ marginLeft: 8, border: "none", background: "none", cursor: "pointer", padding: 4 }}>
          <X size={16} color="#666" />
        </button>
      </div>

      {/* 미리보기 영역 */}
      <div className="print-preview-content" ref={previewRef}>
        <div style={{
          width: scaledW, minHeight: scaledH,
          background: "#fff",
          boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
          padding: `${marginTop * (previewZoom / 100)}px ${marginRight * (previewZoom / 100)}px ${marginBottom * (previewZoom / 100)}px ${marginLeft * (previewZoom / 100)}px`,
          position: "relative",
          flexShrink: 0,
        }}>
          {editor && (
            <div
              className="ProseMirror"
              style={{
                fontSize: `${11 * (previewZoom / 100)}pt`,
                fontFamily: "'맑은 고딕', 'Malgun Gothic', sans-serif",
                lineHeight: 1.75,
                color: "#1a1a1a",
                transform: `scale(${previewZoom / 100})`,
                transformOrigin: "top left",
                width: `${(pageW - marginLeft - marginRight)}px`,
                pointerEvents: "none",
              }}
              dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
            />
          )}
          {/* 페이지 번호 */}
          <div style={{
            position: "absolute", bottom: `${8 * (previewZoom / 100)}px`,
            left: 0, right: 0, textAlign: "center",
            fontSize: `${9 * (previewZoom / 100)}pt`, color: "#aaa",
          }}>- {currentPage} -</div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
 *  스타일 관리자 대화상자
 * ═══════════════════════════════════════════════ */

/**
 * Word 365 스타일 관리자 패널
 * 문서 스타일을 생성, 수정, 삭제할 수 있다.
 */
export function StylesManagerDialog({ editor, onClose, onApplyStyle }) {
  const [selectedStyle, setSelectedStyle] = useState("normal");
  const [editingStyle, setEditingStyle] = useState(null);
  const [customStyles, setCustomStyles] = useState([]);
  const [newStyleName, setNewStyleName] = useState("");

  const allStyles = [...STYLE_PRESETS, ...customStyles];
  const activeStyle = allStyles.find(s => s.id === selectedStyle) || allStyles[0];

  const handleApply = () => {
    if (onApplyStyle && activeStyle) {
      onApplyStyle(activeStyle);
      onClose();
    }
  };

  const handleCreateStyle = () => {
    if (!newStyleName.trim()) return;
    const id = `custom-${Date.now()}`;
    const newStyle = {
      id,
      label: newStyleName,
      tag: "p",
      fontSize: "11pt",
      fontWeight: 400,
      color: "#333",
      fontFamily: "'맑은 고딕', sans-serif",
      custom: true,
    };
    setCustomStyles(prev => [...prev, newStyle]);
    setSelectedStyle(id);
    setNewStyleName("");
  };

  const handleDeleteStyle = (id) => {
    setCustomStyles(prev => prev.filter(s => s.id !== id));
    if (selectedStyle === id) setSelectedStyle("normal");
  };

  return (
    <div className="word-dialog-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="word-dialog" style={{ minWidth: 500, maxWidth: 600 }}>
        <div className="word-dialog-title">
          <span>스타일</span>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", padding: 2 }}>
            <X size={14} />
          </button>
        </div>
        <div className="word-dialog-body" style={{ display: "flex", gap: 16, minHeight: 360 }}>
          {/* 왼쪽: 스타일 목록 */}
          <div style={{ flex: 1, border: "1px solid #d5d5d5", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {allStyles.map(style => (
                <div key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    background: selectedStyle === style.id ? "#CCE4F7" : "transparent",
                    borderBottom: "1px solid #f0f0f0",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                  <div>
                    <span style={{
                      fontFamily: style.fontFamily,
                      fontSize: parseInt(style.fontSize) > 14 ? 13 : 12,
                      fontWeight: style.fontWeight,
                      color: style.color,
                      fontStyle: style.fontStyle || "normal",
                    }}>가나다 Aa</span>
                    <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>{style.label}</div>
                  </div>
                  {style.custom && (
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteStyle(style.id); }}
                      style={{ border: "none", background: "none", cursor: "pointer", padding: 2 }}>
                      <Trash2 size={12} color="#999" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 오른쪽: 스타일 속성 미리보기 */}
          <div style={{ width: 200 }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>미리보기</div>
            <div style={{
              border: "1px solid #d5d5d5", borderRadius: 2, padding: 16, minHeight: 80,
              fontFamily: activeStyle.fontFamily,
              fontSize: activeStyle.fontSize,
              fontWeight: activeStyle.fontWeight,
              color: activeStyle.color,
              fontStyle: activeStyle.fontStyle || "normal",
              lineHeight: 1.75,
            }}>
              가나다라 마바사아 Aa
            </div>

            <div style={{ marginTop: 12, fontSize: 11, color: "#555" }}>
              <div><strong>글꼴:</strong> {activeStyle.fontFamily?.split(",")[0]?.replace(/'/g, "")}</div>
              <div><strong>크기:</strong> {activeStyle.fontSize}</div>
              <div><strong>굵기:</strong> {activeStyle.fontWeight >= 600 ? "굵게" : "보통"}</div>
              <div><strong>색상:</strong> {activeStyle.color}</div>
            </div>

            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 4 }}>
              <input type="text" value={newStyleName} onChange={(e) => setNewStyleName(e.target.value)}
                placeholder="새 스타일 이름..."
                className="word-dialog-input" style={{ fontSize: 11 }} />
              <button onClick={handleCreateStyle} className="word-dialog-btn" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, justifyContent: "center" }}>
                <Plus size={12} /> 새 스타일 만들기
              </button>
            </div>
          </div>
        </div>
        <div className="word-dialog-footer">
          <button onClick={handleApply} className="word-dialog-btn primary">적용</button>
          <button onClick={onClose} className="word-dialog-btn">닫기</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
 *  기호 삽입 대화상자
 * ═══════════════════════════════════════════════ */

/**
 * Word 365 기호 삽입 대화상자
 * 특수문자, 수식 기호를 카테고리별로 탐색하고 삽입할 수 있다.
 */
export function SymbolPickerDialog({ editor, onClose }) {
  const [activeTab, setActiveTab] = useState("symbols");
  const [category, setCategory] = useState(SPECIAL_CHARS[0]?.category || "");
  const [eqCategory, setEqCategory] = useState(EQUATION_SYMBOLS[0]?.category || "");
  const [recentSymbols, setRecentSymbols] = useState([]);
  const [selectedChar, setSelectedChar] = useState(null);
  const [fontFilter, setFontFilter] = useState("all");

  const chars = activeTab === "symbols"
    ? (SPECIAL_CHARS.find(c => c.category === category)?.chars || [])
    : (EQUATION_SYMBOLS.find(c => c.category === eqCategory)?.chars || []);

  const categories = activeTab === "symbols" ? SPECIAL_CHARS : EQUATION_SYMBOLS;

  const handleInsert = (ch) => {
    if (!editor || !ch) return;
    editor.chain().focus().insertContent(ch).run();
    setRecentSymbols(prev => [ch, ...prev.filter(x => x !== ch)].slice(0, 20));
    setSelectedChar(ch);
  };

  const handleInsertAndClose = (ch) => {
    handleInsert(ch);
    onClose();
  };

  return (
    <div className="word-dialog-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="word-dialog" style={{ minWidth: 520, maxWidth: 640 }}>
        <div className="word-dialog-title">
          <span>기호</span>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", padding: 2 }}>
            <X size={14} />
          </button>
        </div>

        {/* 탭 */}
        <div className="word-dialog-tabs">
          <button className={`word-dialog-tab${activeTab === "symbols" ? " active" : ""}`}
            onClick={() => setActiveTab("symbols")}>기호</button>
          <button className={`word-dialog-tab${activeTab === "equations" ? " active" : ""}`}
            onClick={() => setActiveTab("equations")}>특수 문자</button>
        </div>

        <div className="word-dialog-body">
          {/* 글꼴 필터 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <label style={{ fontSize: 11, color: "#555" }}>글꼴:</label>
            <select value={fontFilter} onChange={(e) => setFontFilter(e.target.value)}
              style={{ padding: "3px 8px", border: "1px solid #ccc", borderRadius: 2, fontSize: 11 }}>
              <option value="all">(일반 텍스트)</option>
              <option value="symbol">Symbol</option>
              <option value="wingdings">Wingdings</option>
            </select>

            <label style={{ fontSize: 11, color: "#555", marginLeft: 12 }}>하위 집합:</label>
            <select
              value={activeTab === "symbols" ? category : eqCategory}
              onChange={(e) => activeTab === "symbols" ? setCategory(e.target.value) : setEqCategory(e.target.value)}
              style={{ padding: "3px 8px", border: "1px solid #ccc", borderRadius: 2, fontSize: 11, flex: 1 }}>
              {categories.map(c => (
                <option key={c.category} value={c.category}>{c.category}</option>
              ))}
            </select>
          </div>

          {/* 문자 그리드 */}
          <div style={{
            border: "1px solid #d5d5d5", borderRadius: 2, padding: 4,
            maxHeight: 240, overflowY: "auto", background: "#fff",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(16, 1fr)", gap: 1 }}>
              {chars.map((ch, i) => (
                <button key={i} type="button"
                  onClick={() => setSelectedChar(ch)}
                  onDoubleClick={() => handleInsertAndClose(ch)}
                  style={{
                    width: 28, height: 28,
                    border: selectedChar === ch ? "2px solid #185ABD" : "1px solid #e0e0e0",
                    borderRadius: 2,
                    background: selectedChar === ch ? "#E5F1FB" : "#fff",
                    cursor: "pointer",
                    fontSize: 14,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.08s",
                    padding: 0,
                  }}
                  onMouseEnter={(e) => { if (selectedChar !== ch) { e.currentTarget.style.background = "#f0f0f0"; } }}
                  onMouseLeave={(e) => { if (selectedChar !== ch) { e.currentTarget.style.background = "#fff"; } }}
                  title={`${ch} (U+${ch.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")})`}>
                  {ch}
                </button>
              ))}
            </div>
          </div>

          {/* 선택한 문자 정보 */}
          {selectedChar && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, fontSize: 11, color: "#555" }}>
              <span style={{ fontSize: 24, border: "1px solid #ddd", padding: "2px 8px", borderRadius: 3 }}>{selectedChar}</span>
              <div>
                <div>문자: {selectedChar}</div>
                <div>유니코드: U+{selectedChar.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}</div>
              </div>
            </div>
          )}

          {/* 최근 사용한 기호 */}
          {recentSymbols.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>최근 사용한 기호:</div>
              <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {recentSymbols.map((ch, i) => (
                  <button key={i} type="button"
                    onClick={() => handleInsert(ch)}
                    style={{
                      width: 24, height: 24,
                      border: "1px solid #e0e0e0", borderRadius: 2,
                      background: "#fff", cursor: "pointer", fontSize: 13,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "#E5F1FB"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "#fff"; }}>
                    {ch}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="word-dialog-footer">
          <button onClick={() => handleInsert(selectedChar)} className="word-dialog-btn primary"
            disabled={!selectedChar}>삽입</button>
          <button onClick={onClose} className="word-dialog-btn">닫기</button>
        </div>
      </div>
    </div>
  );
}
