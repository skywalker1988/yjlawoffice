/** 상담 절차 + 연락처 + 오시는 길 섹션 */
import { STEPS, CONTACT_INFO, OFFICE_ADDRESS } from "./consultationConstants";

export default function ConsultationSteps() {
  return (
    <section className="section" style={{ background: "#fff" }}>
      <div className="container" style={{ maxWidth: 960 }}>
        {/* 섹션 제목 */}
        <div className="text-center reveal" style={{ marginBottom: 64 }}>
          <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.25em", color: "var(--accent-gold)", marginBottom: 14 }}>
            PROCESS
          </p>
          <h2 className="font-serif" style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 300, color: "var(--text-primary)", marginBottom: 16 }}>
            명확한 전략, 빠른 실행, 책임 있는 결과
          </h2>
          <p style={{ fontSize: 15, color: "var(--gray-500)", fontWeight: 300, maxWidth: 600, margin: "0 auto" }}>
            윤정 법률사무소는 사건을 단순 처리하지 않습니다. 분쟁의 원인과 증거, 상대의 전략을 정밀 분석하여
            의뢰인에게 가장 실익이 큰 선택지를 제시합니다.
          </p>
        </div>

        {/* 절차 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger" style={{ marginBottom: 80 }}>
          {STEPS.map((s, i) => (
            <div
              key={i}
              className="reveal text-center"
              style={{ padding: "32px 20px", border: "1px solid var(--border-subtle)", background: "#fafaf9" }}
            >
              <p className="font-en" style={{ fontSize: 32, fontWeight: 300, color: "var(--accent-gold)", marginBottom: 12 }}>
                {s.step}
              </p>
              <h3 style={{ fontSize: 16, fontWeight: 500, color: "var(--text-primary)", marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.8, fontWeight: 300 }}>{s.desc}</p>
            </div>
          ))}
        </div>

        {/* 연락처 + 오시는 길 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <ContactInfoSection />
          <LocationSection />
        </div>
      </div>
    </section>
  );
}

/** 연락처 카드 목록 */
function ContactInfoSection() {
  return (
    <div className="reveal">
      <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.25em", color: "var(--accent-gold)", marginBottom: 14 }}>
        CONTACT
      </p>
      <h2 className="font-serif" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", fontWeight: 300, color: "var(--text-primary)", marginBottom: 32 }}>
        연락처
      </h2>
      <div className="space-y-4">
        {CONTACT_INFO.map((c, i) => {
          const Inner = (
            <div
              className="flex items-center gap-4 transition-colors duration-200 hover:bg-[#f0f0ee]"
              style={{ padding: "16px 20px", background: "#fafaf9", border: "1px solid var(--border-subtle)", cursor: c.href ? "pointer" : "default" }}
            >
              <c.icon size={22} strokeWidth={1.3} color="var(--accent-gold)" />
              <div>
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>{c.label}</p>
                <p style={{ fontSize: 15, color: "var(--text-primary)", fontWeight: 400 }}>{c.value}</p>
              </div>
            </div>
          );
          return c.href ? (
            <a key={i} href={c.href} style={{ textDecoration: "none", color: "inherit", display: "block" }}>{Inner}</a>
          ) : (
            <div key={i}>{Inner}</div>
          );
        })}
      </div>
    </div>
  );
}

/** 오시는 길 섹션 */
function LocationSection() {
  return (
    <div className="reveal">
      <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.25em", color: "var(--accent-gold)", marginBottom: 14 }}>
        LOCATION
      </p>
      <h2 className="font-serif" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", fontWeight: 300, color: "var(--text-primary)", marginBottom: 32 }}>
        오시는 길
      </h2>
      <div style={{ padding: "32px 24px", background: "#fafaf9", border: "1px solid var(--border-subtle)", marginBottom: 16 }}>
        <p style={{ fontSize: 15, color: "var(--text-primary)", fontWeight: 500, marginBottom: 12 }}>
          {OFFICE_ADDRESS}
        </p>
        <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.9, fontWeight: 300 }}>
          지하철: 2호선 서초역 3번 출구 도보 3분<br />
          교대역 방면에서도 도보 이동 가능
        </p>
      </div>
    </div>
  );
}
