/**
 * Design, Layout, References, Review, View tabs (lucide-react icons)
 */
import { useState } from "react";
import {
  Palette, Droplets, PaintBucket, Columns2, Columns3, SeparatorHorizontal,
  Ruler, Eye, EyeOff, Printer, FilePlus, ZoomIn, ZoomOut,
  Languages, CheckSquare, MessageSquare, FileText, BookOpen,
  ListTree, Footprints, FileDown, Plus, Minus as MinusIcon,
  PanelLeft, SplitSquareVertical, LayoutTemplate,
  Monitor, BookOpenCheck,
} from "lucide-react";
import { RibbonBtn, RibbonBtnLarge, RibbonSelect, GroupSep, RibbonGroup, DropdownButton, ColorGrid } from "./RibbonParts";
import { MARGIN_PRESETS, PAGE_SIZES, HIGHLIGHT_COLORS } from "./constants";

const ICON_SIZE = 12;

/* ══════════════════════════════ DESIGN ══════════════════════════════ */
export function DesignTab({ pageColor, setPageColor, watermarkText, setWatermarkText, onOpenPageBorderDialog, onOpenWatermarkDialog }) {
  const THEME_COLORS = ["#ffffff","#f8f9fa","#fff8dc","#f0f8ff","#f5f5dc","#faf0e6","#f0fff0","#ffe4e1","#e6e6fa","#fffff0","#ffefd5","#f0e68c","#e0ffff","#ffdab9","#ffe4c4"];
  const THEMES = [
    { name: "기본", bg: "#fff", accent: "#1e3a5f" },
    { name: "세련", bg: "#f8f9fa", accent: "#2563eb" },
    { name: "따뜻한", bg: "#fffbeb", accent: "#b45309" },
    { name: "차가운", bg: "#f0f9ff", accent: "#0369a1" },
    { name: "자연", bg: "#f0fdf4", accent: "#15803d" },
  ];

  return (
    <div style={{ display: "flex", alignItems: "stretch", background: "var(--ribbon-bg, #fff)", borderBottom: "1px solid var(--ribbon-sep, #d1d5db)", flexShrink: 0, minHeight: 84, padding: "0 2px" }}>
      <RibbonGroup label="문서 서식">
        <div style={{ display: "flex", gap: 4 }}>
          {THEMES.map(th => (
            <button key={th.name} type="button" className="word-style-card" onClick={() => setPageColor(th.bg)}
              style={{ width: 50, height: 50, border: pageColor === th.bg ? "2px solid #3b82f6" : "1px solid var(--ribbon-sep, #d5d5d5)", borderRadius: 3, background: th.bg, cursor: "pointer", padding: 4, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 2 }}>
                <div style={{ width: 8, height: 8, background: th.accent, borderRadius: 2 }} />
                <div style={{ width: 8, height: 8, background: th.accent + "66", borderRadius: 2 }} />
                <div style={{ width: 8, height: 8, background: th.accent + "33", borderRadius: 2 }} />
              </div>
              <span style={{ fontSize: 7, color: "#888" }}>{th.name}</span>
            </button>
          ))}
        </div>
      </RibbonGroup>
      <GroupSep />
      <RibbonGroup label="페이지 배경">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <PaintBucket size={ICON_SIZE} color="#888" />
            <DropdownButton trigger={
              <div style={{ display: "flex", alignItems: "center", gap: 3, cursor: "pointer", border: "1px solid #ccc", borderRadius: 2, padding: "2px 6px" }}>
                <span style={{ display: "inline-block", width: 16, height: 12, background: pageColor || "#fff", border: "1px solid #ddd", borderRadius: 1 }} />
                <span style={{ fontSize: 10 }}>페이지 색</span>
              </div>
            }>
              <div style={{ padding: 8 }}>
                <ColorGrid colors={THEME_COLORS} value={pageColor} onChange={setPageColor} columns={5} />
                <button className="word-dropdown-item" style={{ marginTop: 6 }} onClick={() => setPageColor("#ffffff")}>색 없음</button>
              </div>
            </DropdownButton>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Droplets size={ICON_SIZE} color="#888" />
            <RibbonBtn onClick={onOpenWatermarkDialog} title="워터마크 설정" small>
              <span style={{ fontSize: 10 }}>워터마크</span>
            </RibbonBtn>
          </div>
        </div>
      </RibbonGroup>
      <GroupSep />
      <RibbonGroup label="페이지 테두리">
        <RibbonBtnLarge icon={<Palette size={18} />} label="페이지 테두리"
          onClick={onOpenPageBorderDialog} title="페이지 테두리 설정" />
      </RibbonGroup>
    </div>
  );
}

