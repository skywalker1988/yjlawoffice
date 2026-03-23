/**
 * MS Word-style Dialog Modals
 * 글꼴, 단락, 페이지 설정, 하이퍼링크, 표 속성, 찾기/바꾸기
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { FONT_LIST, FONT_SIZES, LINE_SPACINGS, MARGIN_PRESETS, PAGE_SIZES, TEXT_COLORS } from "./constants";
import { ColorGrid } from "./RibbonParts";

/* ── Dialog Shell ── */
function DialogShell({ title, onClose, children, width = 480 }) {
  return (
    <div className="word-dialog-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="word-dialog" style={{ width }}>
        <div className="word-dialog-title">
          <span>{title}</span>
          <button type="button" onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 16, cursor: "pointer", color: "#888", padding: "0 4px" }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════ FONT DIALOG ══════════════════════════════ */
export function FontDialog({ editor, onClose }) {
  const [font, setFont] = useState("malgun");
  const [size, setSize] = useState("11");
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [strike, setStrike] = useState(false);
  const [color, setColor] = useState("#000000");

  useEffect(() => {
    if (!editor) return;
    const attrs = editor.getAttributes("textStyle");
    if (attrs.fontFamily) {
      const found = FONT_LIST.find(f => attrs.fontFamily.includes(f.label));
      if (found) setFont(found.value);
    }
    if (attrs.fontSize) setSize(attrs.fontSize.replace("pt", ""));
    if (attrs.color) setColor(attrs.color);
    setBold(editor.isActive("bold"));
    setItalic(editor.isActive("italic"));
    setUnderline(editor.isActive("underline"));
    setStrike(editor.isActive("strike"));
  }, [editor]);

  const apply = () => {
    if (!editor) return;
    const fontObj = FONT_LIST.find(f => f.value === font);
    let chain = editor.chain().focus();
    if (fontObj) chain = chain.setFontFamily(fontObj.family);
    chain = chain.setFontSize(size + "pt");
    chain = chain.setColor(color);
    // Toggle marks
    if (bold !== editor.isActive("bold")) chain = chain.toggleBold();
    if (italic !== editor.isActive("italic")) chain = chain.toggleItalic();
    if (underline !== editor.isActive("underline")) chain = chain.toggleUnderline();
    if (strike !== editor.isActive("strike")) chain = chain.toggleStrike();
    chain.run();
    onClose();
  };

  const previewStyle = {
    fontFamily: FONT_LIST.find(f => f.value === font)?.family || "sans-serif",
    fontSize: Math.min(parseInt(size) || 11, 24) + "pt",
    fontWeight: bold ? 700 : 400,
    fontStyle: italic ? "italic" : "normal",
    textDecoration: [underline && "underline", strike && "line-through"].filter(Boolean).join(" ") || "none",
    color: color,
    padding: "12px",
    border: "1px solid #ccc",
    borderRadius: 4,
    minHeight: 40,
    textAlign: "center",
  };

  return (
    <DialogShell title="글꼴" onClose={onClose} width={520}>
      <div className="word-dialog-body">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {/* Font family */}
          <div>
            <label className="word-dialog-label">글꼴(F):</label>
            <select className="word-dialog-input" value={font} onChange={e => setFont(e.target.value)}>
              {FONT_LIST.map(f => (
                <option key={f.value} value={f.value} style={{ fontFamily: f.family }}>{f.label}</option>
              ))}
            </select>
          </div>
          {/* Font style */}
          <div>
            <label className="word-dialog-label">글꼴 스타일(Y):</label>
            <select className="word-dialog-input" value={`${bold ? "bold" : ""}${italic ? "italic" : ""}` || "normal"} onChange={e => {
              const v = e.target.value;
              setBold(v.includes("bold"));
              setItalic(v.includes("italic"));
            }}>
              <option value="normal">보통</option>
              <option value="italic">기울임꼴</option>
              <option value="bold">굵게</option>
              <option value="bolditalic">굵은 기울임꼴</option>
            </select>
          </div>
          {/* Font size */}
          <div>
            <label className="word-dialog-label">크기(S):</label>
            <select className="word-dialog-input" value={size} onChange={e => setSize(e.target.value)}>
              {FONT_SIZES.map(s => <option key={s} value={String(s)}>{s}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 16, alignItems: "center" }}>
          <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
            <input type="checkbox" checked={underline} onChange={e => setUnderline(e.target.checked)} /> 밑줄
          </label>
          <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
            <input type="checkbox" checked={strike} onChange={e => setStrike(e.target.checked)} /> 취소선
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 12 }}>글꼴 색:</span>
            <input type="color" value={color} onChange={e => setColor(e.target.value)}
              style={{ width: 28, height: 22, padding: 0, border: "1px solid #ccc", cursor: "pointer" }} />
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label className="word-dialog-label">미리 보기:</label>
          <div style={previewStyle}>가나다라 AaBbCcYyZz 0123</div>
        </div>
      </div>
      <div className="word-dialog-footer">
        <button className="word-dialog-btn" onClick={onClose}>취소</button>
        <button className="word-dialog-btn primary" onClick={apply}>확인</button>
      </div>
    </DialogShell>
  );
}

