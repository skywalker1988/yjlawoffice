/**
 * DocModals — 문서 상세 에디터 모달 컴포넌트
 * 찾기/바꾸기, 표 삽입, 이미지 삽입, 링크 삽입, 기호 삽입, 단어 개수
 */
import { Modal } from "./DocDetailUI";
import { SYMBOLS } from "./docDetailConstants";

/**
 * 찾기 및 바꾸기 모달
 */
export function FindReplaceModal({ open, onClose, findText, setFindText, replaceText, setReplaceText, onFind, onReplaceAll }) {
  return (
    <Modal open={open} title="찾기 및 바꾸기" onClose={onClose} width={400}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 3 }}>찾기</label>
          <input value={findText} onChange={e => setFindText(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") onFind(); }}
            autoFocus placeholder="검색할 텍스트..."
            style={{ width: "100%", padding: "6px 10px", border: "1px solid #ccc", borderRadius: 3, fontSize: 12, boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 3 }}>바꾸기</label>
          <input value={replaceText} onChange={e => setReplaceText(e.target.value)}
            placeholder="바꿀 텍스트..."
            style={{ width: "100%", padding: "6px 10px", border: "1px solid #ccc", borderRadius: 3, fontSize: 12, boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <button onClick={onFind} style={{ padding: "5px 14px", border: "1px solid #2b579a", borderRadius: 3, background: "#2b579a", color: "#fff", fontSize: 11, cursor: "pointer" }}>찾기</button>
          <button onClick={onReplaceAll} style={{ padding: "5px 14px", border: "1px solid #ccc", borderRadius: 3, background: "#fff", color: "#333", fontSize: 11, cursor: "pointer" }}>모두 바꾸기</button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * 표 삽입 모달
 */
export function TableInsertModal({ open, onClose, tableRows, setTableRows, tableCols, setTableCols, onInsert }) {
  return (
    <Modal open={open} title="표 삽입" onClose={onClose} width={320}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 16 }}>
          <div>
            <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 3 }}>행 수</label>
            <input type="number" value={tableRows} onChange={e => setTableRows(+e.target.value)} min={1} max={20}
              style={{ width: 60, padding: "4px 8px", border: "1px solid #ccc", borderRadius: 3, fontSize: 12 }} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 3 }}>열 수</label>
            <input type="number" value={tableCols} onChange={e => setTableCols(+e.target.value)} min={1} max={10}
              style={{ width: 60, padding: "4px 8px", border: "1px solid #ccc", borderRadius: 3, fontSize: 12 }} />
          </div>
        </div>
        {/* 빠른 격자 선택 */}
        <div>
          <p style={{ fontSize: 9, color: "#888", marginBottom: 4 }}>빠른 선택 (클릭하여 삽입)</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 2 }}>
            {Array.from({ length: 48 }, (_, i) => {
              const r = Math.floor(i / 8) + 1, c = (i % 8) + 1;
              return (
                <div key={i}
                  onMouseEnter={() => { setTableRows(r); setTableCols(c); }}
                  onClick={() => { setTableRows(r); setTableCols(c); onInsert(); }}
                  style={{
                    width: 16, height: 16, border: "1px solid #ccc", borderRadius: 1, cursor: "pointer",
                    background: r <= tableRows && c <= tableCols ? "#2b579a" : "#fff",
                    transition: "background 0.1s",
                  }} />
              );
            })}
          </div>
          <p style={{ fontSize: 9, color: "#666", marginTop: 4 }}>{tableRows} x {tableCols} 표</p>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onInsert} style={{ padding: "5px 14px", border: "none", borderRadius: 3, background: "#2b579a", color: "#fff", fontSize: 11, cursor: "pointer" }}>삽입</button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * 이미지 삽입 모달
 */
export function ImageInsertModal({ open, onClose, imageUrl, setImageUrl, onInsert, fileInputRef, onFileChange }) {
  return (
    <Modal open={open} title="그림 삽입" onClose={onClose} width={400}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 3 }}>이미지 URL</label>
          <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..."
            style={{ width: "100%", padding: "6px 10px", border: "1px solid #ccc", borderRadius: 3, fontSize: 12, boxSizing: "border-box" }} />
        </div>
        <div style={{ textAlign: "center", padding: "8px 0", color: "#999", fontSize: 10 }}>또는</div>
        <button onClick={() => fileInputRef.current?.click()}
          style={{ padding: "8px 0", border: "2px dashed #ccc", borderRadius: 4, background: "#fafafa", cursor: "pointer", fontSize: 11, color: "#666" }}>
          &#x1F4C1; 파일에서 선택
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} style={{ display: "none" }} />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={onInsert} disabled={!imageUrl} style={{ padding: "5px 14px", border: "none", borderRadius: 3, background: imageUrl ? "#2b579a" : "#ccc", color: "#fff", fontSize: 11, cursor: imageUrl ? "pointer" : "default" }}>삽입</button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * 링크 삽입 모달
 */
export function LinkInsertModal({ open, onClose, linkUrl, setLinkUrl, linkLabel, setLinkLabel, onInsert, onRemove }) {
  return (
    <Modal open={open} title="링크 삽입" onClose={onClose} width={380}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div>
          <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 3 }}>표시 텍스트</label>
          <input value={linkLabel} onChange={e => setLinkLabel(e.target.value)} placeholder="링크 텍스트 (선택사항)"
            style={{ width: "100%", padding: "6px 10px", border: "1px solid #ccc", borderRadius: 3, fontSize: 12, boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: 10, color: "#666", display: "block", marginBottom: 3 }}>URL</label>
          <input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..."
            style={{ width: "100%", padding: "6px 10px", border: "1px solid #ccc", borderRadius: 3, fontSize: 12, boxSizing: "border-box" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
          <button onClick={onRemove}
            style={{ padding: "5px 14px", border: "1px solid #ccc", borderRadius: 3, background: "#fff", color: "#333", fontSize: 11, cursor: "pointer" }}>링크 제거</button>
          <button onClick={onInsert} disabled={!linkUrl}
            style={{ padding: "5px 14px", border: "none", borderRadius: 3, background: linkUrl ? "#2b579a" : "#ccc", color: "#fff", fontSize: 11, cursor: linkUrl ? "pointer" : "default" }}>삽입</button>
        </div>
      </div>
    </Modal>
  );
}

/**
 * 단어 개수 모달
 */
export function WordCountModal({ open, onClose, stats, editor }) {
  return (
    <Modal open={open} title="단어 개수" onClose={onClose} width={300}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {[
          { label: "페이지", value: stats.pages },
          { label: "단어", value: stats.words },
          { label: "문자 (공백 포함)", value: stats.chars },
          { label: "문자 (공백 제외)", value: (editor?.state?.doc?.textContent || "").replace(/\s/g, "").length },
          { label: "단락", value: editor?.getJSON()?.content?.length || 0 },
        ].map(row => (
          <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f0f0f0" }}>
            <span style={{ fontSize: 11, color: "#555" }}>{row.label}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#1a1a1a" }}>{row.value.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/**
 * 기호 삽입 모달
 */
export function SymbolInsertModal({ open, onClose, editor }) {
  return (
    <Modal open={open} title="기호 삽입" onClose={onClose} width={360}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: 4 }}>
        {SYMBOLS.map(sym => (
          <button key={sym} onClick={() => { editor?.chain().focus().insertContent(sym).run(); onClose(); }}
            className="word-rb"
            style={{ width: 28, height: 28, border: "1px solid #ddd", borderRadius: 2, background: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {sym}
          </button>
        ))}
      </div>
    </Modal>
  );
}
