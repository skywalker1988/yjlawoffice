/**
 * CommentPanel — Right-side panel showing comment balloons aligned with highlights.
 * Also includes CommentBalloon, AuthorSetupDialog, and ReviewingPane.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MessageSquare, MoreHorizontal, Check, RotateCcw, Trash2, Pencil, X, Send } from "lucide-react";
import {
  formatCommentDate, findCommentMarks, getAllThreads,
  loadAuthor, saveAuthor, createAuthor, createComment, generateCommentId,
} from "./comment-store";

// ─────────────── Author Setup Dialog ───────────────
export function AuthorSetupDialog({ onSave, onCancel }) {
  const [name, setName] = useState("");
  const [initials, setInitials] = useState("");
  const nameRef = useRef(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  useEffect(() => {
    if (name && !initials) {
      // auto-generate initials from name
    }
  }, [name]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), initials.trim() || name.trim().charAt(0));
  };

  return (
    <div className="word-dialog-overlay" onClick={onCancel}>
      <div className="word-dialog" style={{ minWidth: 340, maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
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

// ─────────────── Author Avatar ───────────────
function AuthorAvatar({ author, size = 28 }) {
  return (
    <div className="comment-author-avatar" style={{
      width: size, height: size, backgroundColor: author.color,
      borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontSize: size * 0.43, fontWeight: 600, flexShrink: 0,
    }}>
      {author.initials}
    </div>
  );
}

// ─────────────── More Menu ───────────────
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
    <div ref={ref} style={{
      position: "absolute", top: "100%", right: 0, zIndex: 300,
      background: "#fff", border: "1px solid #d1d5db", borderRadius: 4,
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)", minWidth: 160, padding: "4px 0",
    }}>
      {items.map((item, i) => (
        item.divider ? (
          <div key={i} style={{ height: 1, background: "#e5e5e5", margin: "3px 0" }} />
        ) : (
          <button key={i} type="button"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); item.onClick?.(); onClose(); }}
            disabled={item.disabled}
            style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "6px 12px", border: "none", background: "transparent",
              cursor: item.disabled ? "default" : "pointer", fontSize: 12, textAlign: "left",
              color: item.danger ? "#dc2626" : item.disabled ? "#bbb" : "#333",
              fontFamily: "'Segoe UI', '맑은 고딕', sans-serif",
              opacity: item.disabled ? 0.5 : 1,
            }}
            onMouseEnter={(e) => { if (!item.disabled) e.currentTarget.style.background = "#eff6ff"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            {item.icon && <span style={{ width: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        )
      ))}
    </div>
  );
}

// ─────────────── Single Reply ───────────────
function ReplyItem({ reply, index, isOwn, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(reply.content);

  const handleSaveEdit = () => {
    if (editText.trim()) {
      onEdit(index, editText.trim());
    }
    setEditing(false);
  };

  return (
    <div style={{ borderTop: "1px solid #F0F0F0", padding: "8px 0 4px", position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <AuthorAvatar author={reply.author} size={22} />
        <span className="comment-author-name" style={{ fontSize: 12 }}>{reply.author.name}</span>
        <span className="comment-timestamp">{formatCommentDate(reply.createdAt)}</span>
        {reply.modifiedAt !== reply.createdAt && <span style={{ fontSize: 10, color: "#aaa" }}>(편집됨)</span>}
        <div style={{ flex: 1 }} />
        {isOwn && (
          <div style={{ position: "relative" }}>
            <button type="button" className="comment-more-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", borderRadius: 2, opacity: 0, transition: "opacity 0.15s" }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.6"; }}
              onMouseLeave={(e) => { if (!menuOpen) e.currentTarget.style.opacity = "0"; }}
            >
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
        <div style={{ marginTop: 4 }}>
          <textarea value={editText} onChange={(e) => setEditText(e.target.value)}
            style={{ width: "100%", border: "1px solid #4A86C8", borderRadius: 4, padding: "4px 6px", fontSize: 12, resize: "none", minHeight: 40, fontFamily: "inherit", outline: "none" }}
            onKeyDown={(e) => { if (e.key === "Escape") setEditing(false); if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); } }}
            autoFocus
          />
          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
            <button className="word-dialog-btn primary" style={{ padding: "2px 10px", fontSize: 11 }} onClick={handleSaveEdit}>저장</button>
            <button className="word-dialog-btn" style={{ padding: "2px 10px", fontSize: 11 }} onClick={() => setEditing(false)}>취소</button>
          </div>
        </div>
      ) : (
        <div className="comment-content" style={{ fontSize: 12, marginLeft: 28 }}>{reply.content}</div>
      )}
    </div>
  );
}

// ─────────────── Comment Balloon Card ───────────────
function CommentBalloon({
  comment, isActive, currentAuthor, editor, dispatch,
  onActivate, markPosition, panelScrollTop,
}) {
  const isNewComment = !comment.content;
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(isNewComment);
  const [editText, setEditText] = useState(comment.content || "");
  const [replyText, setReplyText] = useState("");
  const [showReplyInput, setShowReplyInput] = useState(false);
  const balloonRef = useRef(null);

  const isOwn = currentAuthor && comment.author.id === currentAuthor.id;

  const handleSaveEdit = () => {
    if (editText.trim()) {
      dispatch({ type: "EDIT_COMMENT", id: comment.id, content: editText.trim() });
      setEditing(false);
    } else if (isNewComment) {
      // Empty new comment — delete it
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
    // Remove mark from editor
    if (editor) editor.commands.unsetComment(comment.id);
    dispatch({ type: "DELETE_COMMENT", id: comment.id });
  };

  const handleDeleteComment = () => {
    if (editor) editor.commands.unsetComment(comment.id);
    dispatch({ type: "DELETE_COMMENT", id: comment.id });
  };

  // Resolved view (collapsed)
  if (comment.resolved) {
    return (
      <div
        ref={balloonRef}
        className="comment-balloon resolved"
        data-comment-id={comment.id}
        onClick={() => onActivate(comment.id)}
        style={{
          cursor: "pointer",
          opacity: 0.7,
          padding: "6px 12px",
          display: "flex", alignItems: "center", gap: 6,
        }}
      >
        <Check size={14} color="#4CAF50" />
        <AuthorAvatar author={comment.author} size={20} />
        <span style={{ fontSize: 12, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {comment.content}
        </span>
        {isActive && (
          <button type="button" onClick={(e) => { e.stopPropagation(); handleReopen(); }}
            style={{ background: "none", border: "1px solid #ccc", borderRadius: 3, cursor: "pointer", padding: "2px 8px", fontSize: 11, color: "#555", whiteSpace: "nowrap" }}>
            다시 열기
          </button>
        )}
      </div>
    );
  }

  const moreMenuItems = [
    ...(isOwn ? [{ label: "메모 편집", icon: <Pencil size={12} />, onClick: () => { setEditing(true); setEditText(comment.content); } }] : []),
    { label: "스레드 해결", icon: <Check size={12} />, onClick: handleResolve },
    { divider: true },
    ...(isOwn ? [{ label: "메모 삭제", icon: <Trash2 size={12} />, onClick: handleDeleteComment, danger: true }] : []),
    { label: "스레드 삭제", icon: <Trash2 size={12} />, onClick: handleDeleteThread, danger: true },
  ];

  return (
    <div
      ref={balloonRef}
      className={`comment-balloon${isActive ? " active" : ""}`}
      data-comment-id={comment.id}
      onClick={() => onActivate(comment.id)}
      style={{
        "--author-color": comment.author.color,
        borderLeftColor: isActive ? comment.author.color : undefined,
        borderLeftWidth: isActive ? 3 : 1,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <AuthorAvatar author={comment.author} size={28} />
        <div style={{ flex: 1 }}>
          <span className="comment-author-name">{comment.author.name}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span className="comment-timestamp">{formatCommentDate(comment.createdAt)}</span>
            {comment.modifiedAt !== comment.createdAt && <span style={{ fontSize: 10, color: "#aaa" }}>(편집됨)</span>}
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <button type="button" className="comment-more-btn"
            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
            style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", borderRadius: 2 }}
          >
            <MoreHorizontal size={16} color="#888" />
          </button>
          {menuOpen && <MoreMenu items={moreMenuItems} onClose={() => setMenuOpen(false)} />}
        </div>
      </div>

      {/* Content */}
      {editing ? (
        <div>
          <textarea value={editText} onChange={(e) => setEditText(e.target.value)}
            placeholder={isNewComment ? "메모 내용을 입력하세요..." : ""}
            style={{ width: "100%", border: "1px solid #4A86C8", borderRadius: 4, padding: "6px 8px", fontSize: 13, resize: "none", minHeight: 50, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                if (isNewComment && !editText.trim()) {
                  // Cancel new empty comment
                  if (editor) editor.commands.unsetComment(comment.id);
                  dispatch({ type: "DELETE_COMMENT", id: comment.id });
                } else {
                  setEditing(false);
                }
              }
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSaveEdit(); }
            }}
            autoFocus
          />
          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
            <button className="word-dialog-btn primary" style={{ padding: "3px 12px", fontSize: 11 }} onClick={handleSaveEdit}>
              {isNewComment ? "게시" : "저장"}
            </button>
            <button className="word-dialog-btn" style={{ padding: "3px 12px", fontSize: 11 }} onClick={() => {
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
        <div className="comment-content" style={{ whiteSpace: "pre-wrap" }}>{comment.content}</div>
      )}

      {/* Replies */}
      {comment.replies.map((reply, i) => (
        <ReplyItem
          key={reply.id || i}
          reply={reply}
          index={i}
          isOwn={currentAuthor && reply.author.id === currentAuthor.id}
          onEdit={(idx, content) => dispatch({ type: "EDIT_REPLY", parentId: comment.id, replyIndex: idx, content })}
          onDelete={(idx) => dispatch({ type: "DELETE_REPLY", parentId: comment.id, replyIndex: idx })}
        />
      ))}

      {/* Reply input */}
      {isActive && (
        <div style={{ marginTop: 8 }}>
          {showReplyInput ? (
            <div>
              <textarea
                className="comment-reply-input"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="답글..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(); }
                  if (e.key === "Escape") { setShowReplyInput(false); setReplyText(""); }
                }}
                autoFocus
              />
              <div style={{ display: "flex", gap: 4, marginTop: 4, justifyContent: "flex-end" }}>
                <button className="word-dialog-btn" style={{ padding: "2px 10px", fontSize: 11 }}
                  onClick={() => { setShowReplyInput(false); setReplyText(""); }}>취소</button>
                <button className="word-dialog-btn primary" style={{ padding: "2px 10px", fontSize: 11 }}
                  onClick={handleReply} disabled={!replyText.trim()}>게시</button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button onClick={() => setShowReplyInput(true)}
                style={{ flex: 1, textAlign: "left", border: "1px solid #E0E0E0", borderRadius: 4, padding: "6px 8px", fontSize: 12, color: "#999", cursor: "pointer", background: "#fafafa" }}>
                답글...
              </button>
              <button onClick={handleResolve}
                style={{ border: "1px solid #4CAF50", borderRadius: 4, padding: "4px 12px", fontSize: 11, color: "#4CAF50", cursor: "pointer", background: "transparent", display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                <Check size={12} /> 해결
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────── Comment Panel (right side) ───────────────
export function CommentPanel({ editor, commentStore, dispatch, currentAuthor }) {
  const panelRef = useRef(null);
  const [balloonPositions, setBalloonPositions] = useState({});

  const threads = useMemo(() => getAllThreads(commentStore), [commentStore.comments]);

  // Calculate balloon positions aligned with highlights
  const updatePositions = useCallback(() => {
    if (!editor || !panelRef.current) return;
    const marks = findCommentMarks(editor);
    const positions = {};
    const editorDom = editor.view.dom;
    const panelRect = panelRef.current.getBoundingClientRect();
    const editorRect = editorDom.getBoundingClientRect();

    // Get scrollable parent
    let scrollParent = editorDom.closest(".editor-canvas-scroll");
    const scrollTop = scrollParent ? scrollParent.scrollTop : 0;
    const scrollRect = scrollParent ? scrollParent.getBoundingClientRect() : editorRect;

    marks.forEach((mark) => {
      try {
        const coords = editor.view.coordsAtPos(mark.from);
        // Position relative to panel's coordinate space
        const relativeTop = coords.top - scrollRect.top + scrollTop;
        positions[mark.commentId] = relativeTop;
      } catch {
        // ignore position errors
      }
    });

    // Push-down logic to avoid overlapping balloons
    const sortedIds = Object.entries(positions)
      .sort(([, a], [, b]) => a - b)
      .map(([id]) => id);

    let lastBottom = 0;
    const GAP = 8;
    const BALLOON_MIN_HEIGHT = 80;

    for (const id of sortedIds) {
      const balloonEl = panelRef.current.querySelector(`[data-comment-id="${id}"]`);
      const balloonHeight = balloonEl ? balloonEl.offsetHeight : BALLOON_MIN_HEIGHT;
      const desired = positions[id];

      if (desired < lastBottom + GAP) {
        positions[id] = lastBottom + GAP;
      }
      lastBottom = positions[id] + balloonHeight;
    }

    setBalloonPositions(positions);
  }, [editor, commentStore.comments]);

  // Update positions on editor changes, scroll, and window resize
  useEffect(() => {
    if (!editor) return;
    const debouncedUpdate = debounce(updatePositions, 50);

    editor.on("update", debouncedUpdate);
    editor.on("selectionUpdate", debouncedUpdate);

    const scrollParent = editor.view.dom.closest(".editor-canvas-scroll");
    if (scrollParent) scrollParent.addEventListener("scroll", debouncedUpdate);
    window.addEventListener("resize", debouncedUpdate);

    // Initial calculation
    setTimeout(updatePositions, 100);

    return () => {
      editor.off("update", debouncedUpdate);
      editor.off("selectionUpdate", debouncedUpdate);
      if (scrollParent) scrollParent.removeEventListener("scroll", debouncedUpdate);
      window.removeEventListener("resize", debouncedUpdate);
    };
  }, [editor, updatePositions]);

  // Click on highlight → activate balloon
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
    // Scroll to highlight in editor
    if (editor) {
      const marks = findCommentMarks(editor);
      const mark = marks.find((m) => m.commentId === id);
      if (mark) {
        editor.commands.setTextSelection({ from: mark.from, to: mark.to });
        // Scroll into view
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

  // Filter based on markup mode
  const visibleThreads = useMemo(() => {
    if (commentStore.markupMode === "none" || commentStore.markupMode === "original") return [];
    if (commentStore.markupMode === "simple") return []; // simple mode shows indicators instead
    return threads;
  }, [threads, commentStore.markupMode]);

  if (!commentStore.showCommentsPanel || visibleThreads.length === 0) return null;

  return (
    <div ref={panelRef} className="comments-panel" style={{
      width: 260, minWidth: 200, maxWidth: 350,
      background: "#FAFAFA", borderLeft: "1px solid #E0E0E0",
      overflowY: "auto", padding: "8px", flexShrink: 0,
      position: "relative",
    }}>
      <div style={{ fontSize: 11, color: "#888", padding: "4px 8px 8px", borderBottom: "1px solid #eee", marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span>메모 ({visibleThreads.length})</span>
        <button type="button" onClick={() => dispatch({ type: "SET_PANEL_VISIBLE", visible: false })}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#999", padding: "0 2px" }}>
          <X size={14} />
        </button>
      </div>

      {/* Positioned balloons */}
      <div style={{ position: "relative" }}>
        {visibleThreads.map((comment) => (
          <div key={comment.id} style={{
            marginBottom: 8,
            transition: "transform 0.15s ease",
          }}>
            <CommentBalloon
              comment={comment}
              isActive={commentStore.activeCommentId === comment.id}
              currentAuthor={currentAuthor}
              editor={editor}
              dispatch={dispatch}
              onActivate={handleActivate}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────── Simple Markup Indicators ───────────────
export function CommentIndicators({ editor, commentStore, dispatch }) {
  const [indicators, setIndicators] = useState([]);

  const updateIndicators = useCallback(() => {
    if (!editor) return;
    const marks = findCommentMarks(editor);
    const scrollParent = editor.view.dom.closest(".editor-canvas-scroll");
    const pageArea = editor.view.dom.closest(".editor-page-area");
    if (!pageArea) return;
    const pageRect = pageArea.getBoundingClientRect();

    const inds = marks.map((mark) => {
      try {
        // Only show unresolved
        const comment = commentStore.comments[mark.commentId];
        if (!comment || comment.resolved) return null;

        const coords = editor.view.coordsAtPos(mark.from);
        return {
          commentId: mark.commentId,
          top: coords.top - pageRect.top,
          right: 8,
        };
      } catch {
        return null;
      }
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
          style={{ position: "absolute", top: ind.top, right: -30, cursor: "pointer" }}
          onClick={() => {
            dispatch({ type: "SET_MARKUP_MODE", mode: "all" });
            dispatch({ type: "SET_ACTIVE", id: ind.commentId });
            dispatch({ type: "SET_PANEL_VISIBLE", visible: true });
          }}
          title="메모 보기"
        >
          <MessageSquare size={16} color="#FB8C00" />
        </div>
      ))}
    </>
  );
}

// ─────────────── Reviewing Pane ───────────────
export function ReviewingPane({ mode, commentStore, dispatch, currentAuthor, editor, onClose }) {
  const threads = useMemo(() => getAllThreads(commentStore), [commentStore.comments]);

  const isVertical = mode === "vertical";

  const handleItemClick = (commentId) => {
    dispatch({ type: "SET_ACTIVE", id: commentId });
    // scroll to highlight
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
    <div className={isVertical ? "reviewing-pane-vertical" : "reviewing-pane-horizontal"} style={{
      ...(isVertical ? { width: 300, borderRight: "1px solid #E0E0E0" } : { height: 200, borderTop: "1px solid #E0E0E0" }),
      background: "#FAFAFA", overflowY: "auto", flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: "10px 12px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontSize: 12, fontWeight: 600 }}>검토 창</span>
          <span style={{ fontSize: 11, color: "#888", marginLeft: 8 }}>메모: {threads.length}개</span>
        </div>
        <button type="button" onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}>
          <X size={14} />
        </button>
      </div>

      {/* List */}
      {threads.map((comment) => (
        <div key={comment.id}
          onClick={() => handleItemClick(comment.id)}
          style={{
            padding: "8px 12px", borderBottom: "1px solid #f0f0f0", cursor: "pointer",
            background: commentStore.activeCommentId === comment.id ? "#e8f0fe" : "transparent",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = commentStore.activeCommentId === comment.id ? "#e8f0fe" : "#f5f5f5"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = commentStore.activeCommentId === comment.id ? "#e8f0fe" : "transparent"; }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
            <AuthorAvatar author={comment.author} size={20} />
            <span style={{ fontSize: 12, fontWeight: 500 }}>{comment.author.name}</span>
            <span style={{ fontSize: 10, color: "#888" }}>{formatCommentDate(comment.createdAt)}</span>
            {comment.resolved && <Check size={12} color="#4CAF50" />}
          </div>
          <div style={{ fontSize: 12, color: "#555", marginLeft: 26, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {comment.content}
          </div>
          {comment.replies.length > 0 && (
            <div style={{ fontSize: 11, color: "#999", marginLeft: 26, marginTop: 2 }}>
              답글 {comment.replies.length}개
            </div>
          )}
        </div>
      ))}

      {threads.length === 0 && (
        <div style={{ padding: 20, textAlign: "center", color: "#999", fontSize: 12 }}>
          메모가 없습니다.
        </div>
      )}
    </div>
  );
}

// ─── Utility ───
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
