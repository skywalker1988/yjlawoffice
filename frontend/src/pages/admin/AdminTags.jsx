/** AdminTags — 관리자 태그 관리 페이지 */
import { useState, useEffect } from "react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card, CardContent } from "../../components/ui/Card";
import { api } from "../../utils/api";

const PRESET_COLORS = [
  "#3498db", "#e74c3c", "#2ecc71", "#9b59b6",
  "#e67e22", "#1abc9c", "#f39c12", "#34495e",
  "#95a5a6", "#d35400", "#c0392b", "#27ae60",
];

export default function AdminTags() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [creating, setCreating] = useState(false);

  // Edit state
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  // Delete confirmation
  const [deleteId, setDeleteId] = useState(null);

  const fetchTags = () => {
    setLoading(true);
    api.get("/tags")
      .then((json) => setTags(Array.isArray(json.data) ? json.data : []))
      .catch(() => setTags([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTags();
  }, []);

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

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24 }}>태그 관리</h2>

      {/* Create Form */}
      <Card style={{ marginBottom: 32 }}>
        <CardContent>
          <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 12 }}>새 태그</p>
          <div className="flex flex-wrap items-end gap-3">
            <div style={{ flex: 1, minWidth: 200 }}>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="태그 이름"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div>
              <p style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>색상</p>
              <div className="flex gap-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: c,
                      border: newColor === c ? "2px solid #333" : "2px solid transparent",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </div>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
              {creating ? "생성 중..." : "생성"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tags Grid */}
      {loading ? (
        <p style={{ textAlign: "center", color: "#999", padding: 40 }}>불러오는 중...</p>
      ) : tags.length === 0 ? (
        <p style={{ textAlign: "center", color: "#999", padding: 40 }}>태그가 없습니다.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tags.map((tag) => (
            <Card key={tag.id}>
              <CardContent>
                {editId === tag.id ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleUpdate()}
                    />
                    <div className="flex gap-1">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setEditColor(c)}
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: c,
                            border: editColor === c ? "2px solid #333" : "2px solid transparent",
                            cursor: "pointer",
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleUpdate}>저장</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditId(null)}>취소</Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: tag.color || "#95a5a6",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 15, fontWeight: 500, flex: 1 }}>
                        {tag.name}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: "#999", marginBottom: 12 }}>
                      문서 {tag._count?.documents ?? 0}개
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(tag)}>
                        수정
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteId(tag.id)}
                        style={{ color: "#c44" }}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }}
            onClick={() => setDeleteId(null)}
          />
          <div
            style={{
              position: "relative",
              background: "#fff",
              borderRadius: 8,
              padding: 32,
              maxWidth: 400,
              width: "90%",
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>태그 삭제</h3>
            <p style={{ fontSize: 14, color: "#666", marginBottom: 24 }}>
              이 태그를 삭제하시겠습니까?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={() => setDeleteId(null)}>취소</Button>
              <Button variant="destructive" size="sm" onClick={() => handleDelete(deleteId)}>삭제</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
