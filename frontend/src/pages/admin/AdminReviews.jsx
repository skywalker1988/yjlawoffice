/** 관리자 후기 관리 — 리뷰 CRUD, 승인/거절, 별점 관리 */
import { useState, useEffect } from "react";
import { api } from "../../utils/api";

const CATEGORIES = [
  { value: "civil", label: "민사" },
  { value: "criminal", label: "형사" },
  { value: "family", label: "가사" },
  { value: "admin", label: "행정" },
  { value: "tax", label: "조세" },
  { value: "realestate", label: "부동산" },
  { value: "corporate", label: "기업법무" },
];

const EMPTY_FORM = {
  clientName: "", rating: 5, content: "", category: "civil",
  isAnonymous: 0, isPublished: 0,
};

const fieldStyle = { width: "100%", padding: "10px 14px", fontSize: 14, border: "1px solid #d0d0d0", borderRadius: 6, background: "#fff", fontFamily: "inherit", outline: "none", boxSizing: "border-box" };
const labelStyle = { fontSize: 12, fontWeight: 600, color: "#444", marginBottom: 4, display: "block" };
const btnStyle = (bg = "#1a1a2e") => ({ padding: "8px 20px", fontSize: 13, fontWeight: 500, color: "#fff", background: bg, border: "none", borderRadius: 4, cursor: "pointer" });

/** 클릭 가능한 별점 입력 */
function StarInput({ value, onChange }) {
  return (
    <span style={{ display: "inline-flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          onClick={() => onChange(i)}
          style={{ fontSize: 22, cursor: "pointer", color: i <= value ? "#b08d57" : "#ddd", lineHeight: 1 }}
        >
          {i <= value ? "\u2605" : "\u2606"}
        </span>
      ))}
    </span>
  );
}

/** 읽기전용 별점 표시 */
function Stars({ rating }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ fontSize: 14, color: i <= rating ? "#b08d57" : "#ddd" }}>
          {i <= rating ? "\u2605" : "\u2606"}
        </span>
      ))}
    </span>
  );
}

function categoryLabel(val) {
  const found = CATEGORIES.find((c) => c.value === val);
  return found ? found.label : val;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = () => {
    setLoading(true);
    api.get("/reviews?all=true")
      .then((json) => setReviews(json.data ?? []))
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openNew = () => {
    setEditing("new");
    setForm({ ...EMPTY_FORM });
  };

  const openEdit = (review) => {
    setEditing(review.id);
    setForm({
      clientName: review.clientName || "",
      rating: review.rating || 5,
      content: review.content || "",
      category: review.category || "civil",
      isAnonymous: review.isAnonymous ?? 0,
      isPublished: review.isPublished ?? 0,
    });
  };

  const save = async () => {
    if (!form.content.trim()) return alert("내용을 입력해주세요");
    if (!form.isAnonymous && !form.clientName.trim()) return alert("이름을 입력하거나 익명을 선택해주세요");
    try {
      if (editing === "new") {
        await api.post("/reviews", form);
      } else {
        await api.patch(`/reviews/${editing}`, form);
      }
      setEditing(null);
      load();
    } catch (err) {
      alert("저장 실패: " + err.message);
    }
  };

  const remove = async (id) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await api.delete(`/reviews/${id}`);
      load();
    } catch (err) {
      alert("삭제 실패: " + err.message);
    }
  };

  /** 게시 상태 토글 (승인/거절) */
  const togglePublish = async (review) => {
    try {
      await api.patch(`/reviews/${review.id}`, { isPublished: review.isPublished ? 0 : 1 });
      load();
    } catch (err) {
      alert("상태 변경 실패: " + err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "#1a1a1a" }}>후기 관리</h1>
        <button onClick={openNew} style={btnStyle()}>+ 후기 등록</button>
      </div>

      {/* ==================== 편집 폼 ==================== */}
      {editing && (
        <div style={{ marginBottom: 32, padding: 28, background: "#f9f9f8", border: "1px solid #e0e0e0", borderRadius: 8 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: "#1a1a1a" }}>
            {editing === "new" ? "새 후기 등록" : "후기 수정"}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" style={{ marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>의뢰인 이름</label>
              <input
                style={fieldStyle}
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                placeholder="홍길동"
                disabled={form.isAnonymous}
              />
            </div>
            <div>
              <label style={labelStyle}>카테고리</label>
              <select style={fieldStyle} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>별점</label>
              <StarInput value={form.rating} onChange={(r) => setForm({ ...form, rating: r })} />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={form.isAnonymous === 1}
                  onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked ? 1 : 0 })}
                />
                익명
              </label>
              <label className="flex items-center gap-2 cursor-pointer" style={{ fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={form.isPublished === 1}
                  onChange={(e) => setForm({ ...form, isPublished: e.target.checked ? 1 : 0 })}
                />
                게시
              </label>
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>후기 내용 *</label>
            <textarea
              style={{ ...fieldStyle, minHeight: 100, resize: "vertical" }}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="의뢰인 후기를 입력하세요"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={save} style={btnStyle("#1a1a2e")}>저장</button>
            <button onClick={() => setEditing(null)} style={btnStyle("#999")}>취소</button>
          </div>
        </div>
      )}

      {/* ==================== 후기 목록 ==================== */}
      {loading ? (
        <p style={{ color: "#999", fontSize: 14 }}>로딩 중...</p>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: "#bbb" }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>&#x1F4DD;</p>
          <p>등록된 후기가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              style={{
                padding: "16px 20px",
                background: review.isPublished ? "#fff" : "#f5f5f3",
                border: "1px solid #e8e8e8",
                borderRadius: 6,
                opacity: review.isPublished ? 1 : 0.7,
              }}
            >
              <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>
                    {review.isAnonymous ? "익명" : review.clientName}
                  </span>
                  <Stars rating={review.rating} />
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 8,
                    background: "rgba(176,141,87,0.1)", color: "#b08d57",
                  }}>
                    {categoryLabel(review.category)}
                  </span>
                  <span style={{
                    fontSize: 11, padding: "2px 8px", borderRadius: 8,
                    background: review.isPublished ? "#e8f5e9" : "#fce4ec",
                    color: review.isPublished ? "#2e7d32" : "#c62828",
                  }}>
                    {review.isPublished ? "게시중" : "미게시"}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: "#bbb" }}>
                  {review.createdAt ? new Date(review.createdAt).toLocaleDateString("ko-KR") : ""}
                </span>
              </div>
              <p style={{ fontSize: 13, color: "#555", lineHeight: 1.6, marginBottom: 12 }}>
                {review.content?.length > 120 ? review.content.slice(0, 120) + "..." : review.content}
              </p>
              <div className="flex gap-2">
                <button onClick={() => togglePublish(review)} style={{
                  padding: "5px 12px", fontSize: 12, border: "1px solid #ddd",
                  background: "#fff", borderRadius: 4, cursor: "pointer",
                  color: review.isPublished ? "#c62828" : "#2e7d32",
                }}>
                  {review.isPublished ? "게시 중단" : "승인(게시)"}
                </button>
                <button onClick={() => openEdit(review)} style={{
                  padding: "5px 12px", fontSize: 12, border: "1px solid #ddd",
                  background: "#fff", borderRadius: 4, cursor: "pointer",
                }}>
                  수정
                </button>
                <button onClick={() => remove(review.id)} style={{
                  padding: "5px 12px", fontSize: 12, border: "1px solid #ddd",
                  background: "#fff", borderRadius: 4, cursor: "pointer", color: "#c00",
                }}>
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
