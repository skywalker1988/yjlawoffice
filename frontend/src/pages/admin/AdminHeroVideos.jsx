/**
 * AdminHeroVideos — 프리미엄 히어로 영상 관리 + 인라인 비디오 에디터
 * 프리미어 프로 스타일 다크 UI + 타임라인 + 컬러 그레이딩 + 트림
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../../utils/api";

/* ── 디자인 토큰 ── */
const T = {
  accent: "#4f46e5", accentLight: "#6366f1",
  accentDim: "rgba(79,70,229,0.07)",
  text: "#1e293b", textSec: "#475569",
  textMuted: "#94a3b8", border: "#e5e8ed", card: "#ffffff",
  red: "#ef4444", green: "#16a34a",
};
/* 에디터 다크 테마 */
const D = {
  bg: "#1a1a2e", surface: "#232340", surfaceLight: "#2d2d4a",
  border: "#3a3a5c", text: "#e0e0f0", textDim: "#8888aa",
  accent: "#6c63ff", accentHover: "#7f78ff",
  timeline: "#0d0d1a", waveform: "#4a4a6a",
  red: "#ff4757", green: "#2ed573", blue: "#3742fa",
  orange: "#ffa502",
};

const CATEGORIES = {
  manhattan: "맨하탄", nyc: "뉴욕시", cityscape: "도시 풍경",
  office: "오피스", nature: "자연", abstract: "추상",
};
const PER_PAGE = 12;

