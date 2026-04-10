/** 상담안내 페이지 FAQ 아코디언 섹션 */
import { useState } from "react";
import { FAQ_ITEMS } from "./consultationConstants";

/** FAQ 아코디언 펼침 시 최대 높이 (px) */
const FAQ_MAX_HEIGHT = 200;

export default function ConsultationFAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  function handleToggle(index) {
    setOpenIndex((prev) => (prev === index ? null : index));
  }

  return (
    <section className="section" style={{ background: "#fff", borderTop: "1px solid var(--border-subtle)" }}>
      <div className="container" style={{ maxWidth: 720 }}>
        {/* 섹션 제목 */}
        <div className="text-center reveal" style={{ marginBottom: 48 }}>
          <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.25em", color: "var(--accent-gold)", marginBottom: 14 }}>
            FAQ
          </p>
          <h2 className="font-serif" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", fontWeight: 300, color: "var(--text-primary)" }}>
            자주 묻는 질문
          </h2>
        </div>

        {/* 아코디언 목록 */}
        <div className="reveal" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} style={{ borderBottom: "1px solid var(--border-color)" }}>
                <button
                  type="button"
                  onClick={() => handleToggle(idx)}
                  className="w-full text-left flex items-center justify-between transition-colors duration-200 hover:bg-[#fafaf9]"
                  style={{ padding: "20px 4px", cursor: "pointer", background: "transparent", border: "none" }}
                >
                  <span style={{ fontSize: 15, color: "var(--text-primary)", fontWeight: 400, flex: 1, paddingRight: 16 }}>
                    {item.q}
                  </span>
                  <span
                    style={{
                      fontSize: 18,
                      color: "var(--accent-gold)",
                      transition: "transform 0.3s ease",
                      transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                      flexShrink: 0,
                    }}
                  >
                    +
                  </span>
                </button>
                <div
                  style={{
                    maxHeight: isOpen ? FAQ_MAX_HEIGHT : 0,
                    overflow: "hidden",
                    transition: "max-height 0.3s ease, opacity 0.3s ease",
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <p style={{ padding: "0 4px 20px", fontSize: 14, color: "var(--gray-500)", lineHeight: 1.8, fontWeight: 300 }}>
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