/* ══════════════════════════════ PARAGRAPH DIALOG ══════════════════════════════ */
export function ParagraphDialog({ editor, onClose }) {
  const [align, setAlign] = useState("left");
  const [lineSpacing, setLineSpacing] = useState("1.75");
  const [spacingBefore, setSpacingBefore] = useState("0");
  const [spacingAfter, setSpacingAfter] = useState("8");
  const [indent, setIndent] = useState("0");
  const [dialogTab, setDialogTab] = useState("indents");

  useEffect(() => {
    if (!editor) return;
    const node = editor.state.selection.$from.parent;
    if (node.attrs.textAlign) setAlign(node.attrs.textAlign);
    if (node.attrs.lineSpacing) setLineSpacing(node.attrs.lineSpacing);
    if (node.attrs.indent) setIndent(String(node.attrs.indent));
  }, [editor]);

  const apply = () => {
    if (!editor) return;
    // Apply alignment and line spacing
    editor.chain().focus()
      .setTextAlign(align)
      .setLineSpacing(lineSpacing)
      .run();
    // Apply paragraph spacing
    if (spacingBefore !== "0") {
      editor.commands.setSpacingBefore(spacingBefore + "pt");
    }
    if (spacingAfter !== "0") {
      editor.commands.setSpacingAfter(spacingAfter + "pt");
    }
    // Apply indent: first reset, then apply desired level
    const currentNode = editor.state.selection.$from.parent;
    const currentIndent = currentNode.attrs.indent || 0;
    const targetIndent = parseInt(indent) || 0;
    const diff = targetIndent - currentIndent;
    if (diff > 0) {
      for (let i = 0; i < diff; i++) editor.commands.increaseIndent();
    } else if (diff < 0) {
      for (let i = 0; i < Math.abs(diff); i++) editor.commands.decreaseIndent();
    }
    onClose();
  };

  return (
    <DialogShell title="단락" onClose={onClose} width={480}>
      <div className="word-dialog-tabs">
        <button className={`word-dialog-tab${dialogTab === "indents" ? " active" : ""}`} onClick={() => setDialogTab("indents")}>들여쓰기 및 간격</button>
        <button className={`word-dialog-tab${dialogTab === "linebreak" ? " active" : ""}`} onClick={() => setDialogTab("linebreak")}>줄 및 페이지 나누기</button>
      </div>
      <div className="word-dialog-body">
        {dialogTab === "indents" && (
          <>
            <div style={{ marginBottom: 12 }}>
              <label className="word-dialog-label">맞춤(A):</label>
              <select className="word-dialog-input" style={{ width: 160 }} value={align} onChange={e => setAlign(e.target.value)}>
                <option value="left">왼쪽</option>
                <option value="center">가운데</option>
                <option value="right">오른쪽</option>
                <option value="justify">양쪽</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label className="word-dialog-label">왼쪽 들여쓰기(L):</label>
                <select className="word-dialog-input" value={indent} onChange={e => setIndent(e.target.value)}>
                  {[0, 1, 2, 3, 4, 5].map(v => <option key={v} value={String(v)}>{v * 40}px ({v}단계)</option>)}
                </select>
              </div>
              <div>
                <label className="word-dialog-label">줄 간격(N):</label>
                <select className="word-dialog-input" value={lineSpacing} onChange={e => setLineSpacing(e.target.value)}>
                  {LINE_SPACINGS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  <option value="1.75">1.75 (기본)</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label className="word-dialog-label">단락 앞(B):</label>
                <select className="word-dialog-input" value={spacingBefore} onChange={e => setSpacingBefore(e.target.value)}>
                  {["0", "6", "8", "12", "18", "24"].map(v => <option key={v} value={v}>{v}pt</option>)}
                </select>
              </div>
              <div>
                <label className="word-dialog-label">단락 뒤(F):</label>
                <select className="word-dialog-input" value={spacingAfter} onChange={e => setSpacingAfter(e.target.value)}>
                  {["0", "6", "8", "12", "18", "24"].map(v => <option key={v} value={v}>{v}pt</option>)}
                </select>
              </div>
            </div>
          </>
        )}
        {dialogTab === "linebreak" && (
          <div style={{ fontSize: 12, color: "#555" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, cursor: "pointer" }}>
              <input type="checkbox" /> 과부 보호(W)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, cursor: "pointer" }}>
              <input type="checkbox" /> 이전 단락과 함께(K)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, cursor: "pointer" }}>
              <input type="checkbox" /> 단락 앞에서 나누기(B)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" /> 단락에서 줄 나누지 않기(D)
            </label>
          </div>
        )}
      </div>
      <div className="word-dialog-footer">
        <button className="word-dialog-btn" onClick={onClose}>취소</button>
        <button className="word-dialog-btn primary" onClick={apply}>확인</button>
      </div>
    </DialogShell>
  );
}

