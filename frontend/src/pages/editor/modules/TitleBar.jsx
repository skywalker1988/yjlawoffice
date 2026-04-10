/**
 * TitleBar — MS Word 365 스타일 상단 제목 표시줄
 * QAT(빠른 실행 도구), 문서 제목, 저장 상태, 문서 속성 버튼
 */
import { memo } from "react";
import { Save, Undo2, Redo2, Settings, Moon, Sun } from "lucide-react";

/**
 * @param {object} props
 * @param {object} props.editor - TipTap 에디터 인스턴스
 * @param {object} props.doc - 문서 객체
 * @param {function} props.setDoc - 문서 업데이트 핸들러
 * @param {React.RefObject} props.titleRef - 제목 입력 필드 ref
 * @param {boolean} props.darkMode - 다크 모드 여부
 * @param {function} props.setDarkMode - 다크 모드 토글
 * @param {string} props.saveStatus - 저장 상태 텍스트
 * @param {function} props.handleSave - 저장 핸들러
 * @param {function} props.setMetaOpen - 문서 속성 드로어 열기
 */
export const TitleBar = memo(function TitleBar({ editor, doc, setDoc, titleRef, darkMode, setDarkMode, saveStatus, handleSave, setMetaOpen }) {
  const qatBtnStyle = {
    background: "none", border: "none", color: "rgba(255,255,255,0.85)",
    cursor: "pointer", padding: "4px 6px", borderRadius: 2,
    display: "flex", alignItems: "center", lineHeight: 1,
  };

  const handleHover = (e) => {
    e.currentTarget.style.background = "rgba(255,255,255,0.18)";
    e.currentTarget.style.color = "#fff";
  };
  const handleLeave = (e) => {
    e.currentTarget.style.background = "none";
    e.currentTarget.style.color = "rgba(255,255,255,0.85)";
  };

  const qatButtons = [
    { icon: <Save size={12} />, title: "저장 (Ctrl+S)", fn: () => handleSave(false) },
    { icon: <Undo2 size={12} />, title: "실행 취소 (Ctrl+Z)", fn: () => editor?.chain().focus().undo().run() },
    { icon: <Redo2 size={12} />, title: "다시 실행 (Ctrl+Y)", fn: () => editor?.chain().focus().redo().run() },
  ];

  /** 저장 상태에 따른 표시 텍스트 */
  const statusText = {
    "저장 중...": "⟳ 저장 중...",
    "저장됨": "✓ 저장됨",
    "로컬 저장됨": "↓ 로컬 저장",
    "수정됨": "● 수정됨",
    "오류": "✕ 오류",
  };

  /** 저장 상태에 따른 색상 */
  const statusColor = saveStatus === "오류" ? "#ff8888"
    : saveStatus === "저장됨" ? "#90EE90"
    : saveStatus === "수정됨" ? "#ffdd57"
    : "rgba(255,255,255,0.7)";

  return (
    <div style={{
      height: 32, background: darkMode ? "#1e1e1e" : "#1a2332", display: "flex", alignItems: "center",
      padding: "0 8px", flexShrink: 0, color: "#fff",
      fontFamily: "'Segoe UI', '맑은 고딕', sans-serif", userSelect: "none",
    }}>
      {/* Quick Access Toolbar (QAT) */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, flexShrink: 0 }}>
        <div style={{ width: 16, height: 16, marginRight: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: -1 }}>W</span>
        </div>
        {qatButtons.map((btn, i) => (
          <button key={i} type="button" onClick={btn.fn} title={btn.title}
            style={qatBtnStyle}
            onMouseEnter={handleHover}
            onMouseLeave={handleLeave}>{btn.icon}</button>
        ))}
        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.2)", margin: "0 4px" }} />
        <button type="button" onClick={() => setDarkMode(!darkMode)} title="다크 모드"
          style={qatBtnStyle}
          onMouseEnter={handleHover}
          onMouseLeave={handleLeave}>
          {darkMode ? <Sun size={12} /> : <Moon size={12} />}
        </button>
      </div>

      {/* Document Title */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", minWidth: 0 }}>
        <input
          ref={titleRef} type="text"
          value={doc.title ? doc.title + " - Word" : "문서 - Word"}
          onChange={e => {
            const val = e.target.value.replace(/ - Word$/, "");
            setDoc(d => ({ ...d, title: val }));
          }}
          onFocus={e => {
            const end = e.target.value.lastIndexOf(" - Word");
            if (end > 0) e.target.setSelectionRange(0, end);
          }}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); editor?.commands.focus(); } }}
          style={{
            maxWidth: 400, textAlign: "center", fontSize: 11, fontWeight: 400,
            border: "none", outline: "none", background: "transparent", color: "#fff",
            fontFamily: "'Segoe UI', '맑은 고딕', sans-serif", width: "100%",
            letterSpacing: 0.2,
          }}
        />
      </div>

      {/* 저장 상태 + 문서 속성 */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 10, marginRight: 4, color: statusColor }}>
          {statusText[saveStatus] || saveStatus}
        </span>
        <button type="button" onClick={() => setMetaOpen(true)} title="문서 속성"
          style={{ background: "none", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", padding: "4px 6px", borderRadius: 2, display: "flex", alignItems: "center" }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.18)"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; }}>
          <Settings size={13} />
        </button>
      </div>
    </div>
  );
});
