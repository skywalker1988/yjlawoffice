/** 실시간 채팅 위젯 — 플로팅 버튼 + 채팅창, 챗봇 API 연동 */
import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "../utils/api";

const T = { accent: "var(--accent-gold)", text: "var(--text-primary)", textSec: "var(--text-secondary)", textMuted: "var(--text-muted)" };

const QUICK_REPLIES = ["상담 비용", "상담 예약", "업무분야", "찾아오시는 길"];
const SESSION_KEY = "chatbot_session_id";
const GREETING = "안녕하세요! 윤정 법률사무소입니다. 무엇을 도와드릴까요?";

/** 고유 세션 ID 생성/조회 */
function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = "sess_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const listRef = useRef(null);

  /** 채팅창 열 때 인사 메시지 추가 */
  const handleOpen = useCallback(() => {
    setOpen(true);
    if (!initialized) {
      setMessages([{ role: "bot", content: GREETING }]);
      setInitialized(true);
    }
  }, [initialized]);

  /** 스크롤 하단 고정 */
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  /** 메시지 전송 */
  const sendMessage = async (text) => {
    const content = (text || input).trim();
    if (!content || sending) return;

    const userMsg = { role: "user", content };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    try {
      const json = await api.post("/chatbot/chat", { message: content, sessionId: getSessionId() });
      const botReply = json.data?.reply || json.data?.message || "죄송합니다. 잠시 후 다시 시도해주세요.";
      setMessages((prev) => [...prev, { role: "bot", content: botReply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", content: "네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요." }]);
    } finally {
      setSending(false);
    }
  };

  /** 퀵 리플라이 클릭 */
  const handleQuickReply = (text) => sendMessage(text);

  return (
    <>
      {/* ==================== 토글 버튼 ==================== */}
      {!open && (
        <button
          onClick={handleOpen}
          style={{
            position: "fixed", bottom: 90, right: 24, zIndex: 9999,
            width: 56, height: 56, borderRadius: "50%",
            background: T.accent, border: "none", cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "transform 0.2s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          title="법률 상담 도우미"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      )}

      {/* ==================== 채팅 창 ==================== */}
      {open && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          width: 360, height: 480,
          background: "#fff", borderRadius: 14,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* 헤더 */}
          <div style={{
            padding: "14px 18px",
            background: T.accent,
            color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 15, fontWeight: 600 }}>법률 상담 도우미</span>
            <button
              onClick={() => setOpen(false)}
              style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", padding: "0 4px", lineHeight: 1 }}
            >
              &#10005;
            </button>
          </div>

          {/* 메시지 목록 */}
          <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
                <div style={{
                  maxWidth: "80%", padding: "10px 14px", borderRadius: 14, fontSize: 13, lineHeight: 1.6,
                  background: msg.role === "user" ? T.accent : "#f0f0f0",
                  color: msg.role === "user" ? "#fff" : T.text,
                  borderBottomRightRadius: msg.role === "user" ? 4 : 14,
                  borderBottomLeftRadius: msg.role === "bot" ? 4 : 14,
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* 퀵 리플라이 (첫 인사 후 표시) */}
            {messages.length === 1 && messages[0].role === "bot" && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                {QUICK_REPLIES.map((qr) => (
                  <button
                    key={qr}
                    onClick={() => handleQuickReply(qr)}
                    style={{
                      padding: "6px 14px", fontSize: 12, borderRadius: 16,
                      border: `1px solid ${T.accent}`, background: "transparent",
                      color: T.accent, cursor: "pointer", fontWeight: 500,
                    }}
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}

            {sending && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "10px 14px", borderRadius: 14, background: "#f0f0f0", fontSize: 13, color: T.textMuted }}>
                  &#8230; 답변 작성 중
                </div>
              </div>
            )}
          </div>

          {/* 입력 영역 */}
          <div style={{
            padding: "10px 14px", borderTop: "1px solid #eee",
            display: "flex", gap: 8, flexShrink: 0,
          }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
              placeholder="메시지를 입력하세요..."
              style={{
                flex: 1, padding: "10px 14px", fontSize: 13, border: "1px solid #ddd",
                borderRadius: 20, outline: "none", fontFamily: "inherit",
              }}
              disabled={sending}
            />
            <button
              onClick={() => sendMessage()}
              disabled={sending || !input.trim()}
              style={{
                width: 40, height: 40, borderRadius: "50%",
                background: input.trim() ? T.accent : "#ddd",
                border: "none", cursor: input.trim() ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.2s",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
