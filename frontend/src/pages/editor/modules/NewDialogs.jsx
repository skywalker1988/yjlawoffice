/**
 * NewDialogs — 새로 추가된 다이얼로그 모음
 * - 테두리 및 음영 / 표 속성 / 북마크 / 상호 참조 / 워터마크 / 페이지 테두리
 */
import { useState, useEffect } from "react";
import { BORDER_STYLES, BORDER_WIDTHS, TABLE_STYLES, PARAGRAPH_SHADING_COLORS, PAGE_BORDER_STYLES, WATERMARK_PRESETS } from "./constants";

/* ──────────────────────── 공통 다이얼로그 래퍼 ──────────────────────── */
function DialogShell({ title, children, onClose, onOk, width }) {
  return (
    <div className="word-dialog-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="word-dialog" style={{ minWidth: width || 480, maxWidth: width || 640 }}>
        <div className="word-dialog-title">
          <span>{title}</span>
          <button type="button" onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 16, color: "#888" }}>✕</button>
        </div>
        <div className="word-dialog-body">{children}</div>
        <div className="word-dialog-footer">
          <button type="button" className="word-dialog-btn" onClick={onClose}>취소</button>
          <button type="button" className="word-dialog-btn primary" onClick={onOk}>확인</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════ 테두리 및 음영 다이얼로그 ══════════════════════ */
