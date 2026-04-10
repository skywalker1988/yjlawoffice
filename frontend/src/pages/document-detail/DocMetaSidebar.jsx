/**
 * DocMetaSidebar — 문서 속성 사이드 패널
 * 문서 기본 정보, 카테고리, 통계, 기록, 메모, 삭제 영역
 */
import { getTypeLabel, getTypeColor } from "../../utils/document-types";
import { STATUS_LABELS } from "../../utils/constants";
import { parseAuthor } from "../../utils/format";
import { api } from "../../utils/api";

/**
 * @param {Object} props
 * @param {Object} props.doc - 문서 데이터
 * @param {string} props.id - 문서 ID
 * @param {Function} props.setDoc - 문서 상태 업데이트
 * @param {Function} props.handleStatusChange - 상태 변경 핸들러
 * @param {Function} props.toast - 토스트 표시 함수
 * @param {Object} props.stats - 문서 통계 (pages, words, chars)
 * @param {Object} props.editor - TipTap 에디터 인스턴스
 * @param {Date|null} props.lastSaved - 마지막 저장 시간
 * @param {Array} props.comments - 메모 목록
 * @param {Function} props.setComments - 메모 목록 업데이트
 * @param {string} props.commentText - 메모 입력 텍스트
 * @param {Function} props.setCommentText - 메모 입력 업데이트
 * @param {Function} props.addComment - 메모 추가 핸들러
 * @param {Function} props.setDeleteOpen - 삭제 확인 모달 열기
 * @param {Function} props.onClose - 패널 닫기
 */
