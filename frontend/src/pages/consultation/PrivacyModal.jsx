/** 개인정보 수집·이용 동의서 모달 — 스크롤 완료 + 서명 후 동의 가능 */
import { useState, useRef, useCallback } from "react";
import useSignaturePad from "./useSignaturePad";

/** 스크롤 끝 감지를 위한 여유 픽셀 */
const SCROLL_BOTTOM_THRESHOLD = 10;

/**
 * @param {{ onClose: () => void, onAgreed: () => void }} props
 */
export default function PrivacyModal({ onClose, onAgreed }) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const privacyRef = useRef(null);
  const { signatureData, canvasProps, clear, confirm } = useSignaturePad();

  /** 스크롤 감지 — 끝까지 읽어야 동의 버튼 활성화 */
  const handleScroll = useCallback(() => {
    const el = privacyRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - SCROLL_BOTTOM_THRESHOLD) {
      setScrolledToBottom(true);
    }
  }, []);

  const canAgree = scrolledToBottom && signatureData;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", maxWidth: 600, width: "90%", maxHeight: "85vh", display: "flex", flexDirection: "column" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div style={{ padding: "24px 28px 16px", borderBottom: "1px solid var(--border-color)" }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text-primary)" }}>개인정보 수집·이용 동의서</h3>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>끝까지 읽으신 후 동의해주세요</p>
        </div>

        {/* 본문 스크롤 영역 */}
        <div
          ref={privacyRef}
          onScroll={handleScroll}
          style={{ flex: 1, overflowY: "auto", padding: "24px 28px", fontSize: 13, color: "#444", lineHeight: 1.9 }}
        >
          <PrivacyContent />
        </div>

        {/* 서명 + 버튼 */}
        <div style={{ padding: "16px 28px 24px", borderTop: "1px solid var(--border-color)" }}>
          {scrolledToBottom && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 8, fontWeight: 500 }}>
                본인 이름을 서명해주세요
              </p>
              <div style={{ border: "1px solid rgba(0,0,0,0.15)", background: "#fff", position: "relative" }}>
                <canvas {...canvasProps} />
                {!signatureData && (
                  <p style={{
                    position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                    fontSize: 12, color: "#ccc", pointerEvents: "none",
                  }}>
                    여기에 이름을 서명하세요
                  </p>
                )}
              </div>
              <div className="flex gap-2" style={{ marginTop: 8 }}>
                <button type="button" onClick={clear}
                  style={{ fontSize: 11, color: "var(--text-muted)", background: "none", border: "1px solid var(--gray-100)", padding: "4px 12px", cursor: "pointer" }}>
                  다시 쓰기
                </button>
                <button type="button" onClick={confirm}
                  style={{ fontSize: 11, color: "var(--accent-gold)", background: "none", border: "1px solid var(--accent-gold)", padding: "4px 12px", cursor: "pointer" }}>
                  서명 완료
                </button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 24px", fontSize: 13, background: "#f5f5f5",
                border: "1px solid rgba(0,0,0,0.1)", cursor: "pointer", color: "var(--gray-500)",
              }}
            >
              닫기
            </button>
            <button
              type="button"
              disabled={!canAgree}
              onClick={onAgreed}
              style={{
                padding: "10px 24px", fontSize: 13, fontWeight: 600,
                background: canAgree ? "var(--accent-gold)" : "#ddd",
                color: canAgree ? "#fff" : "var(--text-muted)",
                border: "none", cursor: canAgree ? "pointer" : "not-allowed",
              }}
            >
              {!scrolledToBottom ? "끝까지 읽어주세요 ↓" : !signatureData ? "서명을 완료해주세요" : "네, 확인했습니다"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 개인정보 동의서 본문 내용 */
function PrivacyContent() {
  return (
    <>
      <p style={{ fontWeight: 600, marginBottom: 12 }}>1. 개인정보의 수집·이용 목적</p>
      <p style={{ marginBottom: 16 }}>
        윤정 법률사무소는 법률 상담 서비스 제공을 위해 아래와 같이 개인정보를 수집·이용합니다.
        수집된 개인정보는 법률 상담 접수, 상담 진행 상황 안내, 담당 변호사 배정 및 연락 목적으로만
        사용됩니다.
      </p>

      <p style={{ fontWeight: 600, marginBottom: 12 }}>2. 수집하는 개인정보 항목</p>
      <p style={{ marginBottom: 8 }}><strong>필수항목:</strong> 성명, 연락처(휴대전화번호)</p>
      <p style={{ marginBottom: 16 }}><strong>선택항목:</strong> 이메일 주소, 희망 상담 일시, 상담 내용</p>

      <p style={{ fontWeight: 600, marginBottom: 12 }}>3. 개인정보의 보유 및 이용 기간</p>
      <p style={{ marginBottom: 16 }}>
        수집된 개인정보는 상담 완료일로부터 <strong>3년간</strong> 보관 후 지체 없이 파기합니다.
        다만, 관련 법령에 따라 보존이 필요한 경우에는 해당 법령에서 정한 기간 동안 보관합니다.
      </p>
      <ul style={{ marginBottom: 16, paddingLeft: 20, listStyleType: "disc" }}>
        <li>「변호사법」에 따른 사건 기록 보존: 사건 종결 후 5년</li>
        <li>「전자상거래 등에서의 소비자보호에 관한 법률」에 따른 계약 또는 청약철회 등에 관한 기록: 5년</li>
        <li>「통신비밀보호법」에 따른 통신사실확인자료: 1년</li>
      </ul>

      <p style={{ fontWeight: 600, marginBottom: 12 }}>4. 개인정보의 제3자 제공</p>
      <p style={{ marginBottom: 16 }}>
        윤정 법률사무소는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
        다만, 다음의 경우에는 예외로 합니다.
      </p>
      <ul style={{ marginBottom: 16, paddingLeft: 20, listStyleType: "disc" }}>
        <li>정보주체로부터 별도의 동의를 받은 경우</li>
        <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
      </ul>

      <p style={{ fontWeight: 600, marginBottom: 12 }}>5. 개인정보의 파기 절차 및 방법</p>
      <p style={{ marginBottom: 16 }}>
        보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다.
        전자적 파일 형태의 정보는 복구 및 재생이 불가능한 방법으로 파기하며,
        종이에 기록된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.
      </p>

      <p style={{ fontWeight: 600, marginBottom: 12 }}>6. 정보주체의 권리·의무 및 행사 방법</p>
      <p style={{ marginBottom: 16 }}>
        정보주체는 개인정보의 열람, 정정·삭제, 처리정지를 요구할 수 있습니다.
        이러한 요청은 전화(02-594-5583) 또는 이메일(younsehwan@younjeong.com)을 통해
        하실 수 있으며, 지체 없이 조치하겠습니다.
      </p>

      <p style={{ fontWeight: 600, marginBottom: 12 }}>7. 개인정보 보호책임자</p>
      <p style={{ marginBottom: 8 }}>성명: 윤세환 변호사</p>
      <p style={{ marginBottom: 8 }}>연락처: 02-594-5583</p>
      <p style={{ marginBottom: 16 }}>이메일: younsehwan@younjeong.com</p>

      <p style={{ fontWeight: 600, marginBottom: 12 }}>8. 동의를 거부할 권리 및 불이익</p>
      <p style={{ marginBottom: 16 }}>
        귀하는 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다.
        다만, 필수항목에 대한 동의를 거부하실 경우 상담 신청 접수가 불가합니다.
      </p>

      <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 16, marginTop: 8 }}>
        <p style={{ fontSize: 11, color: "var(--text-muted)" }}>
          본 동의서는 「개인정보 보호법」 제15조(개인정보의 수집·이용), 제17조(개인정보의 제공),
          제22조(동의를 받는 방법) 및 동법 시행령에 근거하여 작성되었습니다.
        </p>
      </div>
    </>
  );
}
