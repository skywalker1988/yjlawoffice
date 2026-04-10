/** 온라인 상담 신청 폼 — 필드, 유효성 검증, 개인정보 동의, 제출 처리 */
import { useState, useRef, useCallback } from "react";
import { api } from "../../utils/api";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Button } from "../../components/ui/Button";
import { Textarea } from "../../components/ui/Textarea";
import { CONSULTATION_CATEGORIES, TIME_SLOTS, INITIAL_FORM } from "./consultationConstants";
import PrivacyModal from "./PrivacyModal";

export default function ConsultationForm() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  /** 폼 필드 업데이트 핸들러 */
  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  /** 상담 신청 제출 */
  async function handleFormSubmit(e) {
    e.preventDefault();
    setSubmitResult(null);

    if (!form.phone?.trim() && !form.email?.trim()) {
      setSubmitResult({ type: "error", msg: "연락처(전화번호) 또는 이메일 중 최소 하나를 입력해주세요." });
      return;
    }
    if (!form.agreed) {
      setSubmitResult({ type: "error", msg: "개인정보 수집 및 이용에 동의해주세요." });
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/consultations", {
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        category: form.category,
        preferredDate: form.preferredDate || undefined,
        preferredTime: form.preferredTime || undefined,
        message: form.message,
        agreed: form.agreed,
      });
      setSubmitResult({ type: "success", msg: "상담 신청이 접수되었습니다. 빠른 시일 내에 연락드리겠습니다." });
      setForm(INITIAL_FORM);
    } catch (err) {
      setSubmitResult({ type: "error", msg: err.message || "신청 중 오류가 발생했습니다." });
    } finally {
      setSubmitting(false);
    }
  }

  /** 개인정보 동의 완료 콜백 */
  function handlePrivacyAgreed() {
    setForm((prev) => ({ ...prev, agreed: true }));
    setPrivacyOpen(false);
  }

  return (
    <section className="section" style={{ background: "#f9f9f8", borderTop: "1px solid var(--border-subtle)" }}>
      <div className="container" style={{ maxWidth: 720 }}>
        {/* 섹션 제목 */}
        <div className="text-center reveal" style={{ marginBottom: 48 }}>
          <p className="font-en" style={{ fontSize: 11, letterSpacing: "0.25em", color: "var(--accent-gold)", marginBottom: 14 }}>
            CONTACT FORM
          </p>
          <h2 className="font-serif" style={{ fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)", fontWeight: 300, color: "var(--text-primary)", marginBottom: 12 }}>
            온라인 상담 신청
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 300 }}>
            아래 양식을 작성해 주시면 빠른 시일 내에 연락드리겠습니다
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="reveal" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* 이름 + 연락처 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="이름" required>
              <Input name="name" value={form.name} onChange={handleFormChange} placeholder="홍길동" required style={{ background: "#fff" }} />
            </FormField>
            <FormField label="연락처" required>
              <Input name="phone" value={form.phone} onChange={handleFormChange} placeholder="010-1234-5678" style={{ background: "#fff" }} />
            </FormField>
          </div>

          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "-8px 0 8px", fontStyle: "italic" }}>
            * 전화번호 또는 이메일 중 최소 하나를 입력해주세요.
          </p>

          {/* 이메일 + 상담 분야 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="이메일" required>
              <Input name="email" type="email" value={form.email} onChange={handleFormChange} placeholder="example@email.com" style={{ background: "#fff" }} />
            </FormField>
            <FormField label="상담 분야" required>
              <Select name="category" value={form.category} onChange={handleFormChange} style={{ background: "#fff" }}>
                {CONSULTATION_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
            </FormField>
          </div>

          {/* 희망 상담 날짜 + 시간 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="희망 상담 날짜">
              <Input
                name="preferredDate" type="date" value={form.preferredDate} onChange={handleFormChange}
                min={new Date().toISOString().split("T")[0]} style={{ background: "#fff" }}
              />
            </FormField>
            <FormField label="희망 시간대">
              <Select name="preferredTime" value={form.preferredTime} onChange={handleFormChange} style={{ background: "#fff" }}>
                {TIME_SLOTS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </Select>
            </FormField>
          </div>

          {/* 상담 내용 */}
          <FormField label="상담 내용" required>
            <Textarea
              name="message" value={form.message} onChange={handleFormChange}
              placeholder="상담받고자 하는 내용을 간략히 작성해 주세요 (10자 이상)"
              rows={5} required style={{ background: "#fff" }}
            />
          </FormField>

          {/* 개인정보 동의 */}
          <PrivacyConsentBox
            agreed={form.agreed}
            onOpenModal={() => setPrivacyOpen(true)}
          />

          {/* 결과 메시지 */}
          {submitResult && <SubmitResultMessage result={submitResult} />}

          {/* 제출 버튼 */}
          <div className="text-center" style={{ marginTop: 8 }}>
            <Button type="submit" size="lg" disabled={submitting} style={{ minWidth: 200, letterSpacing: "0.05em" }}>
              {submitting ? "접수 중..." : "상담 신청하기"}
            </Button>
          </div>
        </form>
      </div>

      {/* 개인정보 동의서 모달 */}
      {privacyOpen && (
        <PrivacyModal
          onClose={() => setPrivacyOpen(false)}
          onAgreed={handlePrivacyAgreed}
        />
      )}
    </section>
  );
}

/** 폼 필드 라벨 래퍼 */
function FormField({ label, required, children }) {
  return (
    <div>
      <label style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, display: "block" }}>
        {label} {required && <span style={{ color: "var(--accent-gold)" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

/** 개인정보 동의 체크박스 + 동의서 확인 버튼 */
function PrivacyConsentBox({ agreed, onOpenModal }) {
  return (
    <div style={{ border: "1px solid var(--border-color)", padding: "16px 20px", background: "#fafaf9" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div style={{
            width: 20, height: 20, borderRadius: 4,
            border: agreed ? "2px solid var(--accent-gold)" : "2px solid #ccc",
            background: agreed ? "var(--accent-gold)" : "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            {agreed && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
          </div>
          <span style={{ fontSize: 13, color: agreed ? "var(--text-primary)" : "var(--gray-500)" }}>
            {agreed ? "개인정보 수집·이용에 동의하였습니다" : "개인정보 수집·이용 동의 (필수)"}
          </span>
        </div>
        <button
          type="button"
          onClick={onOpenModal}
          style={{
            fontSize: 12, color: "var(--accent-gold)", background: "none",
            border: "1px solid var(--accent-gold)", padding: "6px 14px",
            cursor: "pointer", fontWeight: 500,
          }}
        >
          {agreed ? "다시 보기" : "동의서 확인"}
        </button>
      </div>
    </div>
  );
}

/** 제출 결과 메시지 (성공/에러) */
function SubmitResultMessage({ result }) {
  const isSuccess = result.type === "success";
  return (
    <div
      style={{
        padding: "14px 20px",
        fontSize: 14,
        borderRadius: 6,
        background: isSuccess ? "#f0fdf4" : "#fef2f2",
        color: isSuccess ? "#166534" : "#991b1b",
        border: `1px solid ${isSuccess ? "#bbf7d0" : "#fecaca"}`,
      }}
    >
      {result.msg}
    </div>
  );
}
