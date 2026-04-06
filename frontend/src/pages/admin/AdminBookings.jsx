/** 관리자 예약 관리 — 예약 현황 조회, 예약 설정, 슬롯 생성 */
import { useState, useEffect } from "react";
import { api } from "../../utils/api";

const T = { accent: "#b08d57", text: "#1e293b", textSec: "#475569", textMuted: "#94a3b8", border: "#e5e8ed" };
const fieldStyle = { width: "100%", padding: "10px 14px", fontSize: 14, border: "1px solid #d0d0d0", borderRadius: 6, background: "#fff", fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
const labelStyle = { fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 4, display: "block" };
const btnStyle = (bg = "#1a1a2e") => ({ padding: "8px 20px", fontSize: 13, fontWeight: 500, color: "#fff", background: bg, border: "none", borderRadius: 4, cursor: "pointer" });

const DAY_LABELS = ["월", "화", "수", "목", "금"];
const SLOT_DURATIONS = [
  { value: 30, label: "30분" },
  { value: 60, label: "60분" },
  { value: 90, label: "90분" },
];

const EMPTY_SETTINGS = {
  lawyerId: "",
  days: [1, 2, 3, 4, 5],
  startTime: "09:00",
  endTime: "18:00",
  slotDuration: 60,
};

export default function AdminBookings() {
  const [tab, setTab] = useState("list");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lawyers, setLawyers] = useState([]);

  /* 예약 설정 상태 */
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [genStartDate, setGenStartDate] = useState("");
  const [genEndDate, setGenEndDate] = useState("");
  const [genMsg, setGenMsg] = useState("");

  useEffect(() => {
    api.get("/lawyers").then((j) => setLawyers(j.data ?? [])).catch(() => {});
  }, []);

  /** 예약 현황 로드 */
  const loadBookings = () => {
    setLoading(true);
    api.get("/bookings?upcoming=true")
      .then((json) => setBookings(json.data ?? []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (tab === "list") loadBookings();
  }, [tab]);

  /** 예약 취소 */
  const cancelBooking = async (id) => {
    if (!confirm("이 예약을 취소하시겠습니까?")) return;
    try {
      await api.patch(`/bookings/${id}`, { status: "cancelled" });
      loadBookings();
    } catch (err) {
      alert("취소 실패: " + err.message);
    }
  };

  /** 슬롯 생성 */
  const generateSlots = async () => {
    if (!genStartDate || !genEndDate) return alert("날짜 범위를 선택해주세요");
    if (!settings.lawyerId) return alert("변호사를 선택해주세요");
    setGenMsg("");
    try {
      const res = await api.post("/bookings/generate-slots", {
        lawyerId: settings.lawyerId,
        startDate: genStartDate,
        endDate: genEndDate,
        days: settings.days,
        startTime: settings.startTime,
        endTime: settings.endTime,
        slotDuration: settings.slotDuration,
      });
      setGenMsg(`${res.data?.count ?? 0}개의 슬롯이 생성되었습니다`);
    } catch (err) {
      alert("슬롯 생성 실패: " + err.message);
    }
  };

  /** 요일 토글 */
  const toggleDay = (dayIdx) => {
    setSettings((prev) => ({
      ...prev,
      days: prev.days.includes(dayIdx)
        ? prev.days.filter((d) => d !== dayIdx)
        : [...prev.days, dayIdx].sort(),
    }));
  };

  const tabBtnStyle = (active) => ({
    padding: "10px 28px", fontSize: 14, fontWeight: active ? 600 : 400,
    color: active ? T.accent : T.textSec,
    background: "transparent", border: "none", borderBottom: active ? `2px solid ${T.accent}` : "2px solid transparent",
    cursor: "pointer",
  });

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: "#1a1a1a", marginBottom: 24 }}>예약 관리</h1>

      {/* ==================== 탭 ==================== */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, marginBottom: 24 }}>
        <button onClick={() => setTab("list")} style={tabBtnStyle(tab === "list")}>예약 현황</button>
        <button onClick={() => setTab("settings")} style={tabBtnStyle(tab === "settings")}>예약 설정</button>
      </div>

      {/* ==================== 예약 현황 탭 ==================== */}
      {tab === "list" && (
        <>
          {loading ? (
            <p style={{ color: "#999", fontSize: 14 }}>로딩 중...</p>
          ) : bookings.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#bbb" }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>&#x1F4C5;</p>
              <p>예정된 예약이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between"
                  style={{ padding: "14px 20px", background: "#fff", border: "1px solid #e8e8e8", borderRadius: 6 }}
                >
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-3" style={{ marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>
                        {b.date} {b.time}
                      </span>
                      <span style={{
                        fontSize: 11, padding: "2px 8px", borderRadius: 8,
                        background: b.status === "confirmed" ? "#e8f5e9" : b.status === "cancelled" ? "#fce4ec" : "#fff3e0",
                        color: b.status === "confirmed" ? "#2e7d32" : b.status === "cancelled" ? "#c62828" : "#e65100",
                      }}>
                        {b.status === "confirmed" ? "확정" : b.status === "cancelled" ? "취소" : "대기"}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: T.textSec }}>
                      {b.clientName || "상담 #" + (b.consultationId || b.id)}
                      {b.lawyerName && <span style={{ color: T.textMuted }}> &middot; {b.lawyerName}</span>}
                    </p>
                  </div>
                  {b.status !== "cancelled" && (
                    <button onClick={() => cancelBooking(b.id)} style={{
                      padding: "6px 14px", fontSize: 12, border: "1px solid #ddd",
                      background: "#fff", borderRadius: 4, cursor: "pointer", color: "#c00",
                    }}>
                      취소
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ==================== 예약 설정 탭 ==================== */}
      {tab === "settings" && (
        <div style={{ maxWidth: 600 }}>
          {/* 변호사 선택 */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>변호사 선택</label>
            <select
              style={fieldStyle}
              value={settings.lawyerId}
              onChange={(e) => setSettings({ ...settings, lawyerId: e.target.value })}
            >
              <option value="">선택해주세요</option>
              {lawyers.map((l) => <option key={l.id} value={l.id}>{l.name} ({l.position})</option>)}
            </select>
          </div>

          {/* 요일 선택 */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>근무 요일</label>
            <div style={{ display: "flex", gap: 8 }}>
              {DAY_LABELS.map((label, idx) => {
                const dayIdx = idx + 1;
                const active = settings.days.includes(dayIdx);
                return (
                  <button
                    key={dayIdx}
                    onClick={() => toggleDay(dayIdx)}
                    style={{
                      width: 42, height: 42, borderRadius: "50%", fontSize: 13, fontWeight: 500,
                      border: `1px solid ${active ? T.accent : "#ddd"}`,
                      background: active ? T.accent : "#fff",
                      color: active ? "#fff" : T.textSec,
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 시간/슬롯 설정 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>시작 시간</label>
              <input type="time" style={fieldStyle} value={settings.startTime} onChange={(e) => setSettings({ ...settings, startTime: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>종료 시간</label>
              <input type="time" style={fieldStyle} value={settings.endTime} onChange={(e) => setSettings({ ...settings, endTime: e.target.value })} />
            </div>
            <div>
              <label style={labelStyle}>슬롯 단위</label>
              <select style={fieldStyle} value={settings.slotDuration} onChange={(e) => setSettings({ ...settings, slotDuration: Number(e.target.value) })}>
                {SLOT_DURATIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          {/* 슬롯 생성 */}
          <div style={{ marginTop: 32, padding: 24, background: "#f9f9f8", border: "1px solid #e0e0e0", borderRadius: 8 }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: "#1a1a1a" }}>슬롯 생성</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>시작일</label>
                <input type="date" style={fieldStyle} value={genStartDate} onChange={(e) => setGenStartDate(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>종료일</label>
                <input type="date" style={fieldStyle} value={genEndDate} onChange={(e) => setGenEndDate(e.target.value)} />
              </div>
            </div>
            <button onClick={generateSlots} style={btnStyle(T.accent)}>슬롯 생성</button>
            {genMsg && <p style={{ marginTop: 12, fontSize: 13, color: "#2e7d32" }}>{genMsg}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