export default function AdminHeroVideos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ title: "", url: "", category: "manhattan" });
  const [saving, setSaving] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editorVideo, setEditorVideo] = useState(null);
  const fileRef = useRef(null);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    try {
      const q = filter ? `?category=${filter}` : "";
      const res = await api.get(`/hero-videos${q}`);
      setVideos(res.data || []);
    } catch { setVideos([]); }
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);
  useEffect(() => { setPage(1); }, [filter, search]);

  // 검색 필터
  const filtered = search
    ? videos.filter(v => v.title.toLowerCase().includes(search.toLowerCase()))
    : videos;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const activeVideo = videos.find(v => v.isActive);

  /* ── 핸들러 ── */
  const handleActivate = async (id) => {
    try {
      const res = await api.patch(`/hero-videos/${id}/activate`, {});
      if (res.data?.url) localStorage.setItem("activeHeroVideo", res.data.url);
      fetchVideos();
    } catch (err) { alert("활성화 실패: " + err.message); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/hero-videos/${id}`);
      setDeleteConfirm(null);
      fetchVideos();
    } catch (err) { alert("삭제 실패: " + err.message); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (uploadMode && fileRef.current?.files[0]) {
        const fd = new FormData();
        fd.append("file", fileRef.current.files[0]);
        fd.append("title", form.title);
        fd.append("category", form.category);
        await fetch("/api/sb/hero-videos/upload", { method: "POST", body: fd });
      } else if (editingId) {
        await api.patch(`/hero-videos/${editingId}`, form);
      } else {
        await api.post("/hero-videos", form);
      }
      setShowForm(false);
      fetchVideos();
    } catch (err) { alert("저장 실패: " + err.message); }
    setSaving(false);
  };

  return (
    <div>
      {/* ── 헤더 ── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 8 }}>
          MEDIA MANAGEMENT
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: T.text }}>히어로 영상</h1>
          <button onClick={() => { setEditingId(null); setForm({ title: "", url: "", category: "manhattan" }); setUploadMode(false); setShowForm(true); }}
            style={{ background: T.accent, color: "#fff", border: "none", padding: "10px 24px", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", cursor: "pointer" }}>
            + 새 영상
          </button>
        </div>
      </div>

      {/* ── 현재 활성 프리뷰 ── */}
      {activeVideo && (
        <div style={{ marginBottom: 28, background: T.card, border: `1px solid ${T.border}`, overflow: "hidden" }}>
          <div style={{ display: "flex", minHeight: 180 }}>
            <div style={{ flex: "0 0 320px", position: "relative", background: "#000" }}>
              <video key={activeVideo.url} src={activeVideo.url} autoPlay muted loop playsInline
                style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ flex: 1, padding: "24px 32px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.2em", color: T.textMuted, marginBottom: 10 }}>CURRENTLY ACTIVE</div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: T.text, marginBottom: 6 }}>{activeVideo.title}</h2>
              <div style={{ fontSize: 11, color: T.textMuted }}>{CATEGORIES[activeVideo.category]} · {activeVideo.url}</div>
              <div style={{ marginTop: 16, display: "flex", gap: 20, fontSize: 11, color: T.textMuted }}>
                <span><b style={{ color: T.text, fontSize: 16, fontWeight: 300 }}>{videos.length}</b> 전체</span>
                <span><b style={{ color: T.text, fontSize: 16, fontWeight: 300 }}>{[...new Set(videos.map(v => v.category))].length}</b> 카테고리</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 필터 바 ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[{ key: "", label: "전체" }, ...Object.entries(CATEGORIES).map(([k, v]) => ({ key: k, label: v }))].map(c => (
            <button key={c.key} onClick={() => setFilter(c.key)} style={{
              padding: "6px 14px", fontSize: 11, fontWeight: 500, cursor: "pointer",
              background: filter === c.key ? T.accent : "transparent",
              color: filter === c.key ? "#fff" : T.textSec,
              border: `1px solid ${filter === c.key ? T.accent : T.border}`,
              transition: "all 0.15s",
            }}>{c.label}</button>
          ))}
        </div>
        <input
          type="text" value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="영상 검색..."
          style={{ padding: "7px 14px", fontSize: 12, border: `1px solid ${T.border}`, outline: "none", width: 200, color: T.text }}
        />
      </div>

      {/* ── 영상 그리드 ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}>불러오는 중...</div>
      ) : paged.length === 0 ? (
        <div style={{ textAlign: "center", padding: 60, color: T.textMuted }}>영상이 없습니다</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {paged.map(v => (
            <VCard key={v.id} v={v}
              onActivate={handleActivate}
              onEdit={() => { setEditingId(v.id); setForm({ title: v.title, url: v.url, category: v.category }); setUploadMode(false); setShowForm(true); }}
              onDelete={() => setDeleteConfirm(v.id)}
              onEditor={() => setEditorVideo(v)}
            />
          ))}
        </div>
      )}

      {/* ── 페이지네이션 ── */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 28 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            style={pgBtn(page > 1)}>← 이전</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              style={{ ...pgBtn(true), background: p === page ? T.accent : "transparent", color: p === page ? "#fff" : T.textSec, minWidth: 32 }}>
              {p}
            </button>
          ))}
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            style={pgBtn(page < totalPages)}>다음 →</button>
        </div>
      )}

      {/* ── 비디오 에디터 모달 ── */}
      {editorVideo && (
        <VideoEditor
          video={editorVideo}
          onClose={() => { setEditorVideo(null); fetchVideos(); }}
          onActivate={handleActivate}
        />
      )}

      {/* ── 삭제 확인 ── */}
      {deleteConfirm && (
        <Overlay onClose={() => setDeleteConfirm(null)}>
          <div style={{ background: T.card, maxWidth: 400, width: "90%", padding: 32 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: "0.15em", marginBottom: 12 }}>DELETE CONFIRMATION</div>
            <p style={{ fontSize: 14, color: T.text, marginBottom: 24 }}>이 영상을 삭제하시겠습니까?</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding: "8px 20px", fontSize: 12, background: "transparent", border: `1px solid ${T.border}`, cursor: "pointer" }}>취소</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding: "8px 20px", fontSize: 12, background: T.red, color: "#fff", border: "none", cursor: "pointer", fontWeight: 600 }}>삭제</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ── 추가/수정 폼 ── */}
      {showForm && (
        <Overlay onClose={() => setShowForm(false)}>
          <div style={{ background: T.card, maxWidth: 520, width: "95%" }}>
            <div style={{ background: T.accent, padding: "16px 28px" }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.4)", letterSpacing: "0.18em", marginBottom: 4 }}>
                {editingId ? "EDIT" : "ADD NEW"}
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 500, color: "#fff" }}>{editingId ? "영상 수정" : "새 영상 추가"}</h3>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: "24px 28px" }}>
              {!editingId && (
                <div style={{ display: "flex", marginBottom: 20, borderBottom: `1px solid ${T.border}` }}>
                  {[false, true].map(m => (
                    <button key={String(m)} type="button" onClick={() => setUploadMode(m)}
                      style={{ padding: "8px 20px", fontSize: 11, fontWeight: 600, background: "none", border: "none", cursor: "pointer",
                        color: uploadMode === m ? T.accent : T.textMuted, borderBottom: uploadMode === m ? `2px solid ${T.accent}` : "2px solid transparent" }}>
                      {m ? "파일 업로드" : "URL 입력"}
                    </button>
                  ))}
                </div>
              )}
              <FL required>제목</FL>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="영상 제목" style={inp} />
              <div style={{ height: 16 }} />
              {uploadMode && !editingId ? (
                <>
                  <FL required>영상 파일</FL>
                  <div style={{ border: `2px dashed ${T.border}`, padding: 24, textAlign: "center", cursor: "pointer" }}
                    onClick={() => fileRef.current?.click()}>
                    <input ref={fileRef} type="file" accept="video/mp4,video/webm" style={{ display: "none" }}
                      onChange={e => { if (e.target.files[0] && !form.title) setForm(f => ({ ...f, title: e.target.files[0].name.replace(/\.[^.]+$/, "") })); }} />
                    <div style={{ fontSize: 20, color: T.textMuted, marginBottom: 6 }}>⬆</div>
                    <div style={{ fontSize: 12, color: T.textSec }}>클릭하여 파일 선택</div>
                    <div style={{ fontSize: 10, color: T.textMuted, marginTop: 4 }}>MP4, WebM (최대 100MB)</div>
                  </div>
                </>
              ) : (
                <>
                  <FL required>영상 URL</FL>
                  <input type="text" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="/videos/example.mp4" style={inp} />
                </>
              )}
              <div style={{ height: 16 }} />
              <FL>카테고리</FL>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...inp, background: "#fff" }}>
                {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 28 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: "10px 24px", fontSize: 12, background: "transparent", border: `1px solid ${T.border}`, cursor: "pointer" }}>취소</button>
                <button type="submit" disabled={saving} style={{ padding: "10px 28px", fontSize: 12, fontWeight: 600, background: T.accent, color: "#fff", border: "none", cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
                  {saving ? "저장 중..." : editingId ? "수정" : "추가"}
                </button>
              </div>
            </form>
          </div>
        </Overlay>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   비디오 에디터 — 프리미어 프로 스타일
   ═══════════════════════════════════════════════ */
function VideoEditor({ video, onClose, onActivate }) {
  const videoRef = useRef(null);
  const timelineRef = useRef(null);
  const canvasRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [trimIn, setTrimIn] = useState(0);
  const [trimOut, setTrimOut] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [activePanel, setActivePanel] = useState("color");
  const [videoMeta, setVideoMeta] = useState({ width: 0, height: 0, fps: 0 });

  // 컬러 그레이딩
  const [filters, setFilters] = useState({
    brightness: 100, contrast: 100, saturate: 100,
    hueRotate: 0, sepia: 0, blur: 0, opacity: 100,
    temperature: 0, vignette: 0,
  });

  // 트랜스폼
  const [transform, setTransform] = useState({
    scale: 100, rotate: 0, translateX: 0, translateY: 0,
    flipH: false, flipV: false,
  });

  // 프리셋
  const PRESETS = [
    { name: "원본", filters: { brightness: 100, contrast: 100, saturate: 100, hueRotate: 0, sepia: 0, blur: 0, opacity: 100, temperature: 0, vignette: 0 } },
    { name: "시네마틱", filters: { brightness: 95, contrast: 120, saturate: 80, hueRotate: -5, sepia: 10, blur: 0, opacity: 100, temperature: -10, vignette: 30 } },
    { name: "빈티지", filters: { brightness: 105, contrast: 90, saturate: 60, hueRotate: 15, sepia: 30, blur: 0, opacity: 100, temperature: 20, vignette: 20 } },
    { name: "네온", filters: { brightness: 110, contrast: 130, saturate: 150, hueRotate: 0, sepia: 0, blur: 0, opacity: 100, temperature: -20, vignette: 0 } },
    { name: "B&W", filters: { brightness: 105, contrast: 110, saturate: 0, hueRotate: 0, sepia: 0, blur: 0, opacity: 100, temperature: 0, vignette: 10 } },
    { name: "따뜻한", filters: { brightness: 102, contrast: 105, saturate: 110, hueRotate: 10, sepia: 15, blur: 0, opacity: 100, temperature: 30, vignette: 0 } },
    { name: "차가운", filters: { brightness: 100, contrast: 105, saturate: 90, hueRotate: -15, sepia: 0, blur: 0, opacity: 100, temperature: -30, vignette: 0 } },
    { name: "드라마틱", filters: { brightness: 90, contrast: 140, saturate: 70, hueRotate: 0, sepia: 5, blur: 0, opacity: 100, temperature: -5, vignette: 40 } },
  ];

  const cssFilter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%) hue-rotate(${filters.hueRotate + filters.temperature}deg) sepia(${filters.sepia}%) blur(${filters.blur}px) opacity(${filters.opacity}%)`;
  const cssTransform = `scale(${transform.scale / 100}) rotate(${transform.rotate}deg) translate(${transform.translateX}px, ${transform.translateY}px) scaleX(${transform.flipH ? -1 : 1}) scaleY(${transform.flipV ? -1 : 1})`;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onMeta = () => {
      setDuration(v.duration);
      setTrimOut(v.duration);
      setVideoMeta({ width: v.videoWidth, height: v.videoHeight, fps: 30 });
    };
    const onTime = () => setCurrentTime(v.currentTime);
    const onEnd = () => setPlaying(false);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnd);
    return () => { v.removeEventListener("loadedmetadata", onMeta); v.removeEventListener("timeupdate", onTime); v.removeEventListener("ended", onEnd); };
  }, [video.url]);

  useEffect(() => {
    const v = videoRef.current;
    if (v) v.playbackRate = speed;
  }, [speed]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); } else {
      if (v.currentTime < trimIn || v.currentTime >= trimOut) v.currentTime = trimIn;
      v.play();
    }
    setPlaying(!playing);
  };

  // 트림 영역 밖으로 나가면 정지
  useEffect(() => {
    if (playing && currentTime >= trimOut) {
      videoRef.current?.pause();
      setPlaying(false);
    }
  }, [currentTime, trimOut, playing]);

  const seek = (t) => { if (videoRef.current) { videoRef.current.currentTime = t; setCurrentTime(t); } };
  const stepFrame = (dir) => seek(Math.max(0, Math.min(duration, currentTime + dir / 30)));
  const fmt = (s) => { const m = Math.floor(s / 60); const sec = Math.floor(s % 60); const ms = Math.floor((s % 1) * 100); return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(ms).padStart(2, "0")}`; };

  // 스냅샷 내보내기
  const exportSnapshot = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d");
    ctx.filter = cssFilter;
    ctx.save();
    ctx.translate(c.width / 2, c.height / 2);
    ctx.rotate((transform.rotate * Math.PI) / 180);
    ctx.scale((transform.scale / 100) * (transform.flipH ? -1 : 1), (transform.scale / 100) * (transform.flipV ? -1 : 1));
    ctx.drawImage(v, -c.width / 2, -c.height / 2, c.width, c.height);
    ctx.restore();
    c.toBlob(blob => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${video.title}-snapshot.png`;
      a.click();
    });
  };

  const PANELS = [
    { id: "color", label: "컬러 그레이딩" },
    { id: "transform", label: "트랜스폼" },
    { id: "trim", label: "트림 & 컷" },
    { id: "info", label: "정보" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 2000, background: D.bg, display: "flex", flexDirection: "column", fontFamily: "'Inter', sans-serif" }}>
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* ── 상단 바 ── */}
      <div style={{ height: 42, background: D.surface, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", borderBottom: `1px solid ${D.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: D.accent }}>◆</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: D.text, letterSpacing: "0.04em" }}>VIDEO EDITOR</span>
          <span style={{ fontSize: 11, color: D.textDim, marginLeft: 8 }}>— {video.title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={exportSnapshot} style={topBtn}>📷 스냅샷</button>
          {!video.isActive && (
            <button onClick={() => { onActivate(video.id); }} style={{ ...topBtn, background: D.accent, color: "#fff" }}>활성화</button>
          )}
          <button onClick={onClose} style={{ ...topBtn, color: D.red }}>✕ 닫기</button>
        </div>
      </div>

      {/* ── 메인 영역 ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* 프리뷰 영역 */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#0a0a14" }}>
          {/* 비디오 뷰포트 */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
            <div style={{
              position: "relative", overflow: "hidden",
              boxShadow: "0 0 60px rgba(0,0,0,0.5)",
            }}>
              <video
                ref={videoRef}
                src={video.url}
                muted={volume === 0}
                playsInline
                style={{
                  maxWidth: `${zoom}%`, maxHeight: "100%",
                  filter: cssFilter, transform: cssTransform,
                  display: "block",
                }}
              />
              {/* 비네팅 오버레이 */}
              {filters.vignette > 0 && (
                <div style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${filters.vignette / 100}) 100%)`,
                }} />
              )}
            </div>
          </div>

          {/* 전송 컨트롤 */}
          <div style={{ height: 48, background: D.surface, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderTop: `1px solid ${D.border}`, flexShrink: 0 }}>
            <button onClick={() => seek(trimIn)} style={ctrlBtn} title="구간 시작">⏮</button>
            <button onClick={() => stepFrame(-1)} style={ctrlBtn} title="이전 프레임">◀◀</button>
            <button onClick={togglePlay} style={{ ...ctrlBtn, width: 40, height: 40, fontSize: 18, background: D.accent, borderRadius: "50%", color: "#fff" }}>
              {playing ? "⏸" : "▶"}
            </button>
            <button onClick={() => stepFrame(1)} style={ctrlBtn} title="다음 프레임">▶▶</button>
            <button onClick={() => seek(trimOut)} style={ctrlBtn} title="구간 끝">⏭</button>

            <div style={{ width: 1, height: 24, background: D.border, margin: "0 12px" }} />

            {/* 타임코드 */}
            <span style={{ fontSize: 13, fontFamily: "'Courier New', monospace", color: D.accent, fontWeight: 600, letterSpacing: "0.05em", minWidth: 90 }}>
              {fmt(currentTime)}
            </span>
            <span style={{ fontSize: 11, color: D.textDim }}>/</span>
            <span style={{ fontSize: 11, fontFamily: "'Courier New', monospace", color: D.textDim, minWidth: 80 }}>
              {fmt(duration)}
            </span>

            <div style={{ width: 1, height: 24, background: D.border, margin: "0 12px" }} />

            {/* 속도 */}
            <select value={speed} onChange={e => setSpeed(Number(e.target.value))}
              style={{ background: D.surfaceLight, color: D.text, border: `1px solid ${D.border}`, padding: "4px 8px", fontSize: 11, outline: "none" }}>
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
                <option key={s} value={s}>{s}x</option>
              ))}
            </select>

            {/* 줌 */}
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 8 }}>
              <span style={{ fontSize: 10, color: D.textDim }}>줌</span>
              <input type="range" min={50} max={200} value={zoom} onChange={e => setZoom(Number(e.target.value))}
                style={{ width: 60, accentColor: D.accent }} />
              <span style={{ fontSize: 10, color: D.textDim, minWidth: 30 }}>{zoom}%</span>
            </div>
          </div>
        </div>

        {/* 우측 속성 패널 */}
        <div style={{ width: 300, background: D.surface, borderLeft: `1px solid ${D.border}`, display: "flex", flexDirection: "column", flexShrink: 0 }}>
          {/* 패널 탭 */}
          <div style={{ display: "flex", borderBottom: `1px solid ${D.border}`, flexShrink: 0 }}>
            {PANELS.map(p => (
              <button key={p.id} onClick={() => setActivePanel(p.id)}
                style={{
                  flex: 1, padding: "10px 4px", fontSize: 9, fontWeight: 600,
                  background: activePanel === p.id ? D.surfaceLight : "transparent",
                  color: activePanel === p.id ? D.accent : D.textDim,
                  border: "none", borderBottom: activePanel === p.id ? `2px solid ${D.accent}` : "2px solid transparent",
                  cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase",
                }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* 패널 내용 */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>

            {activePanel === "color" && (
              <>
                {/* 프리셋 */}
                <PanelSection title="프리셋">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {PRESETS.map(p => (
                      <button key={p.name} onClick={() => setFilters(p.filters)}
                        style={{
                          padding: "6px 8px", fontSize: 10, fontWeight: 500,
                          background: D.surfaceLight, color: D.text,
                          border: `1px solid ${D.border}`, cursor: "pointer",
                          transition: "all 0.15s",
                        }}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </PanelSection>

                <PanelSection title="기본 보정">
                  <Slider label="밝기" value={filters.brightness} min={0} max={200} onChange={v => setFilters(f => ({ ...f, brightness: v }))} />
                  <Slider label="대비" value={filters.contrast} min={0} max={200} onChange={v => setFilters(f => ({ ...f, contrast: v }))} />
                  <Slider label="채도" value={filters.saturate} min={0} max={200} onChange={v => setFilters(f => ({ ...f, saturate: v }))} />
                  <Slider label="색조" value={filters.hueRotate} min={-180} max={180} onChange={v => setFilters(f => ({ ...f, hueRotate: v }))} />
                </PanelSection>

                <PanelSection title="크리에이티브">
                  <Slider label="색온도" value={filters.temperature} min={-50} max={50} onChange={v => setFilters(f => ({ ...f, temperature: v }))} />
                  <Slider label="세피아" value={filters.sepia} min={0} max={100} onChange={v => setFilters(f => ({ ...f, sepia: v }))} />
                  <Slider label="블러" value={filters.blur} min={0} max={20} step={0.5} onChange={v => setFilters(f => ({ ...f, blur: v }))} />
                  <Slider label="비네팅" value={filters.vignette} min={0} max={80} onChange={v => setFilters(f => ({ ...f, vignette: v }))} />
                  <Slider label="투명도" value={filters.opacity} min={0} max={100} onChange={v => setFilters(f => ({ ...f, opacity: v }))} />
                </PanelSection>
              </>
            )}

            {activePanel === "transform" && (
              <>
                <PanelSection title="크기 & 회전">
                  <Slider label="스케일" value={transform.scale} min={50} max={200} suffix="%" onChange={v => setTransform(t => ({ ...t, scale: v }))} />
                  <Slider label="회전" value={transform.rotate} min={-180} max={180} suffix="°" onChange={v => setTransform(t => ({ ...t, rotate: v }))} />
                </PanelSection>
                <PanelSection title="위치">
                  <Slider label="X 이동" value={transform.translateX} min={-500} max={500} suffix="px" onChange={v => setTransform(t => ({ ...t, translateX: v }))} />
                  <Slider label="Y 이동" value={transform.translateY} min={-500} max={500} suffix="px" onChange={v => setTransform(t => ({ ...t, translateY: v }))} />
                </PanelSection>
                <PanelSection title="뒤집기">
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => setTransform(t => ({ ...t, flipH: !t.flipH }))}
                      style={{ ...flipBtn, background: transform.flipH ? D.accent : D.surfaceLight }}>↔ 좌우</button>
                    <button onClick={() => setTransform(t => ({ ...t, flipV: !t.flipV }))}
                      style={{ ...flipBtn, background: transform.flipV ? D.accent : D.surfaceLight }}>↕ 상하</button>
                  </div>
                </PanelSection>
                <PanelSection title="초기화">
                  <button onClick={() => setTransform({ scale: 100, rotate: 0, translateX: 0, translateY: 0, flipH: false, flipV: false })}
                    style={{ ...flipBtn, width: "100%", background: D.surfaceLight }}>모든 트랜스폼 초기화</button>
                </PanelSection>
              </>
            )}

            {activePanel === "trim" && (
              <>
                <PanelSection title="구간 설정">
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 10, color: D.textDim }}>IN: {fmt(trimIn)}</span>
                      <span style={{ fontSize: 10, color: D.textDim }}>OUT: {fmt(trimOut)}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => setTrimIn(currentTime)} style={{ ...flipBtn, flex: 1, background: D.blue }}>[ 시작점 설정</button>
                      <button onClick={() => setTrimOut(currentTime)} style={{ ...flipBtn, flex: 1, background: D.red }}>] 끝점 설정</button>
                    </div>
                  </div>
                  <Slider label="시작" value={trimIn} min={0} max={duration} step={0.1} suffix="s" onChange={v => setTrimIn(v)} />
                  <Slider label="끝" value={trimOut} min={0} max={duration} step={0.1} suffix="s" onChange={v => setTrimOut(v)} />
                  <div style={{ fontSize: 11, color: D.accent, marginTop: 8, fontFamily: "'Courier New', monospace" }}>
                    구간 길이: {fmt(Math.max(0, trimOut - trimIn))}
                  </div>
                </PanelSection>
                <PanelSection title="재생 범위">
                  <button onClick={() => { setTrimIn(0); setTrimOut(duration); }}
                    style={{ ...flipBtn, width: "100%", background: D.surfaceLight }}>전체 범위로 초기화</button>
                </PanelSection>
              </>
            )}

            {activePanel === "info" && (
              <PanelSection title="영상 정보">
                <InfoRow label="제목" value={video.title} />
                <InfoRow label="경로" value={video.url} />
                <InfoRow label="카테고리" value={CATEGORIES[video.category] || video.category} />
                <InfoRow label="해상도" value={`${videoMeta.width} × ${videoMeta.height}`} />
                <InfoRow label="길이" value={fmt(duration)} />
                <InfoRow label="상태" value={video.isActive ? "활성" : "비활성"} />
                <InfoRow label="등록일" value={video.createdAt?.slice(0, 10) || "—"} />
              </PanelSection>
            )}
          </div>
        </div>
      </div>

      {/* ── 하단 타임라인 ── */}
      <div style={{ height: 80, background: D.timeline, borderTop: `1px solid ${D.border}`, flexShrink: 0, display: "flex", flexDirection: "column" }}>
        {/* 타임라인 눈금 */}
        <div style={{ height: 18, background: D.surface, display: "flex", alignItems: "center", padding: "0 16px", borderBottom: `1px solid ${D.border}` }}>
          {duration > 0 && Array.from({ length: Math.min(20, Math.ceil(duration)) + 1 }, (_, i) => {
            const t = (i / Math.min(20, Math.ceil(duration))) * duration;
            return (
              <span key={i} style={{
                position: "absolute", left: `${(i / Math.min(20, Math.ceil(duration))) * 100}%`,
                fontSize: 8, color: D.textDim, fontFamily: "'Courier New', monospace",
              }}>
                {fmt(t)}
              </span>
            );
          })}
        </div>

        {/* 타임라인 트랙 */}
        <div ref={timelineRef}
          style={{ flex: 1, position: "relative", margin: "0 16px", cursor: "pointer" }}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            seek(pct * duration);
          }}
        >
          {/* 배경 웨이브폼 시뮬레이션 */}
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", gap: 1, padding: "8px 0",
          }}>
            {Array.from({ length: 120 }, (_, i) => (
              <div key={i} style={{
                flex: 1, height: `${20 + Math.sin(i * 0.3) * 40 + Math.random() * 30}%`,
                background: D.waveform, borderRadius: 1, opacity: 0.5,
              }} />
            ))}
          </div>

          {/* 트림 영역 */}
          {duration > 0 && (
            <div style={{
              position: "absolute", top: 0, bottom: 0,
              left: `${(trimIn / duration) * 100}%`,
              width: `${((trimOut - trimIn) / duration) * 100}%`,
              background: `${D.accent}20`,
              borderLeft: `2px solid ${D.blue}`,
              borderRight: `2px solid ${D.red}`,
            }} />
          )}

          {/* 플레이헤드 */}
          {duration > 0 && (
            <div style={{
              position: "absolute", top: 0, bottom: 0,
              left: `${(currentTime / duration) * 100}%`,
              width: 2, background: D.accent,
              boxShadow: `0 0 6px ${D.accent}`,
              zIndex: 10,
            }}>
              <div style={{
                position: "absolute", top: -4, left: -5,
                width: 0, height: 0,
                borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
                borderTop: `8px solid ${D.accent}`,
              }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 공용 컴포넌트 ── */
function VCard({ v, onActivate, onEdit, onDelete, onEditor }) {
  const [hov, setHov] = useState(false);
  const vRef = useRef(null);
  useEffect(() => {
    if (hov && vRef.current) vRef.current.play();
    else if (vRef.current) { vRef.current.pause(); vRef.current.currentTime = 0; }
  }, [hov]);

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: T.card, border: v.isActive ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
        overflow: "hidden", transition: "box-shadow 0.2s, transform 0.2s",
        boxShadow: hov ? "0 8px 24px rgba(0,0,0,0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
        transform: hov ? "translateY(-2px)" : "none",
      }}>
      <div style={{ position: "relative", height: 155, background: "#000", cursor: "pointer" }} onClick={() => onEditor()}>
        <video ref={vRef} src={v.url} muted loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: hov ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0.2)", transition: "background 0.2s", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {!hov && <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}><span style={{ fontSize: 14, color: "#fff", marginLeft: 2 }}>▶</span></div>}
        </div>
        {v.isActive && <div style={{ position: "absolute", top: 8, right: 8, background: T.accent, color: "#fff", fontSize: 8, fontWeight: 700, padding: "3px 8px", letterSpacing: "0.15em" }}>ACTIVE</div>}
        <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(0,0,0,0.6)", color: "rgba(255,255,255,0.8)", fontSize: 9, fontWeight: 500, padding: "2px 8px", backdropFilter: "blur(4px)" }}>
          {CATEGORIES[v.category] || v.category}
        </div>
      </div>
      <div style={{ padding: "10px 14px" }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{v.title}</div>
        <div style={{ display: "flex", gap: 6 }}>
          {!v.isActive && <button onClick={e => { e.stopPropagation(); onActivate(v.id); }} style={cBtn(T.accent)}>활성화</button>}
          <button onClick={e => { e.stopPropagation(); onEditor(); }} style={cBtn("#6c63ff")}>편집</button>
          <button onClick={e => { e.stopPropagation(); onEdit(); }} style={cBtn(T.textSec)}>수정</button>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} style={cBtn(T.red)}>삭제</button>
        </div>
      </div>
    </div>
  );
}

function Overlay({ onClose, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={onClose} />
      <div style={{ position: "relative", zIndex: 1 }}>{children}</div>
    </div>
  );
}

function PanelSection({ title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 9, fontWeight: 700, color: D.textDim, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 10, paddingBottom: 6, borderBottom: `1px solid ${D.border}` }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Slider({ label, value, min, max, step = 1, suffix = "", onChange }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 10, color: D.textDim }}>{label}</span>
        <span style={{ fontSize: 10, color: D.accent, fontFamily: "'Courier New', monospace" }}>{typeof value === "number" ? (Number.isInteger(step) ? value : value.toFixed(1)) : value}{suffix}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: "100%", accentColor: D.accent, height: 4 }} />
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${D.border}` }}>
      <span style={{ fontSize: 10, color: D.textDim }}>{label}</span>
      <span style={{ fontSize: 10, color: D.text, maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
    </div>
  );
}

function FL({ children, required }) {
  return <label style={{ display: "block", marginBottom: 6, fontSize: 10, fontWeight: 600, color: T.textSec, letterSpacing: "0.12em", textTransform: "uppercase" }}>{children} {required && <span style={{ color: T.red }}>*</span>}</label>;
}

/* 스타일 헬퍼 */
const inp = { width: "100%", padding: "10px 14px", fontSize: 13, border: `1px solid ${T.border}`, outline: "none", boxSizing: "border-box", color: T.text, fontFamily: "inherit" };
const topBtn = { background: D.surfaceLight, color: D.text, border: `1px solid ${D.border}`, padding: "5px 14px", fontSize: 11, cursor: "pointer", fontWeight: 500 };
const ctrlBtn = { background: "none", border: "none", color: D.text, fontSize: 14, cursor: "pointer", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4 };
const flipBtn = { padding: "7px 12px", fontSize: 10, fontWeight: 600, color: "#fff", border: "none", cursor: "pointer", flex: 1, textAlign: "center" };
function pgBtn(active) { return { padding: "6px 14px", fontSize: 11, fontWeight: 500, cursor: active ? "pointer" : "default", background: "transparent", color: active ? T.textSec : T.textMuted, border: `1px solid ${T.border}`, opacity: active ? 1 : 0.5 }; }
function cBtn(color) { return { flex: 1, padding: "6px 0", fontSize: 10, fontWeight: 600, background: "transparent", border: `1px solid ${color}25`, color, cursor: "pointer" }; }