export function BorderShadingDialog({ editor, onClose }) {
  const [tab, setTab] = useState("border");
  const [borderStyle, setBorderStyle] = useState("solid");
  const [borderWidth, setBorderWidth] = useState(1);
  const [borderColor, setBorderColor] = useState("#333333");
  const [sides, setSides] = useState({ top: true, bottom: true, left: true, right: true });
  const [shadingColor, setShadingColor] = useState("");

  const handleOk = () => {
    if (!editor) { onClose(); return; }
    if (tab === "border") {
      const borderVal = borderStyle === "none" ? "none" : `${borderWidth}px ${borderStyle} ${borderColor}`;
      editor.chain().focus().setParagraphBorder({
        borderTop: sides.top ? borderVal : "none",
        borderBottom: sides.bottom ? borderVal : "none",
        borderLeft: sides.left ? borderVal : "none",
        borderRight: sides.right ? borderVal : "none",
      }).run();
    } else {
      if (shadingColor) {
        editor.chain().focus().setParagraphShading(shadingColor).run();
      }
    }
    onClose();
  };

  return (
    <DialogShell title="테두리 및 음영" onClose={onClose} onOk={handleOk} width={520}>
      <div className="word-dialog-tabs">
        <button className={`word-dialog-tab${tab === "border" ? " active" : ""}`} onClick={() => setTab("border")}>테두리</button>
        <button className={`word-dialog-tab${tab === "shading" ? " active" : ""}`} onClick={() => setTab("shading")}>음영</button>
      </div>
      <div style={{ padding: 16 }}>
        {tab === "border" ? (
          <div style={{ display: "flex", gap: 24 }}>
            {/* 설정 */}
            <div style={{ flex: 1 }}>
              <label className="word-dialog-label">스타일</label>
              <div style={{ border: "1px solid #ccc", borderRadius: 3, maxHeight: 120, overflowY: "auto", marginBottom: 12 }}>
                {BORDER_STYLES.map(s => (
                  <button key={s.value} type="button"
                    onClick={() => setBorderStyle(s.value)}
                    style={{
                      display: "block", width: "100%", padding: "4px 8px", border: "none",
                      background: borderStyle === s.value ? "#dbeafe" : "transparent",
                      textAlign: "left", cursor: "pointer", fontSize: 12,
                    }}>
                    {s.label}
                  </button>
                ))}
              </div>
              <label className="word-dialog-label">색</label>
              <input type="color" value={borderColor} onChange={e => setBorderColor(e.target.value)}
                style={{ width: 50, height: 24, border: "1px solid #ccc", borderRadius: 2, cursor: "pointer" }} />
              <label className="word-dialog-label" style={{ marginTop: 8 }}>너비</label>
              <select value={borderWidth} onChange={e => setBorderWidth(parseFloat(e.target.value))}
                className="word-dialog-input" style={{ width: 80 }}>
                {BORDER_WIDTHS.map(w => <option key={w} value={w}>{w}px</option>)}
              </select>
            </div>
            {/* 미리보기 */}
            <div style={{ width: 180 }}>
              <label className="word-dialog-label">미리 보기</label>
              <div style={{
                width: 150, height: 100, border: "1px solid #ddd", borderRadius: 3,
                position: "relative", background: "#fff", margin: "0 auto",
              }}>
                <div style={{
                  position: "absolute", top: 20, left: 20, right: 20, bottom: 20,
                  borderTop: sides.top ? `${borderWidth}px ${borderStyle} ${borderColor}` : "none",
                  borderBottom: sides.bottom ? `${borderWidth}px ${borderStyle} ${borderColor}` : "none",
                  borderLeft: sides.left ? `${borderWidth}px ${borderStyle} ${borderColor}` : "none",
                  borderRight: sides.right ? `${borderWidth}px ${borderStyle} ${borderColor}` : "none",
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 4, marginTop: 8 }}>
                {[
                  { key: "top", label: "▲" },
                  { key: "bottom", label: "▼" },
                  { key: "left", label: "◀" },
                  { key: "right", label: "▶" },
                ].map(s => (
                  <button key={s.key} type="button"
                    onClick={() => setSides(prev => ({ ...prev, [s.key]: !prev[s.key] }))}
                    style={{
                      width: 28, height: 24, fontSize: 10, border: "1px solid #ccc",
                      borderRadius: 2, cursor: "pointer",
                      background: sides[s.key] ? "#dbeafe" : "#fff",
                    }}>
                    {s.label}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 4, marginTop: 8, justifyContent: "center" }}>
                <button type="button" onClick={() => setSides({ top: true, bottom: true, left: true, right: true })}
                  style={{ padding: "2px 8px", fontSize: 10, border: "1px solid #ccc", borderRadius: 2, cursor: "pointer" }}>
                  상자
                </button>
                <button type="button" onClick={() => setSides({ top: false, bottom: false, left: false, right: false })}
                  style={{ padding: "2px 8px", fontSize: 10, border: "1px solid #ccc", borderRadius: 2, cursor: "pointer" }}>
                  없음
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label className="word-dialog-label">채우기 색</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 24px)", gap: 3, marginBottom: 12 }}>
              {PARAGRAPH_SHADING_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setShadingColor(c)}
                  style={{
                    width: 24, height: 24, background: c, border: shadingColor === c ? "2px solid #3b82f6" : "1px solid #ddd",
                    borderRadius: 2, cursor: "pointer",
                  }} />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <label className="word-dialog-label" style={{ marginBottom: 0 }}>사용자 지정:</label>
              <input type="color" value={shadingColor || "#ffffff"} onChange={e => setShadingColor(e.target.value)}
                style={{ width: 40, height: 24, border: "1px solid #ccc", cursor: "pointer" }} />
              <button type="button" onClick={() => setShadingColor("")}
                style={{ padding: "2px 8px", fontSize: 11, border: "1px solid #ccc", borderRadius: 2, cursor: "pointer" }}>
                없음
              </button>
            </div>
            {/* 미리보기 */}
            <div style={{ marginTop: 16 }}>
              <label className="word-dialog-label">미리 보기</label>
              <div style={{
                padding: 12, background: shadingColor || "#fff",
                border: "1px solid #ddd", borderRadius: 3, minHeight: 40,
                fontSize: 12, color: "#333",
              }}>
                이 단락에 음영이 적용됩니다. 가나다라마바사 아자차카타파하.
              </div>
            </div>
          </div>
        )}
      </div>
    </DialogShell>
  );
}