/* ══════════════════════════════ LAYOUT ══════════════════════════════ */
export function LayoutTab({ margins, setMargins, orientation, setOrientation, pageSize, setPageSize, columns, setColumns, onOpenPageSetupDialog, editor }) {
  const curMargin = MARGIN_PRESETS.find(m => m.value === margins);
  const curSize = PAGE_SIZES.find(p => p.value === pageSize);

  const insertPageBreak = () => {
    if (!editor) return;
    // 실제 페이지 나누기 노드 삽입 (PageBreak 확장 사용)
    try {
      editor.chain().focus().setPageBreak().run();
    } catch {
      editor.chain().focus().setHorizontalRule().run();
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "stretch", background: "var(--ribbon-bg, #fff)", borderBottom: "1px solid var(--ribbon-sep, #d1d5db)", flexShrink: 0, minHeight: 84, padding: "0 2px" }}>
      {/* ── 페이지 설정 그룹 ── */}
      <RibbonGroup label="페이지 설정" dialogLauncher={onOpenPageSetupDialog}>
        <div style={{ display: "flex", gap: 6 }}>
          {/* 여백 */}
          <DropdownButton trigger={
            <div className="word-ribbon-btn" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 8px", cursor: "pointer", border: "1px solid transparent", borderRadius: 3 }}>
              <LayoutTemplate size={20} color="var(--ribbon-fg, #555)" />
              <span style={{ fontSize: 9, marginTop: 2, color: "var(--ribbon-fg, #555)" }}>여백 ▾</span>
            </div>
          }>
            <div style={{ padding: 4, minWidth: 220 }}>
              <div style={{ fontSize: 10, color: "#888", padding: "4px 8px", fontWeight: 600 }}>여백</div>
              {MARGIN_PRESETS.map(m => (
                <button key={m.value} className={`word-dropdown-item${margins === m.value ? " active" : ""}`}
                  onMouseDown={(e) => { e.preventDefault(); setMargins(m.value); }}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: "#888" }}>{m.desc}</div>
                  </div>
                  <div style={{ width: 40, height: 50, border: "1px solid #ccc", borderRadius: 2, position: "relative", background: "#fff", flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ position: "absolute", top: `${(m.top / 96) * 20}%`, left: `${(m.left / 120) * 15}%`, right: `${(m.right / 120) * 15}%`, bottom: `${(m.bottom / 96) * 20}%`, background: "#e8f0fe", borderRadius: 1 }} />
                  </div>
                </button>
              ))}
              <div style={{ height: 1, background: "#e5e5e5", margin: "4px 0" }} />
              <button className={`word-dropdown-item${margins === "custom" ? " active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); onOpenPageSetupDialog?.(); }}>
                <span style={{ fontWeight: 500 }}>사용자 지정 여백...</span>
              </button>
            </div>
          </DropdownButton>

          {/* 방향 */}
          <DropdownButton trigger={
            <div className="word-ribbon-btn" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 8px", cursor: "pointer", border: "1px solid transparent", borderRadius: 3 }}>
              <SplitSquareVertical size={20} color="var(--ribbon-fg, #555)" style={orientation === "landscape" ? { transform: "rotate(90deg)" } : {}} />
              <span style={{ fontSize: 9, marginTop: 2, color: "var(--ribbon-fg, #555)" }}>방향 ▾</span>
            </div>
          }>
            <div style={{ padding: 4, minWidth: 180 }}>
              <div style={{ fontSize: 10, color: "#888", padding: "4px 8px", fontWeight: 600 }}>용지 방향</div>
              <button className={`word-dropdown-item${orientation === "portrait" ? " active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); setOrientation("portrait"); }}
                style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 24, height: 32, border: "1px solid #888", borderRadius: 2, background: orientation === "portrait" ? "#dbeafe" : "#fff" }} />
                <span>세로</span>
              </button>
              <button className={`word-dropdown-item${orientation === "landscape" ? " active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); setOrientation("landscape"); }}
                style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 32, height: 24, border: "1px solid #888", borderRadius: 2, background: orientation === "landscape" ? "#dbeafe" : "#fff" }} />
                <span>가로</span>
              </button>
            </div>
          </DropdownButton>

          {/* 크기 */}
          <DropdownButton trigger={
            <div className="word-ribbon-btn" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 8px", cursor: "pointer", border: "1px solid transparent", borderRadius: 3 }}>
              <FileDown size={20} color="var(--ribbon-fg, #555)" />
              <span style={{ fontSize: 9, marginTop: 2, color: "var(--ribbon-fg, #555)" }}>크기 ▾</span>
            </div>
          }>
            <div style={{ padding: 4, minWidth: 240 }}>
              <div style={{ fontSize: 10, color: "#888", padding: "4px 8px", fontWeight: 600 }}>용지 크기</div>
              {PAGE_SIZES.map(p => (
                <button key={p.value} className={`word-dropdown-item${pageSize === p.value ? " active" : ""}`}
                  onMouseDown={(e) => { e.preventDefault(); setPageSize(p.value); }}
                  style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: 500 }}>{p.label}</span>
                  <span style={{ fontSize: 10, color: "#888" }}>{p.desc}</span>
                </button>
              ))}
            </div>
          </DropdownButton>
        </div>
      </RibbonGroup>
      <GroupSep />

      {/* ── 단 그룹 ── */}
      <RibbonGroup label="단">
        <DropdownButton trigger={
          <div className="word-ribbon-btn" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 8px", cursor: "pointer", border: "1px solid transparent", borderRadius: 3 }}>
            <Columns2 size={20} color="var(--ribbon-fg, #555)" />
            <span style={{ fontSize: 9, marginTop: 2, color: "var(--ribbon-fg, #555)" }}>단 ▾</span>
          </div>
        }>
          <div style={{ padding: 4, minWidth: 180 }}>
            <div style={{ fontSize: 10, color: "#888", padding: "4px 8px", fontWeight: 600 }}>단</div>
            {[
              { v: 1, l: "1단", desc: "단 없음", icon: "▌" },
              { v: 2, l: "2단", desc: "2개의 동일한 열", icon: "▌▌" },
              { v: 3, l: "3단", desc: "3개의 동일한 열", icon: "▌▌▌" },
            ].map(c => (
              <button key={c.v} className={`word-dropdown-item${columns === c.v ? " active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); setColumns(c.v); }}
                style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 14, letterSpacing: 2, width: 30 }}>{c.icon}</span>
                <div>
                  <div style={{ fontWeight: 500 }}>{c.l}</div>
                  <div style={{ fontSize: 10, color: "#888" }}>{c.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </DropdownButton>
      </RibbonGroup>
      <GroupSep />

      {/* ── 나누기 그룹 ── */}
      <RibbonGroup label="나누기">
        <DropdownButton trigger={
          <div className="word-ribbon-btn" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "4px 8px", cursor: "pointer", border: "1px solid transparent", borderRadius: 3 }}>
            <SeparatorHorizontal size={20} color="var(--ribbon-fg, #555)" />
            <span style={{ fontSize: 9, marginTop: 2, color: "var(--ribbon-fg, #555)" }}>나누기 ▾</span>
          </div>
        }>
          <div style={{ padding: 4, minWidth: 240 }}>
            <div style={{ fontSize: 10, color: "#888", padding: "4px 8px", fontWeight: 600 }}>페이지 나누기</div>
            <button className="word-dropdown-item"
              onMouseDown={(e) => { e.preventDefault(); insertPageBreak(); }}>
              <div style={{ fontWeight: 500 }}>페이지 나누기</div>
              <div style={{ fontSize: 10, color: "#888" }}>다음 페이지의 시작 부분으로 이동</div>
            </button>
            <button className="word-dropdown-item"
              onMouseDown={(e) => { e.preventDefault(); try { editor?.chain().focus().setColumnBreak().run(); } catch { editor?.chain().focus().enter().run(); } }}>
              <div style={{ fontWeight: 500 }}>단 나누기</div>
              <div style={{ fontSize: 10, color: "#888" }}>다음 단의 시작 부분으로 이동</div>
            </button>
            <button className="word-dropdown-item"
              onMouseDown={(e) => { e.preventDefault(); editor?.chain().focus().insertContent('<p style="text-wrap: nowrap; overflow-wrap: normal;"></p>').run(); }}>
              <div style={{ fontWeight: 500 }}>텍스트 줄 바꿈</div>
              <div style={{ fontSize: 10, color: "#888" }}>다음 줄에서 텍스트 계속</div>
            </button>
            <div style={{ height: 1, background: "#e5e5e5", margin: "4px 0" }} />
            <div style={{ fontSize: 10, color: "#888", padding: "4px 8px", fontWeight: 600 }}>구역 나누기</div>
            <button className="word-dropdown-item"
              onMouseDown={(e) => { e.preventDefault(); try { editor?.chain().focus().setSectionBreak("next-page").run(); } catch { insertPageBreak(); } }}>
              <div style={{ fontWeight: 500 }}>다음 페이지</div>
              <div style={{ fontSize: 10, color: "#888" }}>구역 나누기를 삽입하고 다음 페이지에서 시작</div>
            </button>
            <button className="word-dropdown-item"
              onMouseDown={(e) => { e.preventDefault(); try { editor?.chain().focus().setSectionBreak("continuous").run(); } catch { editor?.chain().focus().setHorizontalRule().run(); } }}>
              <div style={{ fontWeight: 500 }}>연속</div>
              <div style={{ fontSize: 10, color: "#888" }}>같은 페이지에서 새 구역 시작</div>
            </button>
          </div>
        </DropdownButton>
      </RibbonGroup>
      <GroupSep />

      {/* ── 들여쓰기 / 간격 그룹 ── */}
      <RibbonGroup label="단락">
        <div style={{ display: "flex", gap: 6 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 9, color: "var(--ribbon-label, #888)" }}>들여쓰기</span>
            <div style={{ display: "flex", gap: 2 }}>
              <RibbonBtn onClick={() => editor?.commands.decreaseIndent()} title="들여쓰기 줄이기" small>
                <span style={{ fontSize: 10 }}>◀</span>
              </RibbonBtn>
              <RibbonBtn onClick={() => editor?.commands.increaseIndent()} title="들여쓰기 늘리기" small>
                <span style={{ fontSize: 10 }}>▶</span>
              </RibbonBtn>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 9, color: "var(--ribbon-label, #888)" }}>간격</span>
            <div style={{ display: "flex", gap: 2 }}>
              <RibbonBtn onClick={() => editor?.commands.setSpacingBefore("6pt")} title="앞에 간격 추가" small>
                <span style={{ fontSize: 10 }}>▲</span>
              </RibbonBtn>
              <RibbonBtn onClick={() => editor?.commands.setSpacingAfter("6pt")} title="뒤에 간격 추가" small>
                <span style={{ fontSize: 10 }}>▼</span>
              </RibbonBtn>
            </div>
          </div>
        </div>
      </RibbonGroup>
    </div>
  );
}

