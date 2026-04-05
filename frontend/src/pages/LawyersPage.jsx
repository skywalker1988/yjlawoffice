/** 변호사 소개 페이지 — 변호사 카드 그리드 + 상세 모달 */
import { useState, useEffect, useRef } from "react";
import { api } from "../utils/api";

/** JSON 문자열 → 배열 파싱 (education, career, specialties 필드) */
function parseList(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [value];
  } catch {
    return value.split("\n").filter(Boolean);
  }
}

/** 비동기 데이터 로드 후에도 reveal 애니메이션이 작동하도록 재관찰 */
function useRevealOnChange(deps) {
  const ref = useRef();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const targets = el.querySelectorAll(".reveal:not(.visible)");
    if (targets.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, deps);
  return ref;
}

export default function LawyersPage() {
  const [lawyers, setLawyers] = useState([]);
  const [selectedLawyer, setSelectedLawyer] = useState(null);
  const ref = useRevealOnChange([lawyers]);

  useEffect(() => {
    api.get("/lawyers")
      .then((json) => setLawyers(json.data ?? []))
      .catch(() => setLawyers([]));
  }, []);

  return (
    <div ref={ref}>
      {/* ==================== 히어로 ==================== */}
      <section
        className="relative flex items-center justify-center"
        style={{
          height: "60vh",
          minHeight: 400,
          background: "linear-gradient(135deg, #0f1923 0%, #1a2332 50%, #0f1923 100%)",
        }}
      >
        <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.3)" }} />
        <div className="relative text-center" style={{ maxWidth: 700, padding: "0 24px", zIndex: 2 }}>
          <div className="sep mx-auto reveal" style={{ marginBottom: 40 }} />
          <h1
            className="font-serif reveal"
            style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 300, letterSpacing: "0.2em", color: "#fff", marginBottom: 16 }}
          >
            변호사 소개
          </h1>
          <p className="font-en reveal" style={{ fontSize: 13, letterSpacing: "0.3em", color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
            OUR LAWYERS
          </p>
          <p className="reveal" style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", fontWeight: 300, lineHeight: 1.9 }}>
            각 분야 변호사의 실무 경험을 기반으로<br />사건 초기부터 종결까지 체계적으로 대응합니다
          </p>
        </div>
      </section>

      {/* ==================== 변호사 카드 ==================== */}
      <section className="section" style={{ background: "#fff" }}>
        <div className="container" style={{ maxWidth: 1040 }}>
          {lawyers.length === 0 ? (
            <div className="text-center reveal" style={{ padding: "80px 0", color: "#bbb" }}>
              <p style={{ fontSize: 48, marginBottom: 16 }}>⚖️</p>
              <p style={{ fontSize: 16, fontWeight: 300 }}>변호사 정보가 준비 중입니다</p>
              <p style={{ fontSize: 13, marginTop: 8 }}>관리자 페이지에서 변호사를 등록해주세요</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 stagger">
              {lawyers.map((lawyer) => (
                <div
                  key={lawyer.id}
                  className="reveal group cursor-pointer"
                  onClick={() => setSelectedLawyer(lawyer)}
                  style={{
                    background: "#fff",
                    border: "1px solid rgba(0,0,0,0.06)",
                    overflow: "hidden",
                    transition: "all 0.3s",
                  }}
                >
                  {/* 사진 */}
                  <div style={{
                    width: "100%", height: 300,
                    background: lawyer.photoUrl
                      ? `url(${lawyer.photoUrl}) center/cover no-repeat`
                      : "linear-gradient(135deg, #0f1923, #1a2332)",
                    position: "relative",
                  }}>
                    {!lawyer.photoUrl && (
                      <div style={{ fontSize: 64, color: "rgba(255,255,255,0.15)", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>⚖️</div>
                    )}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(transparent, rgba(0,0,0,0.4))" }} />
                  </div>

                  {/* 정보 */}
                  <div style={{ padding: "24px 28px 28px" }}>
                    <div className="flex items-baseline gap-3" style={{ marginBottom: 8 }}>
                      <h3 style={{ fontSize: 22, fontWeight: 600, color: "#1a1a1a" }}>{lawyer.name}</h3>
                      {lawyer.nameEn && (
                        <span className="font-en" style={{ fontSize: 12, color: "#bbb", fontWeight: 300 }}>{lawyer.nameEn}</span>
                      )}
                    </div>
                    <p style={{ fontSize: 14, color: "var(--accent-gold)", fontWeight: 500, marginBottom: 14, letterSpacing: "0.05em" }}>
                      {lawyer.position}
                    </p>
                    {lawyer.specialties && (
                      <div className="flex flex-wrap gap-1" style={{ marginBottom: 14 }}>
                        {parseList(lawyer.specialties).slice(0, 4).map((s, i) => (
                          <span key={i} style={{ fontSize: 11, color: "#888", padding: "3px 10px", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 2 }}>{s}</span>
                        ))}
                      </div>
                    )}
                    {lawyer.introduction && (
                      <p style={{ fontSize: 13, color: "#888", lineHeight: 1.7, fontWeight: 300 }}>
                        {lawyer.introduction.length > 100 ? lawyer.introduction.slice(0, 100) + "..." : lawyer.introduction}
                      </p>
                    )}
                    <p className="font-en group-hover:text-[var(--accent-gold)] transition-colors"
                      style={{ fontSize: 11, color: "#ccc", marginTop: 16, letterSpacing: "0.15em" }}>
                      VIEW PROFILE →
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ==================== 상세 모달 ==================== */}
      {selectedLawyer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => setSelectedLawyer(null)}
        >
          <div
            className="relative"
            style={{ background: "#fff", maxWidth: 640, width: "90%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setSelectedLawyer(null)} style={{
              position: "absolute", top: 16, right: 16, zIndex: 10,
              width: 36, height: 36, border: "none", background: "rgba(255,255,255,0.9)",
              fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            }}>×</button>

            <div style={{
              width: "100%", height: 300,
              background: selectedLawyer.photoUrl
                ? `url(${selectedLawyer.photoUrl}) center top/cover no-repeat`
                : "linear-gradient(135deg, #0f1923, #1a2332)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {!selectedLawyer.photoUrl && <span style={{ fontSize: 80, color: "rgba(255,255,255,0.1)" }}>⚖️</span>}
            </div>

            <div style={{ padding: "32px 36px 40px" }}>
              <div className="flex items-baseline gap-3" style={{ marginBottom: 4 }}>
                <h2 style={{ fontSize: 28, fontWeight: 600, color: "#1a1a1a" }}>{selectedLawyer.name}</h2>
                {selectedLawyer.nameEn && <span className="font-en" style={{ fontSize: 14, color: "#bbb" }}>{selectedLawyer.nameEn}</span>}
              </div>
              <p style={{ fontSize: 15, color: "var(--accent-gold)", fontWeight: 500, marginBottom: 24 }}>{selectedLawyer.position}</p>

              {selectedLawyer.introduction && (
                <p style={{ fontSize: 14, color: "#555", lineHeight: 1.9, marginBottom: 28, fontWeight: 300 }}>{selectedLawyer.introduction}</p>
              )}

              {selectedLawyer.education && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 12, color: "#999", letterSpacing: "0.15em", marginBottom: 10, fontWeight: 500 }}>학력</h4>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {parseList(selectedLawyer.education).map((item, i) => (
                      <li key={i} style={{ fontSize: 14, color: "#444", padding: "5px 0", fontWeight: 300, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "var(--accent-gold)", fontSize: 8 }}>●</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedLawyer.career && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 12, color: "#999", letterSpacing: "0.15em", marginBottom: 10, fontWeight: 500 }}>주요 경력</h4>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {parseList(selectedLawyer.career).map((item, i) => (
                      <li key={i} style={{ fontSize: 14, color: "#444", padding: "5px 0", fontWeight: 300, display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ color: "var(--accent-gold)", fontSize: 8 }}>●</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedLawyer.specialties && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontSize: 12, color: "#999", letterSpacing: "0.15em", marginBottom: 10, fontWeight: 500 }}>전문 분야</h4>
                  <div className="flex flex-wrap gap-2">
                    {parseList(selectedLawyer.specialties).map((s, i) => (
                      <span key={i} style={{ fontSize: 13, color: "#555", padding: "6px 14px", background: "#f5f5f3", border: "1px solid rgba(0,0,0,0.06)", borderRadius: 3 }}>{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {(selectedLawyer.email || selectedLawyer.phone) && (
                <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: 20, marginTop: 8 }}>
                  <div className="flex gap-6 flex-wrap">
                    {selectedLawyer.email && <a href={`mailto:${selectedLawyer.email}`} style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>📧 {selectedLawyer.email}</a>}
                    {selectedLawyer.phone && <a href={`tel:${selectedLawyer.phone}`} style={{ fontSize: 13, color: "#888", textDecoration: "none" }}>📞 {selectedLawyer.phone}</a>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