/* ══════════════════════ 표 속성 다이얼로그 ══════════════════════ */
export function TablePropertiesDialog({ editor, onClose }) {
  const [tab, setTab] = useState("table");
  const [tableWidth, setTableWidth] = useState("100");
  const [tableAlign, setTableAlign] = useState("left");
  const [cellPadding, setCellPadding] = useState("6");
  const [selectedStyle, setSelectedStyle] = useState("plain");

  const handleOk = () => {
    // 표 스타일 적용은 CSS 클래스로 처리
    onClose();
  };

  return (
    <DialogShell title="표 속성" onClose={onClose} onOk={handleOk} width={560}>
      <div className="word-dialog-tabs">
        <button className={`word-dialog-tab${tab === "table" ? " active" : ""}`} onClick={() => setTab("table")}>표</button>
        <button className={`word-dialog-tab${tab === "style" ? " active" : ""}`} onClick={() => setTab("style")}>스타일</button>
        <button className={`word-dialog-tab${tab === "cell" ? " active" : ""}`} onClick={() => setTab("cell")}>셀</button>
      </div>
      <div style={{ padding: 16 }}>
        {tab === "table" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 16 }}>
              <div>
                <label className="word-dialog-label">너비 (%)</label>
                <input className="word-dialog-input" type="number" min={10} max={100} value={tableWidth}
                  onChange={e => setTableWidth(e.target.value)} style={{ width: 80 }} />
              </div>
              <div>
                <label className="word-dialog-label">맞춤</label>
                <select className="word-dialog-input" value={tableAlign} onChange={e => setTableAlign(e.target.value)} style={{ width: 100 }}>
                  <option value="left">왼쪽</option>
                  <option value="center">가운데</option>
                  <option value="right">오른쪽</option>
                </select>
              </div>
            </div>
            <div>
              <label className="word-dialog-label">셀 안쪽 여백 (px)</label>
              <input className="word-dialog-input" type="number" min={0} max={20} value={cellPadding}
                onChange={e => setCellPadding(e.target.value)} style={{ width: 80 }} />
            </div>
          </div>
        )}
        {tab === "style" && (
          <div>
            <label className="word-dialog-label">표 스타일 선택</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, maxHeight: 280, overflowY: "auto" }}>
              {TABLE_STYLES.map(s => (
                <button key={s.id} type="button" onClick={() => setSelectedStyle(s.id)}
                  style={{
                    padding: 8, border: selectedStyle === s.id ? "2px solid #3b82f6" : "1px solid #ddd",
                    borderRadius: 4, cursor: "pointer", background: "#fff", textAlign: "left",
                  }}>
                  {/* 미니 표 미리보기 */}
                  <div style={{ fontSize: 8, marginBottom: 4, display: "flex", flexDirection: "column", gap: 1 }}>
                    <div style={{ background: s.headerBg || "#f1f5f9", color: s.headerColor || "#333", padding: "2px 4px", borderRadius: 1, borderBottom: s.headerBorderBottom || "none" }}>
                      헤더
                    </div>
                    <div style={{ background: s.stripedBg || "#fff", padding: "2px 4px", borderRadius: 1 }}>행 1</div>
                    <div style={{ padding: "2px 4px" }}>행 2</div>
                  </div>
                  <div style={{ fontSize: 10, color: "#555" }}>{s.label}</div>
                </button>
              ))}
            </div>
          </div>
        )}
        {tab === "cell" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <div>
                <label className="word-dialog-label">셀 너비</label>
                <input className="word-dialog-input" type="text" placeholder="자동" style={{ width: 80 }} />
              </div>
              <div>
                <label className="word-dialog-label">세로 맞춤</label>
                <select className="word-dialog-input" style={{ width: 100 }}>
                  <option value="top">위쪽</option>
                  <option value="middle">가운데</option>
                  <option value="bottom">아래쪽</option>
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className="word-dialog-btn"
                onClick={() => editor?.chain().focus().mergeCells().run()}>
                셀 병합
              </button>
              <button type="button" className="word-dialog-btn"
                onClick={() => editor?.chain().focus().splitCell().run()}>
                셀 분할
              </button>
            </div>
          </div>
        )}
      </div>
    </DialogShell>
  );
}

