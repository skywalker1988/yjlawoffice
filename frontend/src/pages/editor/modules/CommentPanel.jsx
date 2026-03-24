/**
 * CommentPanel — MS Word 365 스타일 메모(댓글) 패널
 *
 * 오른쪽 패널에 메모 카드(풍선)를 표시하고, 본문 하이라이트와 연결선으로 연결.
 * 작성, 답글, 편집, 삭제, 해결/다시열기, 탐색 기능 제공.
 * ReviewingPane, CommentIndicators도 포함.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MessageSquare, MoreHorizontal, Check, RotateCcw, Trash2, Pencil, X, Send, Reply } from "lucide-react";
import {
  formatCommentDate, findCommentMarks, getAllThreads,
  loadAuthor, saveAuthor, createAuthor, createComment, generateCommentId,
} from "./comment-store";

/* ─────────────────────────────────────────────
   Author Setup Dialog
   ───────────────────────────────────────────── */
export function AuthorSetupDialog({ onSave, onCancel }) {
  const [name, setName] = useState("");
  const [initials, setInitials] = useState("");
  const nameRef = useRef(null);

  useEffect(() => { nameRef.current?.focus(); }, []);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), initials.trim() || name.trim().charAt(0));
  };

  return (
    <div className="word-dialog-overlay" onClick={onCancel}>
      <div className="word-dialog" style={{ minWidth: 360, maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
        <div className="word-dialog-title">
          <span>사용자 정보 설정</span>
          <button type="button" onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#888" }}>✕</button>
        </div>
        <div className="word-dialog-body" style={{ padding: "20px 24px" }}>
          <div style={{ marginBottom: 16 }}>
            <label className="word-dialog-label">이름(N):</label>
            <input ref={nameRef} className="word-dialog-input" value={name} onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              placeholder="예: 윤세환" />
          </div>
          <div>
            <label className="word-dialog-label">이니셜(I):</label>
            <input className="word-dialog-input" value={initials} onChange={(e) => setInitials(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              placeholder="예: 윤" style={{ width: 100 }} />
          </div>
        </div>
        <div className="word-dialog-footer">
          <button className="word-dialog-btn primary" onClick={handleSave}>확인</button>
          <button className="word-dialog-btn" onClick={onCancel}>취소</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Author Avatar
   ───────────────────────────────────────────── */
function AuthorAvatar({ author, size = 28 }) {
  return (
    <div className="comment-author-avatar" style={{
      width: size, height: size, backgroundColor: author.color,
      borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: size * 0.43, fontWeight: 600, flexShrink: 0,
      letterSpacing: -0.5,
    }}>
      {author.initials}
    </div>
  );
}

/* ─────────────────────────────────────────────
   More Menu (⋯ 드롭다운)
   ───────────────────────────────────────────── */
function MoreMenu({ items, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className="comment-more-menu">
      {items.map((item, i) => (
        item.divider ? (
          <div key={i} className="comment-more-divider" />
        ) : (
          <button key={i} type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); item.onClick?.(); onClose(); }}
            disabled={item.disabled}
            className={`comment-more-item${item.danger ? " danger" : ""}${item.disabled ? " disabled" : ""}`}>
            {item.icon && <span className="comment-more-icon">{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        )
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Single Reply
   ───────────────────────────────────────────── */
function ReplyItem({ reply, index, isOwn, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(reply.content);

  const handleSaveEdit = () => {
    if (editText.trim()) onEdit(index, editText.trim());
    setEditing(false);
  };

  return (
    <div className="comment-reply-item">
      <div className="comment-reply-header">
        <AuthorAvatar author={reply.author} size={22} />
        <span className="comment-author-name" style={{ fontSize: 12 }}>{reply.author.name}</span>
        <span className="comment-timestamp">{formatCommentDate(reply.createdAt)}</span>
        {reply.modifiedAt !== reply.createdAt && <span className="comment-edited-badge">(편집됨)</span>}
        <div style={{ flex: 1 }} />
        {isOwn && (
          <div style={{ position: "relative" }}>
            <button type="button" className="comment-more-btn"
              onClick={() => setMenuOpen(!menuOpen)}>
              <MoreHorizontal size={14} color="#888" />
            </button>
            {menuOpen && (
              <MoreMenu onClose={() => setMenuOpen(false)} items={[
                { label: "답글 편집", icon: <Pencil size={12} />, onClick: () => { setEditing(true); setEditText(reply.content); } },
                { label: "답글 삭제", icon: <Trash2 size={12} />, onClick: () => onDelete(index), danger: true },
              ]} />
            )}
          </div>
        )}
      </div>
      {editing ? (
        <div style={{ marginTop: 4, marginLeft: 28 }}>
          <textarea value={editText} onChange={(e) => setEditText(e.target.value)}
            className="comment-edit-textarea"
            onKeyDown={(e) => { if (e.key === "Escape") setEditing(false); if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); } }}
            autoFocus />
          <div className="comment-edit-actions">
            <button className="word-dialog-btn primary" style={{ padding: "2px 10px", fontSize: 11 }} onClick={handleSaveEdit}>저장</button>
            <button className="word-dialog-btn" style={{ padding: "2px 10px", fontSize: 11 }} onClick={() => setEditing(false)}>취소</button>
          </div>
        </div>
      ) : (
        <div className="comment-content" style={{ marginLeft: 28 }}>{reply.content}</div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Comment Balloon Card
   ───────────────────────────────────────────── */
function CommentBalloon({
  comment, isActive, currentAuthor, editor, dispatch, onActivate,
}) {
  const isNewComment = !comment.content;
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(isNewComment);
  const [editText, setEditText] = useState(comment.content || "");
  const [replyText, setReplyText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);
  const balloonRef = useRef(null);
  const textareaRef = useRef(null);

  const isOwn = currentAuthor && comment.author.id === currentAuthor.id;

  // 새 메모 생성 시 자동 포커스
  useEffect(() => {
    if (isNewComment && editing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isNewComment, editing]);

  const handleSaveEdit = () => {
    if (editText.trim()) {
      dispatch({ type: "EDIT_COMMENT", id: comment.id, content: editText.trim() });
      setEditing(false);
    } else if (isNewComment) {
      if (editor) editor.commands.unsetComment(comment.id);
      dispatch({ type: "DELETE_COMMENT", id: comment.id });
    } else {
      setEditing(false);
    }
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    const reply = createComment(currentAuthor, replyText.trim(), comment.id);
    dispatch({ type: "ADD_REPLY", parentId: comment.id, reply });
    setReplyText("");
    setShowReplyInput(false);
  };

  const handleResolve = () => {
    dispatch({ type: "RESOLVE_COMMENT", id: comment.id, author: currentAuthor });
  };

  const handleReopen = () => {
    dispatch({ type: "REOPEN_COMMENT", id: comment.id });
  };

  const handleDeleteThread = () => {
    if (editor) editor.commands.unsetComment(comment.id);
    dispatch({ type: "DELETE_COMMENT", id: comment.id });
  };

  // 해결된 메모 (축소 뷰)
  if (comment.resolved) {
    return (
      <div ref={balloonRef}
        className={`comment-balloon resolved${isActive ? " active" : ""}`}
        data-comment-id={comment.id}
        onClick={() => onActivate(comment.id)}>
        <div className="comment-resolved-header">
          <Check size={14} color="#4CAF50" />
          <AuthorAvatar author={comment.author} size={20} />
          <span className="comment-resolved-text">{comment.content}</span>
          {isActive && (
            <button type="button" className="comment-reopen-btn"
              onClick={(e) => { e.stopPropagation(); handleReopen(); }}>
              <RotateCcw size={11} /> 다시 열기
            </button>
          )}
        </div>
      </div>
    );
  }

  const moreMenuItems = [
    ...(isOwn ? [{ label: "메모 편집", icon: <Pencil size={12} />, onClick: () => { setEditing(true); setEditText(comment.content); } }] : []),
    { label: "스레드 해결", icon: <Check size={12} />, onClick: handleResolve },
    { divider: true },
    ...(isOwn ? [{ label: "메모 삭제", icon: <Trash2 size={12} />, onClick: handleDeleteThread, danger: true }] : []),
    { label: "스레드 삭제", icon: <Trash2 size={12} />, onClick: handleDeleteThread, danger: true },
  ];

  return (
    <div ref={balloonRef}
      className={`comment-balloon${isActive ? " active" : ""}`}
      data-comment-id={comment.id}
      onClick={() => onActivate(comment.id)}
      style={{ "--author-color": comment.author.color }}>

      {/* 왼쪽 색상 바 */}
      <div className="comment-color-bar" style={{ backgroundColor: isActive ? comment.author.color : "transparent" }} />

      {/* 헤더 */}
      <div className="comment-balloon-header">
        <AuthorAvatar author={comment.author} size={28} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span className="comment-author-name">{comment.author.name}</span>
          <div className="comment-meta-row">
            <span className="comment-timestamp">{formatCommentDate(comment.createdAt)}</span>
            {comment.modifiedAt !== comment.createdAt && <span className="comment-edited-badge">(편집됨)</span>}
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <button type="button" className="comment-more-btn"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}>
            <MoreHorizontal size={16} color="#888" />
          </button>
          {menuOpen && <MoreMenu items={moreMenuItems} onClose={() => setMenuOpen(false)} />}
        </div>
      </div>

      {/* 내용 */}
      {editing ? (
        <div className="comment-edit-area">
          <textarea ref={textareaRef} value={editText} onChange={(e) => setEditText(e.target.value)}
            placeholder={isNewComment ? "메모를 입력하세요..." : ""}
            className="comment-edit-textarea"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                if (isNewComment && !editText.trim()) {
                  if (editor) editor.commands.unsetComment(comment.id);
                  dispatch({ type: "DELETE_COMMENT", id: comment.id });
                } else {
                  setEditing(false);
                }
              }
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
            }}
            autoFocus />
          <div className="comment-edit-actions">
            <button className="comment-action-btn primary" onClick={handleSaveEdit}>
              {isNewComment ? "게시" : "저장"}
            </button>
            <button className="comment-action-btn" onClick={() => {
              if (isNewComment && !editText.trim()) {
                if (editor) editor.commands.unsetComment(comment.id);
                dispatch({ type: "DELETE_COMMENT", id: comment.id });
              } else {
                setEditing(false);
              }
            }}>취소</button>
          </div>
        </div>
      ) : (
        <div className="comment-content">{comment.content}</div>
      )}

      {/* 답글 목록 */}
      {comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map((reply, i) => (
            <ReplyItem key={reply.id || i} reply={reply} index={i}
              isOwn={currentAuthor && reply.author.id === currentAuthor.id}
              onEdit={(idx, content) => dispatch({ type: "EDIT_REPLY", parentId: comment.id, replyIndex: idx, content })}
              onDelete={(idx) => dispatch({ type: "DELETE_REPLY", parentId: comment.id, replyIndex: idx })} />
          ))}
        </div>
      )}

      {/* 답글 입력 / 해결 버튼 (활성 메모만 표시) */}
      {isActive && !editing && (
        <div className="comment-actions-bar">
          {showReplyInput ? (
            <div className="comment-reply-area">
              <textarea className="comment-reply-input" value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="답글을 입력하세요..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); }
                  if (e.key === "Escape") { setShowReplyInput(false); setReplyText(""); }
                }}
                autoFocus />
              <div className="comment-edit-actions">
                <button className="comment-action-btn" onClick={() => { setShowReplyInput(false); setReplyText(""); }}>취소</button>
                <button className="comment-action-btn primary" onClick={handleReply} disabled={!replyText.trim()}>
                  <Send size={11} /> 게시
                </button>
              </div>
            </div>
          ) : (
            <div className="comment-bottom-actions">
              <button className="comment-reply-trigger" onClick={() => setShowReplyInput(true)}>
                <Reply size={12} /> 답글...
              </button>
              <button className="comment-resolve-btn" onClick={handleResolve}>
                <Check size={12} /> 해결
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Comment Panel (오른쪽 패널)
   ───────────────────────────────────────────── */
export function CommentPanel({ editor, commentStore, dispatch, currentAuthor }) {
  const panelRef = useRef(null);
  const [connectLines, setConnectLines] = useState([]);

  const threads = useMemo(() => getAllThreads(commentStore), [commentStore.comments]);

  // 하이라이트 → 풍선 연결선 계산
  const updateConnectLines = useCallback(() => {
    if (!editor || !panelRef.current) return;
    const marks = findCommentMarks(editor);
    const lines = [];
    const panelRect = panelRef.current.getBoundingClientRect();

    marks.forEach((mark) => {
      try {
        const coords = editor.view.coordsAtPos(mark.from);
        const balloonEl = panelRef.current.querySelector(`[data-comment-id="${mark.commentId}"]`);
        if (!balloonEl) return;
        const balloonRect = balloonEl.getBoundingClientRect();

        lines.push({
          commentId: mark.commentId,
          // 본문 하이라이트 오른쪽 끝 Y 좌표 (패널 기준)
          highlightY: coords.top - panelRect.top + panelRef.current.scrollTop + 8,
          // 풍선 상단 중앙 Y 좌표 (패널 기준)
          balloonY: balloonRect.top - panelRect.top + panelRef.current.scrollTop + 14,
        });
      } catch { /* ignore */ }
    });
    setConnectLines(lines);
  }, [editor, commentStore.comments]);

  // 에디터 변경, 스크롤, 리사이즈 시 연결선 업데이트
  useEffect(() => {
    if (!editor) return;
    const debouncedUpdate = debounce(updateConnectLines, 80);

    editor.on("update", debouncedUpdate);
    editor.on("selectionUpdate", debouncedUpdate);

    const scrollParent = editor.view.dom.closest(".editor-canvas-scroll");
    if (scrollParent) scrollParent.addEventListener("scroll", debouncedUpdate);
    window.addEventListener("resize", debouncedUpdate);

    setTimeout(updateConnectLines, 150);

    return () => {
      editor.off("update", debouncedUpdate);
      editor.off("selectionUpdate", debouncedUpdate);
      if (scrollParent) scrollParent.removeEventListener("scroll", debouncedUpdate);
      window.removeEventListener("resize", debouncedUpdate);
    };
  }, [editor, updateConnectLines]);

  // 하이라이트 클릭 → 해당 풍선 활성화
  useEffect(() => {
    if (!editor) return;
    const handleClick = () => {
      const { $from } = editor.state.selection;
      const marks = $from.marks();
      const commentMark = marks.find((m) => m.type.name === "comment");
      if (commentMark) {
        dispatch({ type: "SET_ACTIVE", id: commentMark.attrs.commentId });
      }
    };
    editor.on("selectionUpdate", handleClick);
    return () => editor.off("selectionUpdate", handleClick);
  }, [editor, dispatch]);

  const handleActivate = useCallback((id) => {
    dispatch({ type: "SET_ACTIVE", id });
    if (editor) {
      const marks = findCommentMarks(editor);
      const mark = marks.find((m) => m.commentId === id);
      if (mark) {
        editor.commands.setTextSelection({ from: mark.from, to: mark.to });
        const coords = editor.view.coordsAtPos(mark.from);
        const scrollParent = editor.view.dom.closest(".editor-canvas-scroll");
        if (scrollParent) {
          const rect = scrollParent.getBoundingClientRect();
          if (coords.top < rect.top || coords.top > rect.bottom) {
            scrollParent.scrollTop += coords.top - rect.top - rect.height / 3;
          }
        }
      }
    }
  }, [editor, dispatch]);

  // 마크업 모드에 따른 필터링
  const visibleThreads = useMemo(() => {
    if (commentStore.markupMode === "none" || commentStore.markupMode === "original") return [];
    if (commentStore.markupMode === "simple") return [];
    return threads;
  }, [threads, commentStore.markupMode]);

  if (!commentStore.showCommentsPanel || visibleThreads.length === 0) return null;

  return (
    <div ref={panelRef} className="comments-panel">
      {/* 헤더 */}
      <div className="comments-panel-header">
        <span className="comments-panel-title">
          <MessageSquare size={13} /> 메모 ({visibleThreads.length})
        </span>
        <button type="button" className="comments-panel-close"
          onClick={() => dispatch({ type: "SET_PANEL_VISIBLE", visible: false })}>
          <X size={14} />
        </button>
      </div>

      {/* 풍선 목록 */}
      <div className="comments-balloon-list">
        {visibleThreads.map((comment) => (
          <CommentBalloon
            key={comment.id}
            comment={comment}
            isActive={commentStore.activeCommentId === comment.id}
            currentAuthor={currentAuthor}
            editor={editor}
            dispatch={dispatch}
            onActivate={handleActivate}
          />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Simple Markup Indicators (간단한 태그 모드)
   ───────────────────────────────────────────── */
export function CommentIndicators({ editor, commentStore, dispatch }) {
  const [indicators, setIndicators] = useState([]);

  const updateIndicators = useCallback(() => {
    if (!editor) return;
    const marks = findCommentMarks(editor);
    const pageArea = editor.view.dom.closest(".editor-page-area");
    if (!pageArea) return;
    const pageRect = pageArea.getBoundingClientRect();

    const inds = marks.map((mark) => {
      try {
        const comment = commentStore.comments[mark.commentId];
        if (!comment || comment.resolved) return null;
        const coords = editor.view.coordsAtPos(mark.from);
        return {
          commentId: mark.commentId,
          top: coords.top - pageRect.top,
        };
      } catch { return null; }
    }).filter(Boolean);
    setIndicators(inds);
  }, [editor, commentStore.comments]);

  useEffect(() => {
    if (!editor) return;
    const debounced = debounce(updateIndicators, 100);
    editor.on("update", debounced);
    editor.on("selectionUpdate", debounced);
    const scrollParent = editor.view.dom.closest(".editor-canvas-scroll");
    if (scrollParent) scrollParent.addEventListener("scroll", debounced);
    setTimeout(updateIndicators, 200);
    return () => {
      editor.off("update", debounced);
      editor.off("selectionUpdate", debounced);
      if (scrollParent) scrollParent.removeEventListener("scroll", debounced);
    };
  }, [editor, updateIndicators]);

  if (commentStore.markupMode !== "simple") return null;

  return (
    <>
      {indicators.map((ind) => (
        <div key={ind.commentId}
          className="comment-margin-indicator"
          style={{ top: ind.top }}
          onClick={() => {
            dispatch({ type: "SET_MARKUP_MODE", mode: "all" });
            dispatch({ type: "SET_ACTIVE", id: ind.commentId });
            dispatch({ type: "SET_PANEL_VISIBLE", visible: true });
          }}
          title="메모 보기">
          <MessageSquare size={16} color="#FB8C00" />
        </div>
      ))}
    </>
  );
}

/* ─────────────────────────────────────────────
   Reviewing Pane (검토 창)
   ───────────────────────────────────────────── */
export function ReviewingPane({ mode, commentStore, dispatch, currentAuthor, editor, onClose }) {
  const threads = useMemo(() => getAllThreads(commentStore), [commentStore.comments]);
  const isVertical = mode === "vertical";

  const handleItemClick = (commentId) => {
    dispatch({ type: "SET_ACTIVE", id: commentId });
    if (editor) {
      const marks = findCommentMarks(editor);
      const mark = marks.find((m) => m.commentId === commentId);
      if (mark) {
        editor.commands.setTextSelection({ from: mark.from, to: mark.to });
        const coords = editor.view.coordsAtPos(mark.from);
        const scrollParent = editor.view.dom.closest(".editor-canvas-scroll");
        if (scrollParent) {
          const rect = scrollParent.getBoundingClientRect();
          scrollParent.scrollTop += coords.top - rect.top - rect.height / 3;
        }
      }
    }
  };

  return (
    <div className={`reviewing-pane ${isVertical ? "reviewing-pane-vertical" : "reviewing-pane-horizontal"}`}>
      {/* 헤더 */}
      <div className="reviewing-pane-header">
        <div>
          <span className="reviewing-pane-title">검토 창</span>
          <span className="reviewing-pane-count">메모: {threads.length}개</span>
        </div>
        <button type="button" onClick={onClose} className="reviewing-pane-close">
          <X size={14} />
        </button>
      </div>

      {/* 목록 */}
      <div className="reviewing-pane-list">
        {threads.map((comment) => (
          <div key={comment.id}
            className={`reviewing-pane-item${commentStore.activeCommentId === comment.id ? " active" : ""}`}
            onClick={() => handleItemClick(comment.id)}>
            <div className="reviewing-pane-item-header">
              <AuthorAvatar author={comment.author} size={20} />
              <span className="reviewing-pane-item-name">{comment.author.name}</span>
              <span className="reviewing-pane-item-date">{formatCommentDate(comment.createdAt)}</span>
              {comment.resolved && <Check size={12} color="#4CAF50" />}
            </div>
            <div className="reviewing-pane-item-content">{comment.content}</div>
            {comment.replies.length > 0 && (
              <div className="reviewing-pane-item-replies">
                <Reply size={10} /> 답글 {comment.replies.length}개
              </div>
            )}
          </div>
        ))}

        {threads.length === 0 && (
          <div className="reviewing-pane-empty">
            <MessageSquare size={24} color="#ccc" />
            <span>메모가 없습니다.</span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Utility ── */
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
