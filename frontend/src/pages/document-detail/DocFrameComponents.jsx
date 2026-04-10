/**
 * DocFrameComponents — 타이틀 바, 탭 바, 상태 바
 * DocumentDetailPage의 프레임(상단/하단) UI 컴포넌트 모음
 */
import I from "./DocDetailIcons";
import { RibbonBtn } from "./DocDetailUI";
import { FONT_FAMILIES, FONT_SIZES } from "./docDetailConstants";

/**
 * 타이틀 바 — Word 스타일 상단 파란색 바 (로고, 빠른 실행, 제목, 사용자 정보)
 */
export function TitleBar({ title, saving, lastSaved, editor, manualSave, navigate }) {
  return (
    <div style={{
      height: 32, background: "#2b579a",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 6px 0 4px", color: "#fff", fontSize: 11, flexShrink: 0,
      position: "relative", userSelect: "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 1 }}>
        <div style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", marginRight: 4 }}>
          <svg width="16" height="16" viewBox="0 0 16 16"><rect width="16" height="16" rx="2" fill="#fff" opacity="0.9"/><text x="3" y="12" fontSize="10" fill="#2b579a" fontWeight="800" fontFamily="serif">W</text></svg>
        </div>
        <RibbonBtn icon={I.save} label="저장 (Ctrl+S)" onClick={manualSave} style={{ color: "rgba(255,255,255,0.9)", width: 24, height: 24 }} />
        <RibbonBtn icon={I.undo} label="실행 취소 (Ctrl+Z)" onClick={() => editor?.chain().focus().undo().run()} style={{ color: "rgba(255,255,255,0.9)", width: 24, height: 24 }} />
        <RibbonBtn icon={I.redo} label="다시 실행 (Ctrl+Y)" onClick={() => editor?.chain().focus().redo().run()} style={{ color: "rgba(255,255,255,0.9)", width: 24, height: 24 }} />
      </div>
      <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 4 }}>
        <span style={{ opacity: 0.95, fontWeight: 400, maxWidth: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 11.5 }}>
          {title || "제목 없음"} - Word
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {saving && <span style={{ fontSize: 9, opacity: 0.65, marginRight: 4 }}>저장 중...</span>}
        {!saving && lastSaved && <span style={{ fontSize: 9, opacity: 0.55, marginRight: 4 }}>저장됨</span>}
        <span style={{ fontSize: 10, opacity: 0.8 }}>Se Hwan Youn</span>
        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#e8a020", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#fff", marginLeft: 2 }}>Y</div>
        <WindowControls navigate={navigate} />
      </div>
    </div>
  );
}

/**
 * 창 제어 버튼 — 최소화, 최대화, 닫기
 */
function WindowControls({ navigate }) {
  const btnStyle = {
    width: 36, height: 24, border: "none", background: "transparent",
    color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: 10,
    display: "flex", alignItems: "center", justifyContent: "center",
  };

  return (
    <div style={{ display: "flex", marginLeft: 8, gap: 0 }}>
      <button onClick={() => navigate("/vault")} style={btnStyle} title="뒤로">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2"><line x1="0" y1="5" x2="10" y2="5"/></svg>
      </button>
      <button style={btnStyle} title="최대화">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2"><rect x="1" y="1" width="8" height="8"/></svg>
      </button>
      <button onClick={() => navigate("/vault")} style={btnStyle} title="닫기"
        onMouseEnter={e => e.currentTarget.style.background = "#c42b1c"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
        {I.close}
      </button>
    </div>
  );
}

/**
 * 탭 바 — 리본 탭 선택 + 검색 바
 */
export function TabBar({ tabs, activeTab, setActiveTab, setFindOpen }) {
  return (
    <div style={{ height: 28, background: "#fff", borderBottom: "1px solid #ddd", display: "flex", alignItems: "stretch", padding: "0", gap: 0, flexShrink: 0 }}>
      {tabs.map(tab => {
        const isFile = tab.id === "file";
        const isActive = activeTab === tab.id;
        return (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={isFile ? "" : "word-tab"}
            style={{
              padding: "0 14px", border: "none", height: "100%", display: "flex", alignItems: "center",
              ...(isFile ? { background: "#2b579a", color: "#fff", fontWeight: 500, fontSize: 12, borderRadius: 0 } : {
                background: isActive ? "#f8f8f6" : "transparent",
                color: isActive ? "#2b579a" : "#666",
                borderBottom: isActive ? "2px solid #2b579a" : "2px solid transparent",
                fontSize: 11, fontWeight: isActive ? 600 : 400,
              }),
              cursor: "pointer", transition: "all 0.1s",
            }}>
            {tab.label}
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      <div style={{ display: "flex", alignItems: "center", gap: 2, padding: "0 8px" }}>
        <div onClick={() => setFindOpen(true)} style={{
          display: "flex", alignItems: "center", gap: 4, padding: "0 12px",
          border: "1px solid #ddd", borderRadius: 14, height: 22, cursor: "pointer",
          fontSize: 10, color: "#999", background: "#f8f8f8", minWidth: 140,
        }}>
          {I.search} <span>어떤 작업을 원하시나요?</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 상태 바 — 하단 파란색 바 (페이지 수, 단어 수, 보기 모드, 확대/축소)
 */
export function StatusBar({ stats, viewMode, setViewMode, zoom, setZoom }) {
  return (
    <div style={{
      height: 22, background: "#2b579a", display: "flex", alignItems: "center",
      justifyContent: "space-between", padding: "0 10px", flexShrink: 0,
      color: "rgba(255,255,255,0.85)", fontSize: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span>{stats.pages}/{stats.pages} 페이지</span>
        <span>{stats.words}개 단어</span>
        <span style={{ opacity: 0.6 }}>다국어</span>
        <span style={{ opacity: 0.6 }}>한국어</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <RibbonBtn icon={I.readMode} label="읽기 모드" onClick={() => setViewMode("read")} style={{ color: viewMode === "read" ? "#fff" : "rgba(255,255,255,0.5)", width: 18, height: 18 }} />
        <RibbonBtn icon={I.printLayout} label="인쇄 모양" onClick={() => setViewMode("print")} style={{ color: viewMode === "print" ? "#fff" : "rgba(255,255,255,0.5)", width: 18, height: 18 }} />
        <RibbonBtn icon={I.webLayout} label="웹 모양" onClick={() => setViewMode("web")} style={{ color: viewMode === "web" ? "#fff" : "rgba(255,255,255,0.5)", width: 18, height: 18 }} />
        <div style={{ width: 1, height: 12, background: "rgba(255,255,255,0.25)", margin: "0 4px" }} />
        <RibbonBtn icon={I.zoomOut} label="축소" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} style={{ color: "#fff", width: 18, height: 18 }} />
        <input type="range" min="30" max="200" value={Math.round(zoom * 100)} onChange={e => setZoom(+e.target.value / 100)}
          style={{ width: 80, height: 3, accentColor: "#fff", cursor: "pointer" }} />
        <span style={{ width: 32, textAlign: "center", fontSize: 9 }}>{Math.round(zoom * 100)}%</span>
        <RibbonBtn icon={I.zoomIn} label="확대" onClick={() => setZoom(z => Math.min(2, z + 0.1))} style={{ color: "#fff", width: 18, height: 18 }} />
      </div>
    </div>
  );
}