/* ══════════════════════ 북마크 다이얼로그 ══════════════════════ */
export function BookmarkDialog({ editor, onClose }) {
  const [bookmarkName, setBookmarkName] = useState("");
  const [bookmarks, setBookmarks] = useState([]);

  // 문서 내 북마크 목록 수집
  useEffect(() => {
    if (!editor) return;
    const list = [];
    editor.state.doc.descendants((node) => {
      if (node.type.name === "bookmark") {
        list.push({ id: node.attrs.bookmarkId, name: node.attrs.bookmarkName });
      }
    });
    setBookmarks(list);
  }, [editor]);

  const handleAdd = () => {
    if (!bookmarkName.trim() || !editor) return;
    editor.chain().focus().setBookmark(bookmarkName.trim()).run();
    onClose();
  };

  const handleDelete = (name) => {
    if (!editor) return;
    editor.chain().focus().removeBookmark(name).run();
    setBookmarks(prev => prev.filter(b => b.name !== name));
  };

  const handleGoTo = (name) => {
    if (!editor) return;
    // 북마크 위치로 이동
    let targetPos = null;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "bookmark" && node.attrs.bookmarkName === name) {
        targetPos = pos;
      }
    });
    if (targetPos !== null) {
      editor.chain().focus().setTextSelection(targetPos).run();
    }
  };

  return (
    <DialogShell title="책갈피" onClose={onClose} onOk={handleAdd} width={400}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label className="word-dialog-label">책갈피 이름</label>
          <input className="word-dialog-input" value={bookmarkName}
            onChange={e => setBookmarkName(e.target.value)}
            placeholder="새 책갈피 이름 입력..." autoFocus />
        </div>
        {bookmarks.length > 0 && (
          <div>
            <label className="word-dialog-label">문서 내 책갈피</label>
            <div style={{ border: "1px solid #ccc", borderRadius: 3, maxHeight: 160, overflowY: "auto" }}>
              {bookmarks.map(b => (
                <div key={b.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "6px 8px", borderBottom: "1px solid #eee", fontSize: 12,
                }}>
                  <span style={{ cursor: "pointer", color: "#3b82f6" }} onClick={() => handleGoTo(b.name)}>
                    {b.name}
                  </span>
                  <button type="button" onClick={() => handleDelete(b.name)}
                    style={{ border: "none", background: "transparent", cursor: "pointer", color: "#ef4444", fontSize: 11 }}>
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DialogShell>
  );
}

/* ══════════════════════ 상호 참조 다이얼로그 ══════════════════════ */
export function CrossReferenceDialog({ editor, onClose }) {
  const [refType, setRefType] = useState("heading");
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");

  // 문서 내 참조 가능 항목 수집
  useEffect(() => {
    if (!editor) return;
    const list = [];
    editor.state.doc.descendants((node) => {
      if (refType === "heading" && node.type.name === "heading") {
        list.push({ text: node.textContent, type: `제목 ${node.attrs.level}` });
      } else if (refType === "bookmark" && node.type.name === "bookmark") {
        list.push({ text: node.attrs.bookmarkName, type: "책갈피" });
      } else if (refType === "table" && node.type.name === "table") {
        list.push({ text: "표", type: "표" });
      }
    });
    setItems(list);
  }, [editor, refType]);

  const handleOk = () => {
    if (!selectedItem || !editor) { onClose(); return; }
    const item = items[parseInt(selectedItem)];
    if (item) {
      editor.chain().focus().insertContent(
        `<span style="color:#3b82f6;text-decoration:underline;cursor:pointer;">${item.text}</span>`
      ).run();
    }
    onClose();
  };

  return (
    <DialogShell title="상호 참조" onClose={onClose} onOk={handleOk} width={460}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label className="word-dialog-label">참조 유형</label>
          <select className="word-dialog-input" value={refType} onChange={e => setRefType(e.target.value)}>
            <option value="heading">제목</option>
            <option value="bookmark">책갈피</option>
            <option value="table">표</option>
          </select>
        </div>
        <div>
          <label className="word-dialog-label">참조할 항목</label>
          <div style={{ border: "1px solid #ccc", borderRadius: 3, maxHeight: 200, overflowY: "auto" }}>
            {items.length === 0 && (
              <div style={{ padding: 12, color: "#999", fontSize: 12, textAlign: "center" }}>
                항목이 없습니다
              </div>
            )}
            {items.map((item, i) => (
              <button key={i} type="button" onClick={() => setSelectedItem(String(i))}
                style={{
                  display: "block", width: "100%", padding: "6px 8px", border: "none",
                  background: selectedItem === String(i) ? "#dbeafe" : "transparent",
                  textAlign: "left", cursor: "pointer", fontSize: 12,
                  borderBottom: "1px solid #eee",
                }}>
                <span style={{ color: "#888", fontSize: 10, marginRight: 8 }}>[{item.type}]</span>
                {item.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </DialogShell>
  );
}

/* ══════════════════════ 페이지 테두리 다이얼로그 ══════════════════════ */
export function PageBorderDialog({ pageBorder, setPageBorder, onClose }) {
  const [style, setStyle] = useState(pageBorder?.style || "none");
  const [width, setWidth] = useState(pageBorder?.width || 1);
  const [color, setColor] = useState(pageBorder?.color || "#333");
  const [preset, setPreset] = useState(pageBorder?.preset || "box");

  const handleOk = () => {
    setPageBorder(style === "none" ? null : { style, width, color, preset });
    onClose();
  };

  return (
    <DialogShell title="페이지 테두리" onClose={onClose} onOk={handleOk} width={480}>
      <div style={{ display: "flex", gap: 24 }}>
        <div style={{ flex: 1 }}>
          <label className="word-dialog-label">설정</label>
          <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
            {PAGE_BORDER_STYLES.map(p => (
              <button key={p.id} type="button" onClick={() => { setPreset(p.id); setStyle(p.style); }}
                style={{
                  padding: "6px 12px", border: preset === p.id ? "2px solid #3b82f6" : "1px solid #ccc",
                  borderRadius: 3, cursor: "pointer", background: "#fff", fontSize: 11,
                }}>
                {p.label}
              </button>
            ))}
          </div>
          <label className="word-dialog-label">스타일</label>
          <select className="word-dialog-input" value={style} onChange={e => setStyle(e.target.value)} style={{ marginBottom: 8 }}>
            {BORDER_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <label className="word-dialog-label">색</label>
          <input type="color" value={color} onChange={e => setColor(e.target.value)}
            style={{ width: 50, height: 24, border: "1px solid #ccc", cursor: "pointer", marginBottom: 8 }} />
          <label className="word-dialog-label">너비</label>
          <select className="word-dialog-input" value={width} onChange={e => setWidth(parseFloat(e.target.value))} style={{ width: 80 }}>
            {BORDER_WIDTHS.map(w => <option key={w} value={w}>{w}px</option>)}
          </select>
        </div>
        {/* 미리보기 */}
        <div style={{ width: 160 }}>
          <label className="word-dialog-label">미리 보기</label>
          <div style={{
            width: 120, height: 160, margin: "0 auto",
            border: style !== "none" ? `${width}px ${style} ${color}` : "1px solid #ddd",
            borderRadius: 3, background: "#fff",
            boxShadow: preset === "shadow" ? "3px 3px 6px rgba(0,0,0,0.2)" : "none",
          }} />
        </div>
      </div>
    </DialogShell>
  );
}

/* ══════════════════════ 워터마크 설정 다이얼로그 ══════════════════════ */
export function WatermarkDialog({ watermarkText, setWatermarkText, onClose }) {
  const [text, setText] = useState(watermarkText || "");
  const [font, setFont] = useState("맑은 고딕");
  const [fontSize, setFontSize] = useState(60);
  const [color, setColor] = useState("#cccccc");
  const [diagonal, setDiagonal] = useState(true);

  const handleOk = () => {
    setWatermarkText(text);
    onClose();
  };

  return (
    <DialogShell title="워터마크" onClose={onClose} onOk={handleOk} width={440}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label className="word-dialog-label">워터마크 텍스트</label>
          <input className="word-dialog-input" value={text} onChange={e => setText(e.target.value)} placeholder="워터마크 입력..." />
        </div>
        <div>
          <label className="word-dialog-label">빠른 선택</label>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {WATERMARK_PRESETS.map(p => (
              <button key={p} type="button" onClick={() => setText(p)}
                style={{
                  padding: "3px 10px", fontSize: 11, border: text === p ? "2px solid #3b82f6" : "1px solid #ddd",
                  borderRadius: 3, cursor: "pointer", background: "#fff",
                }}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="word-dialog-label">글꼴 크기</label>
            <input className="word-dialog-input" type="number" min={20} max={150} value={fontSize}
              onChange={e => setFontSize(parseInt(e.target.value))} style={{ width: 80 }} />
          </div>
          <div>
            <label className="word-dialog-label">색</label>
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              style={{ width: 40, height: 24, border: "1px solid #ccc", cursor: "pointer" }} />
          </div>
          <div>
            <label className="word-dialog-label">방향</label>
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={diagonal} onChange={e => setDiagonal(e.target.checked)} />
              대각선
            </label>
          </div>
        </div>
        {/* 미리보기 */}
        <div style={{
          width: "100%", height: 100, border: "1px solid #ddd", borderRadius: 3,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "#fff", overflow: "hidden", position: "relative",
        }}>
          <span style={{
            fontSize: fontSize * 0.4, fontFamily: font, color, opacity: 0.5,
            transform: diagonal ? "rotate(-30deg)" : "none",
            whiteSpace: "nowrap", userSelect: "none",
          }}>
            {text || "미리 보기"}
          </span>
        </div>
      </div>
    </DialogShell>
  );
}