/* ══════════════════════════════ REFERENCES ══════════════════════════════ */
export function ReferencesTab({ editor, onInsertFootnote }) {
  if (!editor) return null;

  const insertTOC = () => {
    const html = editor.getHTML();
    const hReg = /<h([1-4])[^>]*>(.*?)<\/h[1-4]>/gi;
    const heads = []; let m;
    while ((m = hReg.exec(html))) heads.push({ level: parseInt(m[1]), text: m[2].replace(/<[^>]+>/g, "") });
    if (!heads.length) { window.alert("제목이 없습니다."); return; }
    let toc = '<div style="border:1px solid #e2e8f0;padding:16px;margin:12px 0;background:#fafafa;border-radius:4px;">';
    toc += '<p style="font-weight:700;font-size:13pt;margin-bottom:8px;">목차</p>';
    for (const h of heads) toc += `<p style="margin:2px 0;padding-left:${(h.level - 1) * 20}px;font-size:${13 - h.level}pt;">${h.text}</p>`;
    toc += '</div>';
    editor.commands.setContent(toc + html);
  };

  return (
    <div style={{ display: "flex", alignItems: "stretch", background: "var(--ribbon-bg, #fff)", borderBottom: "1px solid var(--ribbon-sep, #d1d5db)", flexShrink: 0, minHeight: 84, padding: "0 2px" }}>
      <RibbonGroup label="목차">
        <RibbonBtnLarge icon={<ListTree size={18} />} label="목차 생성" onClick={insertTOC} title="목차 생성" />
      </RibbonGroup>
      <GroupSep />
      <RibbonGroup label="각주">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn onClick={() => onInsertFootnote?.()} title="각주 삽입" small>
            <Footprints size={ICON_SIZE} /> <span style={{ fontSize: 10 }}>각주</span>
          </RibbonBtn>
          <RibbonBtn onClick={() => { const t = window.prompt("미주:"); if (t) editor.commands.setContent(editor.getHTML() + `<p style="font-size:9pt;color:#666;border-top:1px solid #ccc;padding-top:4px;margin-top:20px;">${t}</p>`); }} title="미주" small>
            <Footprints size={ICON_SIZE} /> <span style={{ fontSize: 10 }}>미주</span>
          </RibbonBtn>
        </div>
      </RibbonGroup>
      <GroupSep />
      <RibbonGroup label="인용">
        <RibbonBtn onClick={() => { const t = window.prompt("인용:"); if (t) editor.chain().focus().insertContent(`<span style="font-size:9pt;color:#3b82f6;">[${t}]</span>`).run(); }} title="인용" small>
          <BookOpen size={ICON_SIZE} /> <span style={{ fontSize: 10 }}>인용</span>
        </RibbonBtn>
      </RibbonGroup>
    </div>
  );
}

