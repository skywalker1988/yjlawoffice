/** 포털 회원가입 — 의뢰인 계정 생성 */
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const T = { accent: "#b08d57", text: "#1e293b", textSec: "#475569" };
const fieldStyle = { width: "100%", padding: "12px 14px", fontSize: 14, border: "1px solid #d0d0d0", borderRadius: 6, background: "#fff", fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
const labelStyle = { fontSize: 12, fontWeight: 600, color: "#444", display: "block", marginBottom: 6 };

const portalFetch = async (method, path, body) => {
  const opts = { method, headers: { "Content-Type": "application/json", "x-portal-token": sessionStorage.getItem("portal_token") || "" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`/api/sb/portal${path}`, opts);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "요청 실패");
  return json;
};

const INITIAL_FORM = { email: "", name: "", phone: "", password: "", passwordConfirm: "" };

export default function PortalRegister() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /** 유효성 검사 */
  const validate = () => {
    if (!form.email.trim()) return "이메일을 입력해주세요";
    if (!form.name.trim()) return "이름을 입력해주세요";
    if (!form.phone.trim()) return "연락처를 입력해주세요";
    if (form.password.length < 6) return "비밀번호는 6자 이상이어야 합니다";
    if (form.password !== form.passwordConfirm) return "비밀번호가 일치하지 않습니다";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) return setError(validationError);

    setError("");
    setLoading(true);

    try {
      await portalFetch("POST", "/register", {
        email: form.email.trim(),
        name: form.name.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      alert("회원가입이 완료되었습니다. 로그인해주세요.");
      navigate("/portal/login", { replace: true });
    } catch (err) {
      setError(err.message || "회원가입에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const field = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #f8f8f6 0%, #eee 100%)",
      padding: 24,
    }}>
      <div style={{
        width: "100%", maxWidth: 420, background: "#fff",
        borderRadius: 12, padding: 40,
        boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: T.text, fontFamily: "'Noto Serif KR', serif", marginBottom: 8 }}>
            회원가입
          </h1>
          <p style={{ fontSize: 13, color: T.textSec }}>의뢰인 포털 계정을 생성합니다</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>이메일 *</label>
            <input type="email" style={fieldStyle} value={form.email} onChange={field("email")} placeholder="example@email.com" autoComplete="email" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>이름 *</label>
            <input style={fieldStyle} value={form.name} onChange={field("name")} placeholder="홍길동" autoComplete="name" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>연락처 *</label>
            <input type="tel" style={fieldStyle} value={form.phone} onChange={field("phone")} placeholder="010-0000-0000" autoComplete="tel" />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>비밀번호 * (6자 이상)</label>
            <input type="password" style={fieldStyle} value={form.password} onChange={field("password")} placeholder="비밀번호" autoComplete="new-password" />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>비밀번호 확인 *</label>
            <input type="password" style={fieldStyle} value={form.passwordConfirm} onChange={field("passwordConfirm")} placeholder="비밀번호 확인" autoComplete="new-password" />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: "#c62828", marginBottom: 16, textAlign: "center" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px 0", fontSize: 14, fontWeight: 600,
              color: "#fff", background: T.accent, border: "none",
              borderRadius: 6, cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "처리 중..." : "회원가입"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <Link to="/portal/login" style={{ fontSize: 13, color: T.accent, textDecoration: "none" }}>
            이미 계정이 있으신가요? 로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