export default function DocMetaSidebar({
  doc, id, setDoc, handleStatusChange, toast,
  stats, editor, lastSaved,
  comments, setComments, commentText, setCommentText, addComment,
  setDeleteOpen, onClose,
}) {
  return (
    <div style={{
      width: 300, background: "#fafbfc", borderLeft: "1px solid #e0e0e0",
      display: "flex", flexDirection: "column", flexShrink: 0,
      boxShadow: "-2px 0 12px rgba(0,0,0,0.06)",
    }}>
      {/* 패널 헤더 */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", borderBottom: "1px solid #e8e8e8", background: "#fff",
      }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", margin: 0 }}>문서 속성</h3>
        <button onClick={onClose}
          style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 16, color: "#999", lineHeight: 1 }}>&#x2715;</button>
      </div>

      {/* 스크롤 영역 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px" }}>

        {/* 문서 기본 정보 카드 */}
        <InfoCard doc={doc} id={id} setDoc={setDoc} handleStatusChange={handleStatusChange} toast={toast} />

        {/* 카테고리 카드 */}
        {doc.categories?.length > 0 && (
          <div style={{ background: "#fff", borderRadius: 6, border: "1px solid #eee", padding: 12, marginBottom: 12 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "#333", marginBottom: 6 }}>카테고리</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {doc.categories.map((cat, i) => (
                <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "3px 10px", borderRadius: 4, fontSize: 10, border: "1px solid #e0e0e0", color: "#555", background: "#f8f8f8" }}>
                  {cat.icon || "\uD83D\uDCC1"} {typeof cat === "string" ? cat : cat.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 문서 통계 카드 */}
        <StatsCard stats={stats} editor={editor} />

        {/* 타임스탬프 카드 */}
        <TimestampCard doc={doc} lastSaved={lastSaved} />

        {/* 메모/댓글 카드 */}
        <CommentsCard
          comments={comments}
          setComments={setComments}
          commentText={commentText}
          setCommentText={setCommentText}
          addComment={addComment}
        />

        {/* 위험 영역 */}
        <div style={{ background: "#fff5f5", borderRadius: 6, border: "1px solid #fee2e2", padding: 12 }}>
          <button onClick={() => setDeleteOpen(true)}
            style={{ width: "100%", padding: "7px 0", border: "1px solid #fca5a5", borderRadius: 4, background: "#fff", color: "#dc2626", fontSize: 11, cursor: "pointer", fontWeight: 500, transition: "all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background = "#dc2626"; e.currentTarget.style.color = "#fff"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "#fff"; e.currentTarget.style.color = "#dc2626"; }}>
            문서 삭제
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── 문서 기본 정보 카드 ── */
function InfoCard({ doc, id, setDoc, handleStatusChange, toast }) {
  return (
    <div style={{ background: "#fff", borderRadius: 6, border: "1px solid #eee", padding: 12, marginBottom: 12 }}>
      {/* 유형 + 상태 행 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 9, color: "#999", marginBottom: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>유형</p>
          <span style={{ padding: "3px 10px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: getTypeColor(doc.documentType), color: "#fff", display: "inline-block" }}>
            {getTypeLabel(doc.documentType)}
          </span>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 9, color: "#999", marginBottom: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>상태</p>
          <select value={doc.status || "inbox"} onChange={e => handleStatusChange(e.target.value)}
            style={{ width: "100%", height: 28, border: "1px solid #ddd", borderRadius: 4, padding: "0 8px", fontSize: 11, background: "#fff", cursor: "pointer" }}>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* 중요도 */}
      <div style={{ marginBottom: 8 }}>
        <p style={{ fontSize: 9, color: "#999", marginBottom: 4, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>중요도</p>
        <div style={{ display: "flex", gap: 2 }}>
          {[1, 2, 3, 4, 5].map(s => (
            <button key={s} onClick={() => {
              api.patch(`/documents/${id}`, { importance: s })
                .then(() => { setDoc(prev => ({ ...prev, importance: s })); toast(`중요도 ${s}로 변경`); });
            }}
              style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18, color: s <= (doc.importance || 3) ? "#e8a020" : "#ddd", padding: 0, transition: "color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.transform = "scale(1.2)"}
              onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
              &#x2605;
            </button>
          ))}
          <span style={{ fontSize: 10, color: "#999", marginLeft: 4, alignSelf: "center" }}>{doc.importance || 3}/5</span>
        </div>
      </div>

      {/* 저자 */}
      {doc.author && (
        <div style={{ marginBottom: 6 }}>
          <p style={{ fontSize: 9, color: "#999", marginBottom: 2, fontWeight: 500 }}>저자</p>
          <p style={{ fontSize: 11, color: "#333" }}>{parseAuthor(doc.author)}</p>
        </div>
      )}

      {/* 출처 */}
      {doc.source && (
        <div style={{ marginBottom: 6 }}>
          <p style={{ fontSize: 9, color: "#999", marginBottom: 2, fontWeight: 500 }}>출처</p>
          <p style={{ fontSize: 10, color: "#2b579a", wordBreak: "break-all", cursor: doc.source.startsWith("http") ? "pointer" : "default" }}
            onClick={() => { if (doc.source.startsWith("http")) window.open(doc.source, "_blank"); }}>
            {doc.source}
          </p>
        </div>
      )}

      {/* 발행일 */}
      {doc.publishedDate && (
        <div>
          <p style={{ fontSize: 9, color: "#999", marginBottom: 2, fontWeight: 500 }}>발행일</p>
          <p style={{ fontSize: 11, color: "#333" }}>{new Date(doc.publishedDate).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      )}
    </div>
  );
}

/* ── 문서 통계 카드 ── */
function StatsCard({ stats, editor }) {
  return (
    <div style={{ background: "#fff", borderRadius: 6, border: "1px solid #eee", padding: 12, marginBottom: 12 }}>
      <p style={{ fontSize: 10, fontWeight: 600, color: "#333", marginBottom: 8 }}>문서 통계</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {[
          { label: "페이지", value: stats.pages },
          { label: "단어", value: stats.words.toLocaleString() },
          { label: "문자", value: stats.chars.toLocaleString() },
          { label: "단락", value: editor?.getJSON()?.content?.length || 0 },
        ].map(s => (
          <div key={s.label} style={{ padding: "6px 8px", background: "#f8f9fb", borderRadius: 4, textAlign: "center" }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#2b579a", margin: 0 }}>{s.value}</p>
            <p style={{ fontSize: 8, color: "#999", margin: 0, marginTop: 1 }}>{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── 타임스탬프 카드 ── */
function TimestampCard({ doc, lastSaved }) {
  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("ko-KR", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div style={{ background: "#fff", borderRadius: 6, border: "1px solid #eee", padding: 12, marginBottom: 12 }}>
      <p style={{ fontSize: 10, fontWeight: 600, color: "#333", marginBottom: 8 }}>기록</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#888" }}>생성일</span>
          <span style={{ fontSize: 10, color: "#444" }}>{formatDate(doc.createdAt)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 10, color: "#888" }}>수정일</span>
          <span style={{ fontSize: 10, color: "#444" }}>{formatDate(doc.updatedAt)}</span>
        </div>
        {lastSaved && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "#888" }}>마지막 저장</span>
            <span style={{ fontSize: 10, color: "#10b981" }}>{lastSaved.toLocaleTimeString("ko-KR")}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── 메모/댓글 카드 ── */
function CommentsCard({ comments, setComments, commentText, setCommentText, addComment }) {
  return (
    <div style={{ background: "#fff", borderRadius: 6, border: "1px solid #eee", padding: 12, marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: "#333", margin: 0 }}>메모</p>
        <span style={{ fontSize: 9, color: "#999" }}>{comments.length}개</span>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
        <input id="comment-input" value={commentText} onChange={e => setCommentText(e.target.value)}
          placeholder="메모를 입력하세요..."
          onKeyDown={e => { if (e.key === "Enter") addComment(); }}
          style={{ flex: 1, height: 30, border: "1px solid #ddd", borderRadius: 4, padding: "0 10px", fontSize: 11, background: "#fafafa" }} />
        <button onClick={addComment}
          style={{ padding: "0 12px", border: "none", borderRadius: 4, background: "#2b579a", color: "#fff", fontSize: 10, cursor: "pointer", height: 30, fontWeight: 500 }}>추가</button>
      </div>
      <div style={{ maxHeight: 200, overflowY: "auto" }}>
        {comments.map(c => (
          <div key={c.id} style={{ padding: 10, background: "#fffbeb", borderRadius: 6, marginBottom: 6, border: "1px solid #fde68a", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: "#92400e" }}>{c.author}</span>
              <span style={{ fontSize: 8, color: "#b8a060" }}>{c.time}</span>
            </div>
            {c.selection && (
              <div style={{ fontSize: 9, color: "#888", fontStyle: "italic", marginBottom: 4, padding: "3px 6px", background: "#fff8e1", borderRadius: 3, borderLeft: "2px solid #f59e0b" }}>
                &quot;{c.selection}&quot;
              </div>
            )}
            <p style={{ fontSize: 11, color: "#333", margin: 0, lineHeight: 1.5 }}>{c.text}</p>
            <button onClick={() => setComments(prev => prev.filter(x => x.id !== c.id))}
              style={{ position: "absolute", top: 6, right: 6, fontSize: 10, color: "#ccc", border: "none", background: "transparent", cursor: "pointer" }}
              onMouseEnter={e => e.currentTarget.style.color = "#c44"}
              onMouseLeave={e => e.currentTarget.style.color = "#ccc"}>&#x2715;</button>
          </div>
        ))}
        {comments.length === 0 && (
          <div style={{ textAlign: "center", padding: "16px 0", color: "#ccc" }}>
            <p style={{ fontSize: 20, marginBottom: 4 }}>&#x1F4AC;</p>
            <p style={{ fontSize: 10 }}>메모가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