/* ══════════════════════════════ REVIEW ══════════════════════════════ */
export function ReviewTab({ editor, onInsertComment, onDeleteComment, onDeleteAllComments,
  onPrevComment, onNextComment, commentStore, commentDispatch }) {
  const [showWordCount, setShowWordCount] = useState(false);
  const [trackChanges, setTrackChanges] = useState(false);
  if (!editor) return null;

  const text = editor.getText() || "";
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, "").length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim()).length;
  const lines = text.split(/\n/).length;

  const markupMode = commentStore?.markupMode || "all";
  const markupLabels = { all: "모든 태그", simple: "간단한 태그", none: "태그 없음", original: "원본" };
  const showPanel = commentStore?.showCommentsPanel ?? true;
  const reviewingPane = commentStore?.showReviewingPane;

  return (
    <div style={{ display: "flex", alignItems: "stretch", background: "var(--ribbon-bg, #fff)", borderBottom: "1px solid var(--ribbon-sep, #d1d5db)", flexShrink: 0, minHeight: 84, padding: "0 2px" }}>
      <RibbonGroup label="언어 교정">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn onClick={() => window.alert("맞춤법 검사 완료.")} title="맞춤법" small>
            <CheckSquare size={ICON_SIZE} /> <span style={{ fontSize: 10 }}>맞춤법</span>
          </RibbonBtn>
          <span style={{ position: "relative" }}>
            <RibbonBtn onClick={() => setShowWordCount(v => !v)} title="단어 수" small>
              <FileText size={ICON_SIZE} /> <span style={{ fontSize: 10 }}>단어 수</span>
            </RibbonBtn>
            {showWordCount && (
              <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 100, background: "#fff", border: "1px solid #d1d5db", borderRadius: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.15)", padding: "14px 18px", minWidth: 240 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, borderBottom: "1px solid #eee", paddingBottom: 6 }}>단어 수 통계</div>
                <table style={{ fontSize: 12, width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    {[["문자 (공백 포함)", chars], ["문자 (공백 제외)", charsNoSpace], ["단어 수", words], ["단락 수", paragraphs], ["줄 수", lines]].map(([l, v]) => (
                      <tr key={l}><td style={{ padding: "4px 8px 4px 0", color: "#555" }}>{l}</td><td style={{ fontWeight: 600, textAlign: "right" }}>{v.toLocaleString()}</td></tr>
                    ))}
                  </tbody>
                </table>
                <button type="button" onClick={() => setShowWordCount(false)}
                  style={{ marginTop: 10, padding: "4px 16px", fontSize: 11, border: "1px solid #ccc", borderRadius: 3, background: "#f8f9fa", cursor: "pointer", width: "100%" }}>닫기</button>
              </div>
            )}
          </span>
        </div>
      </RibbonGroup>
      <GroupSep />

      {/* ── 메모 그룹 ── */}
      <RibbonGroup label="메모">
        <div style={{ display: "flex", gap: 4, alignItems: "flex-start" }}>
          {/* 새 메모 - large button */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <button type="button" className="word-ribbon-btn"
              onMouseDown={(e) => { e.preventDefault(); onInsertComment?.(); }}
              title="새 메모 (Ctrl+Alt+M)"
              style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                height: 50, width: 48, background: "transparent", border: "1px solid transparent",
                borderRadius: 3, cursor: "pointer", padding: 4, color: "var(--ribbon-fg, #333)" }}>
              <MessageSquare size={18} />
              <span style={{ fontSize: 9, marginTop: 2 }}>새 메모</span>
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {/* 삭제 드롭다운 */}
            <DropdownButton trigger={
              <RibbonBtn title="삭제" small>
                <span style={{ fontSize: 10 }}>삭제 ▼</span>
              </RibbonBtn>
            }>
              <button className="word-dropdown-item" onMouseDown={(e) => { e.preventDefault(); onDeleteComment?.(); }}>삭제 (현재 메모)</button>
              <button className="word-dropdown-item" onMouseDown={(e) => { e.preventDefault(); onDeleteAllComments?.(); }}>문서의 모든 메모 삭제</button>
            </DropdownButton>

            {/* 이전/다음 */}
            <div style={{ display: "flex", gap: 2 }}>
              <RibbonBtn onClick={onPrevComment} title="이전 메모" small>
                <span style={{ fontSize: 10 }}>◀ 이전</span>
              </RibbonBtn>
              <RibbonBtn onClick={onNextComment} title="다음 메모" small>
                <span style={{ fontSize: 10 }}>다음 ▶</span>
              </RibbonBtn>
            </div>
          </div>

          {/* 표시 드롭다운 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <DropdownButton trigger={
              <RibbonBtn title="메모 표시" small>
                <Eye size={ICON_SIZE} /> <span style={{ fontSize: 10 }}>표시 ▼</span>
              </RibbonBtn>
            }>
              <button className={`word-dropdown-item${showPanel ? " active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); commentDispatch?.({ type: "SET_PANEL_VISIBLE", visible: !showPanel }); }}>
                {showPanel ? "☑" : "☐"} 메모 표시
              </button>
            </DropdownButton>
          </div>
        </div>
      </RibbonGroup>
      <GroupSep />

      {/* ── 변경 내용 그룹 ── */}
      <RibbonGroup label="변경 내용">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* 마크업 모드 드롭다운 */}
          <DropdownButton trigger={
            <RibbonBtn title="마크업 표시 모드" small>
              <span style={{ fontSize: 10 }}>▼ {markupLabels[markupMode]}</span>
            </RibbonBtn>
          }>
            {["all", "simple", "none", "original"].map((mode) => (
              <button key={mode} className={`word-dropdown-item${markupMode === mode ? " active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); commentDispatch?.({ type: "SET_MARKUP_MODE", mode }); }}>
                {markupLabels[mode]}
              </button>
            ))}
          </DropdownButton>

          {/* 변경 추적 */}
          <RibbonBtn active={trackChanges} onClick={() => setTrackChanges(!trackChanges)} title="변경 추적" small>
            <Eye size={ICON_SIZE} /> <span style={{ fontSize: 10 }}>추적 {trackChanges ? "ON" : "OFF"}</span>
          </RibbonBtn>

          {/* 검토 창 */}
          <DropdownButton trigger={
            <RibbonBtn title="검토 창" small>
              <span style={{ fontSize: 10 }}>검토 창 ▼</span>
            </RibbonBtn>
          }>
            <button className={`word-dropdown-item${reviewingPane === "vertical" ? " active" : ""}`}
              onMouseDown={(e) => { e.preventDefault(); commentDispatch?.({ type: "SET_REVIEWING_PANE", mode: reviewingPane === "vertical" ? null : "vertical" }); }}>
              검토 창 세로
            </button>
            <button className={`word-dropdown-item${reviewingPane === "horizontal" ? " active" : ""}`}
              onMouseDown={(e) => { e.preventDefault(); commentDispatch?.({ type: "SET_REVIEWING_PANE", mode: reviewingPane === "horizontal" ? null : "horizontal" }); }}>
              검토 창 가로
            </button>
          </DropdownButton>
        </div>
      </RibbonGroup>
      <GroupSep />

      <RibbonGroup label="언어">
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Languages size={16} />
          <span style={{ fontSize: 11, color: "var(--ribbon-fg, #555)" }}>한국어</span>
        </div>
      </RibbonGroup>
    </div>
  );
}

/* ══════════════════════════════ VIEW ══════════════════════════════ */
export function ViewTab({ showRuler, setShowRuler, viewMode, setViewMode, zoom, setZoom, showNavPane, setShowNavPane, onNew, darkMode, setDarkMode, onFitPageWidth, onToggleFullscreen, isFullscreen }) {
  return (
    <div style={{ display: "flex", alignItems: "stretch", background: "var(--ribbon-bg, #fff)", borderBottom: "1px solid var(--ribbon-sep, #d1d5db)", flexShrink: 0, minHeight: 84, padding: "0 2px" }}>
      <RibbonGroup label="보기">
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <label style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 3, cursor: "pointer", color: "var(--ribbon-fg, #555)" }}>
              <input type="checkbox" checked={showRuler} onChange={e => setShowRuler(e.target.checked)} /> <Ruler size={11} /> 눈금자
            </label>
            <label style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 3, cursor: "pointer", color: "var(--ribbon-fg, #555)" }}>
              <input type="checkbox" checked={showNavPane} onChange={e => setShowNavPane(e.target.checked)} /> <PanelLeft size={11} /> 탐색 창
            </label>
          </div>
          <div style={{ display: "inline-flex", border: "1px solid var(--ribbon-input-border, #c0c0c0)", borderRadius: 3, overflow: "hidden" }}>
            {[
              { id: "edit", label: "인쇄 모양", icon: <FileText size={10} /> },
              { id: "preview", label: "읽기", icon: <BookOpen size={10} /> },
              { id: "web", label: "웹", icon: <Monitor size={10} /> },
            ].map(v => (
              <button key={v.id} type="button" onClick={() => setViewMode(v.id)}
                style={{
                  height: 24, padding: "0 10px", fontSize: 10, border: "none", cursor: "pointer",
                  background: viewMode === v.id ? "#3b82f6" : "var(--ribbon-bg, #f3f3f3)",
                  color: viewMode === v.id ? "#fff" : "var(--ribbon-fg, #555)",
                  display: "flex", alignItems: "center", gap: 3,
                  borderLeft: v.id !== "edit" ? "1px solid var(--ribbon-input-border, #c0c0c0)" : "none",
                }}>{v.icon} {v.label}</button>
            ))}
          </div>
        </div>
      </RibbonGroup>
      <GroupSep />
      <RibbonGroup label="확대/축소">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <RibbonBtn onClick={() => setZoom(100)} title="100%" small><span style={{ fontSize: 10 }}>100%</span></RibbonBtn>
            <RibbonBtn onClick={() => setZoom(z => Math.max(50, z - 10))} title="축소 (-10%)" small><ZoomOut size={ICON_SIZE} /></RibbonBtn>
            <span style={{ fontSize: 10, minWidth: 30, textAlign: "center", color: "var(--ribbon-fg, #555)" }}>{zoom}%</span>
            <RibbonBtn onClick={() => setZoom(z => Math.min(200, z + 10))} title="확대 (+10%)" small><ZoomIn size={ICON_SIZE} /></RibbonBtn>
            <DropdownButton trigger={<RibbonBtn title="프리셋" small><span style={{ fontSize: 7 }}>▼</span></RibbonBtn>}>
              {[50, 75, 100, 125, 150, 175, 200].map(z => (
                <button key={z} className={`word-dropdown-item${zoom === z ? " active" : ""}`}
                  onMouseDown={(e) => { e.preventDefault(); setZoom(z); }}>{z}%</button>
              ))}
            </DropdownButton>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <RibbonBtn onClick={onFitPageWidth} title="페이지 너비 맞춤" small>
              <Columns2 size={ICON_SIZE} /> <span style={{ fontSize: 10 }}>너비 맞춤</span>
            </RibbonBtn>
          </div>
        </div>
      </RibbonGroup>
      <GroupSep />
      <RibbonGroup label="창">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn active={isFullscreen} onClick={onToggleFullscreen} title="전체 화면 (F11)" small>
            <Monitor size={ICON_SIZE} /> <span style={{ fontSize: 10 }}>전체 화면</span>
          </RibbonBtn>
        </div>
      </RibbonGroup>
      <GroupSep />
      <RibbonGroup label="기타">
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <RibbonBtn onClick={onNew} title="새 문서" small>
            <FilePlus size={ICON_SIZE} /> <span style={{ fontSize: 10 }}>새 문서</span>
          </RibbonBtn>
          <RibbonBtn onClick={() => window.print()} title="인쇄 (Ctrl+P)" small>
            <Printer size={ICON_SIZE} /> <span style={{ fontSize: 10 }}>인쇄</span>
          </RibbonBtn>
          {setDarkMode && (
            <RibbonBtn active={darkMode} onClick={() => setDarkMode(!darkMode)} title="다크 모드" small>
              {darkMode ? <Eye size={ICON_SIZE} /> : <EyeOff size={ICON_SIZE} />} <span style={{ fontSize: 10 }}>다크모드</span>
            </RibbonBtn>
          )}
        </div>
      </RibbonGroup>
    </div>
  );
}
