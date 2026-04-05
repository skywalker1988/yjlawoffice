/**
 * AdminTags — 미국 정부 스타일 태그 관리 페이지
 * 구조화된 카드 그리드 + 공식 문서풍 폼
 */
import { useState, useEffect } from "react";
import { Input } from "../../components/ui/Input";
import { api } from "../../utils/api";

const GOV = {
  accent: "#4f46e5",
  accentLight: "#6366f1",
  accentDim: "rgba(79,70,229,0.07)",
  text: "#1e293b",
  textSec: "#475569",
  textMuted: "#94a3b8",
  border: "#e5e8ed",
  headerBg: `linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)`,
  rowAlt: "#f9fafb",
};

const PRESET_COLORS = [
  "#1a365d", "#742a2a", "#22543d", "#553c9a",
  "#c05621", "#086f83", "#975a16", "#2d3748",
  "#718096", "#9c4221", "#9b2c2c", "#276749",
];

export default function AdminTags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const fetchTags = () => {
    setLoading(true);
    api.get("/tags")
      .then((json) => setTags(Array.isArray(json.data) ? json.data : []))
      .catch(() => setTags([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTags(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await api.post("/tags", { name: newName.trim(), color: newColor });
      setNewName("");
      setNewColor(PRESET_COLORS[0]);
      fetchTags();
    } catch (err) {
      alert("생성 실패: " + err.message);
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (tag) => {
    setEditId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color || PRESET_COLORS[0]);
  };

  const handleUpdate = async () => {
    if (!editName.trim()) return;
    try {
      await api.patch(`/tags/${editId}`, { name: editName.trim(), color: editColor });
      setEditId(null);
      fetchTags();
    } catch (err) {
      alert("수정 실패: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.del(`/tags/${id}`);
      setDeleteId(null);
      fetchTags();
    } catch (err) {
      alert("삭제 실패: " + err.message);
    }
  };

  /** 색상 선택기 */
  const ColorPicker = ({ value, onChange, size = 22 }) => (
    <div className="flex gap-1.5 flex-wrap">
      {PRESET_COLORS.map((c) => (
        <button key={c} onClick={() => onChange(c)} style={{
          width: size, height: size, borderRadius: 2,
          background: c, cursor: "pointer",
          border: value === c ? "2px solid #fff" : "2px solid transparent",
          boxShadow: value === c ? `0 0 0 2px ${c}` : "none",
          transition: "all 0.1s",
        }} />
      ))}
    </div>
  );

  return (
    <div>
      {/* 페이지 헤더 */}
      <div style={{ marginBottom: 28, paddingBottom: 16, borderBottom: `2px solid ${GOV.accent}` }}>
        <h1 style={{
          fontSize: 22, fontWeight: 700, color: GOV.accent,
          fontFamily: "'Georgia', serif", letterSpacing: "0.03em",
        }}>
          태그 관리
        </h1>
        <p style={{ fontSize: 12, color: GOV.textMuted, marginTop: 4 }}>
          문서 분류를 위한 태그 생성 및 관리 | 총 {tags.length}개
        </p>
      </div>

      {/* 생성 폼 — 정부 스타일 패널 */}
      <div style={{
        marginBottom: 32, border: `1px solid ${GOV.border}`,
        borderRadius: 2, overflow: "hidden", background: "#fff",
      }}>
        <div style={{
          background: GOV.headerBg, padding: "10px 20px",
          borderBottom: `2px solid ${GOV.accent}`,
        }}>
          <h3 style={{
            fontSize: 11, fontWeight: 700, color: GOV.accent,
            letterSpacing: "0.12em", textTransform: "uppercase",
          }}>
            신규 태그 등록
          </h3>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div className="flex flex-wrap items-end gap-4">
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{
                display: "block", marginBottom: 4, fontSize: 10,
                fontWeight: 700, color: GOV.textSec, letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>태그명</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="새 태그 이름 입력"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                style={{ borderRadius: 2 }}
              />
            </div>
            <div>
              <label style={{
                display: "block", marginBottom: 6, fontSize: 10,
                fontWeight: 700, color: GOV.textSec, letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>색상 코드</label>
              <ColorPicker value={newColor} onChange={setNewColor} />
            </div>
            <button onClick={handleCreate} disabled={creating || !newName.trim()} style={{
              padding: "8px 24px", fontSize: 12, fontWeight: 600,
              background: GOV.accent, color: GOV.accent, border: "none",
              borderRadius: 2, cursor: "pointer",
              opacity: creating || !newName.trim() ? 0.5 : 1,
              letterSpacing: "0.06em",
            }}>
              {creating ? "처리 중..." : "태그 등록"}
            </button>
          </div>
        </div>
      </div>

      {/* 태그 목록 */}
      {loading ? (
        <div style={{ padding: 60, textAlign: "center", color: GOV.textMuted }}>
          <div className="spinner" style={{ margin: "0 auto 12px" }} />
          태그 목록 조회 중...
        </div>
      ) : tags.length === 0 ? (
        <div style={{
          padding: 60, textAlign: "center", color: GOV.textMuted,
          border: `1px dashed ${GOV.border}`, borderRadius: 2,
        }}>
          등록된 태그가 없습니다
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((tag) => (
            <div key={tag.id} style={{
              background: "#fff", border: `1px solid ${GOV.border}`,
              borderLeft: `4px solid ${tag.color || GOV.accent}`,
              borderRadius: 2, padding: "16px 20px",
              transition: "box-shadow 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
            >
              {editId === tag.id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
                    style={{ borderRadius: 2 }}
                  />
                  <ColorPicker value={editColor} onChange={setEditColor} size={18} />
                  <div className="flex gap-2">
                    <button onClick={handleUpdate} style={{
                      padding: "5px 14px", fontSize: 11, fontWeight: 600,
                      background: GOV.accent, color: GOV.accent, border: "none",
                      borderRadius: 2, cursor: "pointer",
                    }}>저장</button>
                    <button onClick={() => setEditId(null)} style={{
                      padding: "5px 14px", fontSize: 11, fontWeight: 600,
                      background: "transparent", color: GOV.textSec,
                      border: `1px solid ${GOV.border}`, borderRadius: 2, cursor: "pointer",
                    }}>취소</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div style={{
                      width: 10, height: 10, borderRadius: 1,
                      background: tag.color || GOV.accent, flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: 14, fontWeight: 600, color: GOV.text, flex: 1,
                    }}>
                      {tag.name}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 11, color: GOV.textMuted, marginBottom: 12,
                    fontFamily: "'Georgia', serif",
                  }}>
                    연결 문서: {tag._count?.documents ?? 0}건
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(tag)} style={{
                      padding: "4px 12px", fontSize: 11, fontWeight: 500,
                      background: "transparent", color: GOV.textSec,
                      border: `1px solid ${GOV.border}`, borderRadius: 2, cursor: "pointer",
                    }}>수정</button>
                    <button onClick={() => setDeleteId(tag.id)} style={{
                      padding: "4px 12px", fontSize: 11, fontWeight: 500,
                      background: "transparent", color: "#b91c1c",
                      border: "1px solid #fecaca", borderRadius: 2, cursor: "pointer",
                    }}>삭제</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteId && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(11,26,46,0.6)" }} onClick={() => setDeleteId(null)} />
          <div style={{
            position: "relative", background: "#fff", borderRadius: 2,
            maxWidth: 400, width: "90%",
            border: `1px solid ${GOV.border}`, overflow: "hidden",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          }}>
            <div style={{
              background: "#7f1d1d", padding: "12px 24px",
              borderBottom: "2px solid #ef4444",
            }}>
              <h3 style={{
                fontSize: 12, fontWeight: 700, color: "#fecaca",
                letterSpacing: "0.1em", textTransform: "uppercase",
              }}>태그 삭제 확인</h3>
            </div>
            <div style={{ padding: "20px 24px" }}>
              <p style={{ fontSize: 13, color: GOV.text, marginBottom: 20 }}>
                이 태그를 삭제하시겠습니까?
              </p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setDeleteId(null)} style={{
                  padding: "7px 18px", fontSize: 12, fontWeight: 600,
                  background: "transparent", color: GOV.textSec,
                  border: `1px solid ${GOV.border}`, borderRadius: 2, cursor: "pointer",
                }}>취소</button>
                <button onClick={() => handleDelete(deleteId)} style={{
                  padding: "7px 18px", fontSize: 12, fontWeight: 600,
                  background: "#b91c1c", color: "#fff",
                  border: "none", borderRadius: 2, cursor: "pointer",
                }}>삭제 확인</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
