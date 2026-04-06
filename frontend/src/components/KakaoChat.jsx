/** 카카오톡 상담 버튼 — 고정 위치 플로팅 버튼 */

const KAKAO_CHAT_URL = "https://pf.kakao.com/_xnxnxn/chat";

export default function KakaoChat() {
  const handleClick = () => {
    window.open(KAKAO_CHAT_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      onClick={handleClick}
      title="카카오톡 상담"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9998,
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "#FEE500",
        border: "none",
        cursor: "pointer",
        boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 26,
        transition: "transform 0.2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M14 4C8.477 4 4 7.582 4 12c0 2.87 1.89 5.39 4.726 6.836l-.96 3.56c-.08.296.256.536.512.368L12.4 20.2c.52.06 1.06.1 1.6.1 5.523 0 10-3.582 10-8s-4.477-8-10-8z" fill="#3C1E1E"/>
      </svg>
    </button>
  );
}
