/**
 * AdminHistory — 관리자 세계사 이벤트 CRUD 페이지
 */
import { useState, useEffect } from "react";
import { Card, CardContent } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Select } from "../../components/ui/Select";
import { Textarea } from "../../components/ui/Textarea";
import { Badge } from "../../components/ui/Badge";
import { api } from "../../utils/api";
import { CATEGORY_CONFIG, REGIONS } from "../../utils/constants";

const EMPTY_FORM = {
  title: "", description: "", year: "", month: "", day: "", endYear: "",
  category: "politics", region: "", country: "", importance: 3,
  latitude: "", longitude: "", source: "", relatedDocumentId: "",
};

export default function AdminHistory() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  // Delete
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
      .then((json) => {
        setEvents(json.data ?? []);
        setMeta(json.meta);
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  };

  const fetchStats = () => {
    api.get("/history/stats")
      .then((json) => setStats(json.data))
      .catch(() => {});
  };

  useEffect(() => { fetchEvents(); }, [page, filterCategory, filterSearch]);
  useEffect(() => { fetchStats(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  };

  const openEdit = (event) => {
    setEditingId(event.id);
    setForm({
      title: event.title || "",
      description: event.description || "",
      year: event.year ?? "",
      month: event.month ?? "",
      day: event.day ?? "",
      endYear: event.endYear ?? "",
      category: event.category || "politics",
      region: event.region || "",
      country: event.country || "",
      importance: event.importance ?? 3,
      latitude: event.latitude ?? "",
      longitude: event.longitude ?? "",
      source: event.source || "",
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

      if (editingId) {
        await api.patch(`/history/${editingId}`, body);
      } else {
        await api.post("/history", body);
      }

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
      {/* Header */}
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a" }}>세계사 관리</h1>
          <p style={{ fontSize: 13, color: "#999", marginTop: 4 }}>
            총 {stats?.total ?? 0}개 이벤트
          </p>
        </div>
        <Button onClick={openCreate}>+ 새 이벤트</Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3" style={{ marginBottom: 24 }}>
          {stats.byCategory?.map((item) => {
            const cfg = CATEGORY_CONFIG[item.category] || { label: item.category, color: "#999" };
            return (
              <Card key={item.category}>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ background: cfg.color }} />
                    <span style={{ fontSize: 13, color: "#666" }}>{cfg.label}</span>
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 600, color: "#1a1a1a" }}>{item.count}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3" style={{ marginBottom: 20 }}>
        <Select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }} style={{ width: 140 }}>
          <option value="">전체 분류</option>
          {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </Select>
        <Input
          placeholder="사건명 검색..."
          value={filterSearch}
          onChange={(e) => { setFilterSearch(e.target.value); setPage(1); }}
          style={{ maxWidth: 300 }}
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="spinner" />
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-16" style={{ color: "#bbb" }}>
          <p style={{ fontSize: 36, marginBottom: 8 }}>🌍</p>
          <p>등록된 이벤트가 없습니다</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg bg-white" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs font-medium" style={{ color: "#999" }}>
                <th className="px-4 py-3">연도</th>
                <th className="px-4 py-3">분류</th>
                <th className="px-4 py-3">사건</th>
                <th className="px-4 py-3">지역</th>
                <th className="px-4 py-3">중요도</th>
                <th className="px-4 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const cfg = CATEGORY_CONFIG[event.category] || { label: event.category, color: "#999" };
                return (
                  <tr key={event.id} className="border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-en whitespace-nowrap" style={{ color: "#666" }}>{formatDate(event)}</td>
                    <td className="px-4 py-3">
                      <Badge style={{ backgroundColor: cfg.color + "18", color: cfg.color, border: "none", fontSize: 10 }}>{cfg.label}</Badge>
                    </td>
                    <td className="px-4 py-3" style={{ maxWidth: 300 }}>
                      <div style={{ fontWeight: 500, color: "#1a1a1a" }}>{event.title}</div>
                      {event.description && (
                        <div style={{ fontSize: 12, color: "#999", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>
                          {event.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#999", fontSize: 12 }}>
                      {event.region}{event.country ? ` · ${event.country}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      {Array.from({ length: 5 }, (_, i) => (
                        <span key={i} style={{ color: i < event.importance ? "#b08d57" : "#ddd", fontSize: 12 }}>★</span>
                      ))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(event)}>편집</Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(event)} style={{ color: "#e74c3c" }}>삭제</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</Button>
          <span className="text-sm" style={{ color: "#999" }}>{page} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>다음</Button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ padding: 32 }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>{editingId ? "이벤트 편집" : "새 이벤트"}</h2>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium" style={{ color: "#666" }}>제목 *</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="사건명" />
              </div>

              <div>
                <label className="text-xs font-medium" style={{ color: "#666" }}>설명</label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="상세 설명" rows={3} />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-xs font-medium" style={{ color: "#666" }}>연도 *</label>
                  <Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="예: 1945" />
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: "#666" }}>월</label>
                  <Input type="number" min="1" max="12" value={form.month} onChange={(e) => setForm({ ...form, month: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: "#666" }}>일</label>
                  <Input type="number" min="1" max="31" value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: "#666" }}>종료연도</label>
                  <Input type="number" value={form.endYear} onChange={(e) => setForm({ ...form, endYear: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium" style={{ color: "#666" }}>분류</label>
                  <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: "#666" }}>중요도</label>
                  <Select value={form.importance} onChange={(e) => setForm({ ...form, importance: e.target.value })}>
                    {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium" style={{ color: "#666" }}>지역</label>
                  <Select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
                    <option value="">선택</option>
                    {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: "#666" }}>국가</label>
                  <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="예: 대한민국" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium" style={{ color: "#666" }}>위도 (Latitude)</label>
                  <Input type="number" step="0.0001" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="예: 37.5665" />
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: "#666" }}>경도 (Longitude)</label>
                  <Input type="number" step="0.0001" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="예: 126.9780" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium" style={{ color: "#666" }}>출처</label>
                <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} placeholder="참고 자료 출처" />
              </div>

              <div>
                <label className="text-xs font-medium" style={{ color: "#666" }}>관련 문서 ID</label>
                <Input value={form.relatedDocumentId} onChange={(e) => setForm({ ...form, relatedDocumentId: e.target.value })} placeholder="vault 문서 ID (선택)" />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-8">
              <Button variant="outline" onClick={() => setShowModal(false)}>취소</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? "저장 중..." : (editingId ? "수정" : "등록")}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-xl shadow-xl" style={{ padding: 32, maxWidth: 400, width: "100%" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>이벤트 삭제</h2>
            <p style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>
              "{deleteTarget.title}" 이벤트를 삭제하시겠습니까?
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>취소</Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteTarget.id)}>삭제</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
