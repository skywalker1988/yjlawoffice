/**
 * AdminHistory — 미국 정부 스타일 세계사 이벤트 관리 페이지
 * 공식 문서풍 데이터 테이블 + 분류별 통계
 */
import { useState, useEffect } from "react";
import { Badge } from "../../components/ui/Badge";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { api } from "../../utils/api";
import { CATEGORY_CONFIG, REGIONS } from "../../utils/constants";

const GOV = {
  navy: "#0b1a2e",
  navyLight: "#1a2f4e",
  gold: "#c9a961",
  goldBg: "rgba(201,169,97,0.08)",
  text: "#1b2a4a",
  textSec: "#5a6a85",
  textMuted: "#8e99ab",
  border: "#dce1e8",
  headerBg: "#0f2341",
  rowAlt: "#fafbfc",
};

const EMPTY_FORM = {
  title: "", description: "", year: "", month: "", day: "", endYear: "",
  category: "politics", region: "", country: "", importance: 3,
  latitude: "", longitude: "", source: "", relatedDocumentId: "",
};

/** 정부 스타일 모달 */
function GovModal({ title, onClose, children, variant = "default" }) {
  const headerBg = variant === "danger" ? "#7f1d1d" : GOV.headerBg;
  const headerBorder = variant === "danger" ? "#ef4444" : GOV.gold;
  const headerColor = variant === "danger" ? "#fecaca" : GOV.gold;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(11,26,46,0.6)" }} onClick={onClose} />
      <div style={{
        position: "relative", background: "#fff", borderRadius: 2,
        maxWidth: 560, width: "95%", maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        border: `1px solid ${GOV.border}`,
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          background: headerBg, padding: "12px 24px",
          borderBottom: `2px solid ${headerBorder}`,
        }}>
          <h3 style={{
            fontSize: 12, fontWeight: 700, color: headerColor,
            letterSpacing: "0.1em", textTransform: "uppercase",
            fontFamily: "'Georgia', serif",
          }}>{title}</h3>
        </div>
        <div style={{ padding: "24px" }}>{children}</div>
      </div>
    </div>
  );
}

/** 폼 필드 라벨 */
function FieldLabel({ children, required }) {
  return (
    <label style={{
      display: "block", marginBottom: 4, fontSize: 10, fontWeight: 700,
      color: GOV.textSec, letterSpacing: "0.1em", textTransform: "uppercase",
    }}>
      {children} {required && <span style={{ color: "#b91c1c" }}>*</span>}
    </label>
  );
}