/* ══════════════════════════════ PAGE SETUP DIALOG ══════════════════════════════ */
export function PageSetupDialog({ margins, setMargins, orientation, setOrientation, pageSize, setPageSize, customMargins, setCustomMargins, onClose }) {
  const [dialogTab, setDialogTab] = useState("margins");
  // Local state for custom margin inputs (in mm, converted to px at 96dpi: 1mm ≈ 3.78px)
  const mmToPx = (mm) => Math.round(mm * 3.78);
  const pxToMm = (px) => Math.round(px / 3.78 * 10) / 10;

  const currentPreset = MARGIN_PRESETS.find(m => m.value === margins);
  const [localMargins, setLocalMargins] = useState({
    top: pxToMm(customMargins?.top ?? currentPreset?.top ?? 96),
    bottom: pxToMm(customMargins?.bottom ?? currentPreset?.bottom ?? 96),
    left: pxToMm(customMargins?.left ?? currentPreset?.left ?? 120),
    right: pxToMm(customMargins?.right ?? currentPreset?.right ?? 120),
  });

  const applyCustomMargins = () => {
    const px = {
      top: mmToPx(localMargins.top),
      bottom: mmToPx(localMargins.bottom),
      left: mmToPx(localMargins.left),
      right: mmToPx(localMargins.right),
    };
    setCustomMargins?.(px);
    setMargins("custom");
    onClose();
  };

  const marginField = (label, key) => (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <label style={{ fontSize: 12, color: "#444", width: 40 }}>{label}:</label>
      <input type="number" step="0.1" min="0" max="100"
        className="word-dialog-input"
        value={localMargins[key]}
        onChange={(e) => setLocalMargins(prev => ({ ...prev, [key]: parseFloat(e.target.value) || 0 }))}
        style={{ width: 80 }} />
      <span style={{ fontSize: 11, color: "#888" }}>mm</span>
    </div>
  );

  return (
    <DialogShell title="페이지 설정" onClose={onClose} width={480}>
      <div className="word-dialog-tabs">
        <button className={`word-dialog-tab${dialogTab === "margins" ? " active" : ""}`} onClick={() => setDialogTab("margins")}>여백</button>
        <button className={`word-dialog-tab${dialogTab === "paper" ? " active" : ""}`} onClick={() => setDialogTab("paper")}>용지</button>
        <button className={`word-dialog-tab${dialogTab === "layout" ? " active" : ""}`} onClick={() => setDialogTab("layout")}>레이아웃</button>
      </div>
      <div className="word-dialog-body">
        {dialogTab === "margins" && (
          <>
            <div style={{ marginBottom: 16 }}>
              <label className="word-dialog-label">여백 사전 설정:</label>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                {MARGIN_PRESETS.map(m => (
                  <button key={m.value} type="button"
                    onClick={() => {
                      setMargins(m.value);
                      setLocalMargins({
                        top: pxToMm(m.top), bottom: pxToMm(m.bottom),
                        left: pxToMm(m.left), right: pxToMm(m.right),
                      });
                    }}
                    style={{
                      padding: "8px 12px", fontSize: 11, border: margins === m.value ? "2px solid #0078d4" : "1px solid #ccc",
                      borderRadius: 3, background: margins === m.value ? "#eff6ff" : "#fff", cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", flex: 1,
                    }}>
                    <span style={{ fontWeight: 600 }}>{m.label}</span>
                    <span style={{ fontSize: 9, color: "#888", marginTop: 2 }}>{m.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom margin inputs */}
            <div style={{ marginBottom: 16 }}>
              <label className="word-dialog-label" style={{ marginBottom: 8 }}>사용자 지정 여백:</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 24px", padding: "12px", background: "#f9f9f9", borderRadius: 4, border: "1px solid #eee" }}>
                {marginField("위", "top")}
                {marginField("아래", "bottom")}
                {marginField("왼쪽", "left")}
                {marginField("오른쪽", "right")}
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label className="word-dialog-label">방향:</label>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button type="button" onClick={() => setOrientation("portrait")}
                  style={{
                    padding: "8px 16px", border: orientation === "portrait" ? "2px solid #0078d4" : "1px solid #ccc",
                    borderRadius: 3, background: orientation === "portrait" ? "#eff6ff" : "#fff", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                  <span style={{ fontSize: 20 }}>▯</span> 세로
                </button>
                <button type="button" onClick={() => setOrientation("landscape")}
                  style={{
                    padding: "8px 16px", border: orientation === "landscape" ? "2px solid #0078d4" : "1px solid #ccc",
                    borderRadius: 3, background: orientation === "landscape" ? "#eff6ff" : "#fff", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                  <span style={{ fontSize: 20, transform: "rotate(90deg)", display: "inline-block" }}>▯</span> 가로
                </button>
              </div>
            </div>
          </>
        )}
        {dialogTab === "paper" && (
          <div>
            <label className="word-dialog-label">용지 크기:</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
              {PAGE_SIZES.map(p => (
                <button key={p.value} type="button"
                  onClick={() => setPageSize(p.value)}
                  style={{
                    padding: "8px 12px", border: pageSize === p.value ? "2px solid #0078d4" : "1px solid #ccc",
                    borderRadius: 3, background: pageSize === p.value ? "#eff6ff" : "#fff", cursor: "pointer",
                    textAlign: "left", display: "flex", justifyContent: "space-between",
                  }}>
                  <span style={{ fontWeight: 500 }}>{p.label}</span>
                  <span style={{ fontSize: 11, color: "#888" }}>{p.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        {dialogTab === "layout" && (
          <div style={{ fontSize: 12, color: "#555" }}>
            <div style={{ marginBottom: 12 }}>
              <label className="word-dialog-label">머리글 위치:</label>
              <input type="text" className="word-dialog-input" defaultValue="12.5 mm" style={{ width: 100 }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="word-dialog-label">바닥글 위치:</label>
              <input type="text" className="word-dialog-input" defaultValue="12.5 mm" style={{ width: 100 }} />
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" /> 첫 페이지 다르게
            </label>
          </div>
        )}
      </div>
      <div className="word-dialog-footer">
        <button className="word-dialog-btn" onClick={onClose}>취소</button>
        <button className="word-dialog-btn primary" onClick={applyCustomMargins}>확인</button>
      </div>
    </DialogShell>
  );
}

/* ══════════════════════════════ HYPERLINK DIALOG ══════════════════════════════ */
export function HyperlinkDialog({ editor, onClose }) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");

  useEffect(() => {
    if (!editor) return;
    const attrs = editor.getAttributes("link");
    if (attrs.href) setUrl(attrs.href);
    const { from, to } = editor.state.selection;
    if (from !== to) {
      setText(editor.state.doc.textBetween(from, to));
    }
  }, [editor]);

  const apply = () => {
    if (!editor) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
    } else {
      if (text && editor.state.selection.empty) {
        editor.chain().focus()
          .insertContent(`<a href="${url}">${text}</a>`)
          .run();
      } else {
        editor.chain().focus()
          .extendMarkRange("link")
          .setLink({ href: url })
          .run();
      }
    }
    onClose();
  };

  return (
    <DialogShell title="하이퍼링크 삽입" onClose={onClose} width={440}>
      <div className="word-dialog-body">
        <div style={{ marginBottom: 12 }}>
          <label className="word-dialog-label">표시할 텍스트(T):</label>
          <input className="word-dialog-input" value={text} onChange={e => setText(e.target.value)} placeholder="링크 텍스트" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label className="word-dialog-label">주소(A):</label>
          <input className="word-dialog-input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://" autoFocus />
        </div>
        <div style={{ fontSize: 11, color: "#888" }}>
          링크를 제거하려면 주소를 비워두고 확인을 누르세요.
        </div>
      </div>
      <div className="word-dialog-footer">
        <button className="word-dialog-btn" onClick={() => { if (editor) editor.chain().focus().unsetLink().run(); onClose(); }}>링크 제거</button>
        <button className="word-dialog-btn" onClick={onClose}>취소</button>
        <button className="word-dialog-btn primary" onClick={apply}>확인</button>
      </div>
    </DialogShell>
  );
}

/* ══════════════════════════════ TABLE PROPERTIES DIALOG ══════════════════════════════ */
export function TablePropertiesDialog({ editor, onClose }) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);

  return (
    <DialogShell title="표 속성" onClose={onClose} width={400}>
      <div className="word-dialog-body">
        {editor?.isActive("table") ? (
          <>
            <div style={{ fontSize: 12, marginBottom: 12 }}>현재 표가 선택되어 있습니다.</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="word-dialog-btn" onClick={() => { editor.chain().focus().addRowAfter().run(); }}>행 추가 (아래)</button>
              <button className="word-dialog-btn" onClick={() => { editor.chain().focus().addRowBefore().run(); }}>행 추가 (위)</button>
              <button className="word-dialog-btn" onClick={() => { editor.chain().focus().addColumnAfter().run(); }}>열 추가 (오른쪽)</button>
              <button className="word-dialog-btn" onClick={() => { editor.chain().focus().addColumnBefore().run(); }}>열 추가 (왼쪽)</button>
              <button className="word-dialog-btn" onClick={() => { editor.chain().focus().deleteRow().run(); }}>행 삭제</button>
              <button className="word-dialog-btn" onClick={() => { editor.chain().focus().deleteColumn().run(); }}>열 삭제</button>
              <button className="word-dialog-btn" onClick={() => { editor.chain().focus().mergeCells().run(); }}>셀 병합</button>
              <button className="word-dialog-btn" onClick={() => { editor.chain().focus().splitCell().run(); }}>셀 분할</button>
              <button className="word-dialog-btn" style={{ color: "#c00" }} onClick={() => { editor.chain().focus().deleteTable().run(); onClose(); }}>표 삭제</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <label className="word-dialog-label">행 수:</label>
                <input type="number" className="word-dialog-input" value={rows} onChange={e => setRows(parseInt(e.target.value) || 1)} min={1} max={50} />
              </div>
              <div>
                <label className="word-dialog-label">열 수:</label>
                <input type="number" className="word-dialog-input" value={cols} onChange={e => setCols(parseInt(e.target.value) || 1)} min={1} max={20} />
              </div>
            </div>
            <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <input type="checkbox" defaultChecked /> 머리글 행 포함
            </label>
          </>
        )}
      </div>
      <div className="word-dialog-footer">
        <button className="word-dialog-btn" onClick={onClose}>취소</button>
        {!editor?.isActive("table") && (
          <button className="word-dialog-btn primary" onClick={() => {
            editor?.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
            onClose();
          }}>삽입</button>
        )}
      </div>
    </DialogShell>
  );
}

/* ══════════════════════════════ FIND & REPLACE BAR ══════════════════════════════ */
export function FindReplaceBar({ editor, showReplace, onClose }) {
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doFind = useCallback((text, forward = true) => {
    if (!text) { setMatchCount(0); return; }
    const editorEl = editor?.view?.dom;
    if (!editorEl) return;
    const html = editorEl.innerText || "";
    const flags = caseSensitive ? "g" : "gi";
    const regex = new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
    const matches = html.match(regex);
    setMatchCount(matches ? matches.length : 0);
    window.find(text, caseSensitive, !forward, true, false, true, false);
  }, [editor, caseSensitive]);

  const handleFindNext = () => doFind(findText, true);
  const handleFindPrev = () => doFind(findText, false);

  const handleReplace = () => {
    if (!findText || !editor) return;
    const sel = window.getSelection();
    const selText = sel?.toString() || "";
    const match = caseSensitive ? selText === findText : selText.toLowerCase() === findText.toLowerCase();
    if (match && !editor.state.selection.empty) {
      // Use Tiptap to replace selected text
      editor.chain().focus()
        .insertContentAt(
          { from: editor.state.selection.from, to: editor.state.selection.to },
          replaceText
        )
        .run();
      setTimeout(() => doFind(findText, true), 50);
    } else {
      doFind(findText, true);
    }
  };

  const handleReplaceAll = () => {
    if (!findText || !editor) return;
    const html = editor.getHTML();
    const flags = caseSensitive ? "g" : "gi";
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), flags);
    const newHtml = html.replace(regex, replaceText);
    editor.commands.setContent(newHtml);
    setMatchCount(0);
  };

  const barStyle = {
    display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
    background: "#f8f9fa", borderBottom: "1px solid #d1d5db", flexShrink: 0,
    fontFamily: "'맑은 고딕', sans-serif",
  };
  const inputStyle = {
    padding: "3px 8px", border: "1px solid #c0c0c0", borderRadius: 3,
    fontSize: 11, outline: "none", width: 180,
  };
  const btnStyle = {
    padding: "3px 8px", border: "1px solid #c0c0c0", borderRadius: 3,
    fontSize: 10, background: "#fff", cursor: "pointer",
  };

  return (
    <div>
      <div style={barStyle}>
        <span style={{ fontSize: 11, color: "#555", minWidth: 30 }}>찾기:</span>
        <input
          ref={inputRef}
          type="text" value={findText}
          onChange={e => { setFindText(e.target.value); doFind(e.target.value, true); }}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleFindNext(); } if (e.key === "Escape") onClose(); }}
          placeholder="검색어 입력..."
          style={inputStyle}
        />
        <button type="button" onClick={handleFindPrev} style={btnStyle} title="이전 (Shift+Enter)">▲</button>
        <button type="button" onClick={handleFindNext} style={btnStyle} title="다음 (Enter)">▼</button>
        <label style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 3, cursor: "pointer", color: "#666" }}>
          <input type="checkbox" checked={caseSensitive} onChange={e => setCaseSensitive(e.target.checked)} style={{ width: 12, height: 12 }} />
          대소문자
        </label>
        <span style={{ fontSize: 10, color: "#888" }}>
          {matchCount > 0 ? `${matchCount}개 일치` : findText ? "일치 없음" : ""}
        </span>
        <div style={{ flex: 1 }} />
        <button type="button" onClick={onClose} style={{ ...btnStyle, border: "none", fontSize: 14, color: "#999" }}>✕</button>
      </div>
      {showReplace && (
        <div style={barStyle}>
          <span style={{ fontSize: 11, color: "#555", minWidth: 30 }}>바꾸기:</span>
          <input
            type="text" value={replaceText}
            onChange={e => setReplaceText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleReplace(); } if (e.key === "Escape") onClose(); }}
            placeholder="바꿀 텍스트..."
            style={inputStyle}
          />
          <button type="button" onClick={handleReplace} style={btnStyle}>바꾸기</button>
          <button type="button" onClick={handleReplaceAll} style={btnStyle}>모두 바꾸기</button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════ IMAGE DIALOG ══════════════════════════════ */
export function ImageDialog({ editor, onClose }) {
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const fileInputRef = useRef(null);

  const insertFromUrl = () => {
    if (url) {
      editor?.chain().focus().setImage({ src: url, alt: alt || undefined }).run();
      onClose();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      editor?.chain().focus().setImage({ src: reader.result, alt: file.name }).run();
      onClose();
    };
    reader.readAsDataURL(file);
  };

  return (
    <DialogShell title="그림 삽입" onClose={onClose} width={440}>
      <div className="word-dialog-body">
        <div style={{ marginBottom: 16 }}>
          <label className="word-dialog-label">URL에서 삽입:</label>
          <input className="word-dialog-input" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com/image.jpg" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label className="word-dialog-label">대체 텍스트:</label>
          <input className="word-dialog-input" value={alt} onChange={e => setAlt(e.target.value)} placeholder="이미지 설명" />
        </div>
        <div style={{ borderTop: "1px solid #eee", paddingTop: 12, marginBottom: 12 }}>
          <label className="word-dialog-label">파일에서 업로드:</label>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload}
            style={{ fontSize: 11, marginTop: 4 }} />
        </div>
        <div style={{ fontSize: 11, color: "#888" }}>
          이미지를 에디터에 직접 드래그 앤 드롭할 수도 있습니다.
        </div>
      </div>
      <div className="word-dialog-footer">
        <button className="word-dialog-btn" onClick={onClose}>취소</button>
        <button className="word-dialog-btn primary" onClick={insertFromUrl} disabled={!url}>삽입</button>
      </div>
    </DialogShell>
  );
}