export default function AdminHistory() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchEvents = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "30");
    params.set("sort", "desc");
    if (filterCategory) params.set("category", filterCategory);
    if (filterSearch) params.set("q", filterSearch);

    api.get(`/history?${params.toString()}`)
      .then((json) => { setEvents(json.data ?? []); setMeta(json.meta); })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  };

  const fetchStats = () => {
    api.get("/history/stats").then((json) => setStats(json.data)).catch(() => {});
  };

  useEffect(() => { fetchEvents(); }, [page, filterCategory, filterSearch]);
  useEffect(() => { fetchStats(); }, []);

  const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_FORM }); setShowModal(true); };

  const openEdit = (event) => {
    setEditingId(event.id);
    setForm({
      title: event.title || "", description: event.description || "",
      year: event.year ?? "", month: event.month ?? "", day: event.day ?? "",
      endYear: event.endYear ?? "", category: event.category || "politics",
      region: event.region || "", country: event.country || "",
      importance: event.importance ?? 3, latitude: event.latitude ?? "",
      longitude: event.longitude ?? "", source: event.source || "",
      relatedDocumentId: event.relatedDocumentId || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.year) return alert("제목과 연도는 필수입니다.");
    setSaving(true);
    try {
      const body = {
        ...form,
        year: parseInt(form.year),
        month: form.month ? parseInt(form.month) : null,
        day: form.day ? parseInt(form.day) : null,
        endYear: form.endYear ? parseInt(form.endYear) : null,
        importance: parseInt(form.importance),
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
        relatedDocumentId: form.relatedDocumentId || null,
      };
      if (editingId) await api.patch(`/history/${editingId}`, body);
      else await api.post("/history", body);
      setShowModal(false);
      fetchEvents();
      fetchStats();
    } catch (e) {
      alert("저장 실패: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.del(`/history/${id}`);
      setDeleteTarget(null);
      fetchEvents();
      fetchStats();
    } catch (e) {
      alert("삭제 실패: " + e.message);
    }
  };

  const formatDate = (event) => {
    let s = `${event.year < 0 ? "BC " + Math.abs(event.year) : event.year}`;
    if (event.month) s += `.${String(event.month).padStart(2, "0")}`;
    if (event.day) s += `.${String(event.day).padStart(2, "0")}`;
    return s;
  };

  const totalPages = meta?.totalPages ?? 1;

  return (
    <div>
      {/* 페이지 헤더 */}
      <div style={{
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        marginBottom: 28, paddingBottom: 16, borderBottom: `2px solid ${GOV.navy}`,
      }}>
        <div>
          <h1 style={{
            fontSize: 22, fontWeight: 700, color: GOV.navy,
            fontFamily: "'Georgia', serif", letterSpacing: "0.03em",
          }}>세계사 관리</h1>
          <p style={{ fontSize: 12, color: GOV.textMuted, marginTop: 4 }}>
            역사적 사건 데이터베이스 | 총 {stats?.total ?? 0}건 등록
          </p>
        </div>
        <button onClick={openCreate} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "8px 20px", fontSize: 12, fontWeight: 600,
          background: GOV.navy, color: GOV.gold, border: "none",
          borderRadius: 2, cursor: "pointer", letterSpacing: "0.06em",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#142d52"}
        onMouseLeave={e => e.currentTarget.style.background = GOV.navy}
        >
          + 신규 이벤트 등록
        </button>
      </div>

      {/* 분류별 통계 카드 */}
      {stats?.byCategory && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3" style={{ marginBottom: 24 }}>
          {stats.byCategory.map((item) => {
            const cfg = CATEGORY_CONFIG[item.category] || { label: item.category, color: "#999" };
            return (
              <div key={item.category} style={{
                background: "#fff", border: `1px solid ${GOV.border}`,
                borderLeft: `4px solid ${cfg.color}`, borderRadius: 2,
                padding: "12px 16px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 12, color: GOV.textSec, fontWeight: 500 }}>{cfg.label}</span>
                <span style={{
                  fontSize: 20, fontWeight: 600, color: GOV.navy,
                  fontFamily: "'Georgia', serif",
                }}>{item.count}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* 필터 바 */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center",
        marginBottom: 20, padding: "12px 20px",
        background: GOV.goldBg, border: `1px solid rgba(201,169,97,0.15)`,
        borderRadius: 2,
      }}>
        <span style={{
          fontSize: 10, fontWeight: 700, color: GOV.textSec,
          letterSpacing: "0.12em", textTransform: "uppercase", marginRight: 4,
        }}>필터:</span>
        <Select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }} style={{ width: 140, borderRadius: 2 }}>
          <option value="">전체 분류</option>
          {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </Select>
        <Input placeholder="사건명 검색..." value={filterSearch}
          onChange={(e) => { setFilterSearch(e.target.value); setPage(1); }}
          style={{ maxWidth: 300, borderRadius: 2 }}
        />
      </div>

      {/* 테이블 */}
      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: GOV.textMuted }}>
          <div className="spinner" style={{ margin: "0 auto 12px" }} />
          이벤트 목록 조회 중...
        </div>
      ) : events.length === 0 ? (
        <div style={{
          padding: 60, textAlign: "center", color: GOV.textMuted,
          border: `1px dashed ${GOV.border}`, borderRadius: 2,
        }}>
          등록된 이벤트가 없습니다
        </div>
      ) : (
        <div style={{
          border: `1px solid ${GOV.border}`, borderRadius: 2,
          overflow: "hidden", background: "#fff",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
            <thead>
              <tr style={{ background: GOV.headerBg }}>
                {["연도", "분류", "사건명", "지역", "중요도", "관리"].map((h, i) => (
                  <th key={h} style={{
                    textAlign: i === 5 ? "right" : "left",
                    padding: "10px 14px",
                    color: GOV.gold,
                    fontWeight: 700, fontSize: 10,
                    letterSpacing: "0.12em", textTransform: "uppercase",
                    borderBottom: `2px solid ${GOV.gold}`,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {events.map((event, i) => {
                const cfg = CATEGORY_CONFIG[event.category] || { label: event.category, color: "#999" };
                return (
                  <tr key={event.id} style={{
                    borderBottom: `1px solid ${GOV.border}`,
                    background: i % 2 === 0 ? "transparent" : GOV.rowAlt,
                    transition: "background 0.1s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#eef3fa"}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : GOV.rowAlt}
                  >
                    <td style={{
                      padding: "10px 14px", fontFamily: "'Georgia', serif",
                      color: GOV.textSec, whiteSpace: "nowrap", fontSize: 12,
                    }}>
                      {formatDate(event)}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <Badge style={{
                        backgroundColor: `${cfg.color}15`, color: cfg.color,
                        border: `1px solid ${cfg.color}30`, fontSize: 10,
                        borderRadius: 2,
                      }}>{cfg.label}</Badge>
                    </td>
                    <td style={{ padding: "10px 14px", maxWidth: 320 }}>
                      <div style={{ fontWeight: 500, color: GOV.text }}>{event.title}</div>
                      {event.description && (
                        <div style={{
                          fontSize: 11, color: GOV.textMuted, marginTop: 2,
                          overflow: "hidden", textOverflow: "ellipsis",
                          whiteSpace: "nowrap", maxWidth: 300,
                        }}>
                          {event.description}
                        </div>
                      )}
                    </td>
                    <td style={{
                      padding: "10px 14px", whiteSpace: "nowrap",
                      color: GOV.textMuted, fontSize: 11.5,
                    }}>
                      {event.region}{event.country ? ` / ${event.country}` : ""}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {Array.from({ length: 5 }, (_, j) => (
                        <span key={j} style={{
                          color: j < event.importance ? GOV.gold : "#ddd",
                          fontSize: 11, letterSpacing: "1px",
                        }}>★</span>
                      ))}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(event)} style={{
                          padding: "4px 10px", fontSize: 11, background: "transparent",
                          border: `1px solid ${GOV.border}`, borderRadius: 2,
                          color: GOV.textSec, cursor: "pointer", fontWeight: 500,
                        }}>편집</button>
                        <button onClick={() => setDeleteTarget(event)} style={{
                          padding: "4px 10px", fontSize: 11, background: "transparent",
                          border: "1px solid #fecaca", borderRadius: 2,
                          color: "#b91c1c", cursor: "pointer", fontWeight: 500,
                        }}>삭제</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3" style={{ marginTop: 24 }}>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} style={{
            padding: "6px 16px", fontSize: 11, fontWeight: 600,
            background: page <= 1 ? "#f0f0f0" : GOV.navy,
            color: page <= 1 ? GOV.textMuted : GOV.gold,
            border: "none", borderRadius: 2,
            cursor: page <= 1 ? "not-allowed" : "pointer",
          }}>이전</button>
          <span style={{ fontSize: 12, color: GOV.textSec, fontFamily: "'Georgia', serif" }}>
            {page} / {totalPages}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} style={{
            padding: "6px 16px", fontSize: 11, fontWeight: 600,
            background: page >= totalPages ? "#f0f0f0" : GOV.navy,
            color: page >= totalPages ? GOV.textMuted : GOV.gold,
            border: "none", borderRadius: 2,
            cursor: page >= totalPages ? "not-allowed" : "pointer",
          }}>다음</button>
        </div>
      )}

      {/* 생성/수정 모달 */}
      {showModal && (
        <GovModal title={editingId ? "이벤트 편집" : "신규 이벤트 등록"} onClose={() => setShowModal(false)}>
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel required>사건명</FieldLabel>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="역사적 사건명" style={{ borderRadius: 2 }} />
            </div>
            <div>
              <FieldLabel>상세 설명</FieldLabel>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="사건 상세 설명" rows={3} style={{ borderRadius: 2 }} />
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div><FieldLabel required>연도</FieldLabel><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="1945" style={{ borderRadius: 2 }} /></div>
              <div><FieldLabel>월</FieldLabel><Input type="number" min="1" max="12" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} style={{ borderRadius: 2 }} /></div>
              <div><FieldLabel>일</FieldLabel><Input type="number" min="1" max="31" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} style={{ borderRadius: 2 }} /></div>
              <div><FieldLabel>종료연도</FieldLabel><Input type="number" value={form.endYear} onChange={(e) => setForm({ ...form, endYear: e.target.value })} style={{ borderRadius: 2 }} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>분류</FieldLabel>
                <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} style={{ borderRadius: 2 }}>
                  {Object.entries(CATEGORY_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </Select>
              </div>
              <div>
                <FieldLabel>중요도</FieldLabel>
                <Select value={form.importance} onChange={(e) => setForm({ ...form, importance: e.target.value })} style={{ borderRadius: 2 }}>
                  {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Level {n}</option>)}
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>지역</FieldLabel>
                <Select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} style={{ borderRadius: 2 }}>
                  <option value="">선택</option>
                  {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </Select>
              </div>
              <div>
                <FieldLabel>국가</FieldLabel>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="대한민국" style={{ borderRadius: 2 }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><FieldLabel>위도</FieldLabel><Input type="number" step="0.0001" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="37.5665" style={{ borderRadius: 2 }} /></div>
              <div><FieldLabel>경도</FieldLabel><Input type="number" step="0.0001" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="126.9780" style={{ borderRadius: 2 }} /></div>
            </div>
            <div>
              <FieldLabel>출처</FieldLabel>
              <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="참고 자료 출처" style={{ borderRadius: 2 }} />
            </div>
            <div>
              <FieldLabel>관련 문서 ID</FieldLabel>
              <Input value={form.relatedDocumentId} onChange={(e) => setForm({ ...form, relatedDocumentId: e.target.value })} placeholder="Vault 문서 ID (선택)" style={{ borderRadius: 2 }} />
            </div>
          </div>
          <div className="flex justify-end gap-3" style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${GOV.border}` }}>
            <button onClick={() => setShowModal(false)} style={{
              padding: "8px 20px", fontSize: 12, fontWeight: 600,
              background: "transparent", color: GOV.textSec,
              border: `1px solid ${GOV.border}`, borderRadius: 2, cursor: "pointer",
            }}>취소</button>
            <button onClick={handleSave} disabled={saving} style={{
              padding: "8px 24px", fontSize: 12, fontWeight: 600,
              background: GOV.navy, color: GOV.gold, border: "none",
              borderRadius: 2, cursor: "pointer",
              opacity: saving ? 0.5 : 1,
            }}>
              {saving ? "처리 중..." : (editingId ? "수정 완료" : "이벤트 등록")}
            </button>
          </div>
        </GovModal>
      )}

      {/* 삭제 확인 */}
      {deleteTarget && (
        <GovModal title="이벤트 삭제 확인" onClose={() => setDeleteTarget(null)} variant="danger">
          <div style={{
            padding: "12px 16px", marginBottom: 20,
            background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 2,
          }}>
            <p style={{ fontSize: 13, color: "#991b1b", fontWeight: 500 }}>
              &ldquo;{deleteTarget.title}&rdquo; 이벤트를 삭제하시겠습니까?
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteTarget(null)} style={{
              padding: "7px 18px", fontSize: 12, fontWeight: 600,
              background: "transparent", color: GOV.textSec,
              border: `1px solid ${GOV.border}`, borderRadius: 2, cursor: "pointer",
            }}>취소</button>
            <button onClick={() => handleDelete(deleteTarget.id)} style={{
              padding: "7px 18px", fontSize: 12, fontWeight: 600,
              background: "#b91c1c", color: "#fff",
              border: "none", borderRadius: 2, cursor: "pointer",
            }}>삭제 확인</button>
          </div>
        </GovModal>
      )}
    </div>
  );
}
