/**
 * MediaBrowserPanel — 미디어 브라우저 패널
 * 파일 드래그앤드롭 + 썸네일 그리드/리스트 뷰 + 메타데이터 표시
 */
"use client";

import { useState, useCallback, useRef } from "react";
import { useProjectStore } from "@/stores/projectStore";
import { useSourceMonitorStore } from "@/stores/sourceMonitorStore";
import { probeMedia, getMediaType, formatFileSize, formatDuration } from "@/utils/mediaProbe";
import type { MediaItem } from "@/types";

type ViewMode = "grid" | "list";

export default function MediaBrowserPanel() {
  const { project, addMediaItem, removeMediaItem } = useProjectStore();
  const media = project.mediaBin;
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const openMedia = useSourceMonitorStore((s) => s.openMedia);

  const handleDoubleClick = (item: MediaItem) => {
    openMedia(item.id, item.url, item.type, item.name);
  };

  const filtered = search
    ? media.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
    : media;

  /** 파일 가져오기 */
  const importFiles = useCallback(
    async (files: FileList | File[]) => {
      setImporting(true);
      const fileArr = Array.from(files);
      for (const file of fileArr) {
        const type = getMediaType(file.name);
        if (!type) continue;
        try {
          const meta = await probeMedia(file);
          const item: MediaItem = {
            id: `media-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            type: meta.type,
            file,
            url: URL.createObjectURL(file),
            duration: meta.duration,
            width: meta.width,
            height: meta.height,
            frameRate: meta.frameRate,
            thumbnailUrl: meta.thumbnailUrl,
            fileSize: file.size,
          };
          addMediaItem(item);
        } catch (e) {
          console.error(`Failed to import ${file.name}:`, e);
        }
      }
      setImporting(false);
    },
    [addMediaItem]
  );

  /** 드래그앤드롭 핸들러 */
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) importFiles(e.dataTransfer.files);
  };

  /** 미디어 유형 아이콘 */
  const typeIcon = (type: string) => {
    switch (type) {
      case "video": return "🎬";
      case "audio": return "🎵";
      case "image": return "🖼️";
      default: return "📄";
    }
  };

  return (
    <div
      style={{ height: "100%", display: "flex", flexDirection: "column" }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* 툴바 */}
      <div style={{
        display: "flex", alignItems: "center", gap: 4,
        padding: "4px 4px 6px", borderBottom: "1px solid var(--border-primary)",
      }}>
        <input
          className="input"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, fontSize: 10, padding: "3px 6px" }}
        />
        <button
          className={`tool-btn ${viewMode === "grid" ? "active" : ""}`}
          onClick={() => setViewMode("grid")}
          style={{ width: 22, height: 22, fontSize: 10 }}
          title="Grid View"
        >
          ▦
        </button>
        <button
          className={`tool-btn ${viewMode === "list" ? "active" : ""}`}
          onClick={() => setViewMode("list")}
          style={{ width: 22, height: 22, fontSize: 10 }}
          title="List View"
        >
          ☰
        </button>
        <button
          className="tool-btn"
          onClick={() => fileInputRef.current?.click()}
          style={{ width: 22, height: 22, fontSize: 12 }}
          title="Import Files"
        >
          +
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/*,audio/*,image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files) importFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {/* 미디어 목록 또는 드롭존 */}
      <div style={{ flex: 1, overflow: "auto", position: "relative" }}>
        {/* 드래그 오버레이 */}
        {dragging && (
          <div style={{
            position: "absolute", inset: 0, zIndex: 10,
            background: "rgba(0,122,204,0.12)",
            border: "2px dashed var(--accent)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--accent)", fontSize: 12, fontWeight: 600,
          }}>
            파일을 여기에 드롭하세요
          </div>
        )}

        {importing && (
          <div style={{
            padding: 12, textAlign: "center",
            color: "var(--accent)", fontSize: 11,
          }}>
            가져오는 중...
          </div>
        )}

        {filtered.length === 0 && !importing ? (
          <div style={{
            height: "100%", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            color: "var(--text-muted)", fontSize: 11, padding: 20,
          }}>
            <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.25 }}>📁</div>
            <div>미디어를 드래그하여 가져오기</div>
            <div style={{ fontSize: 10, marginTop: 4, opacity: 0.5 }}>
              또는 + 버튼으로 파일 선택
            </div>
            <div style={{ fontSize: 9, marginTop: 8, opacity: 0.3 }}>
              MP4, WebM, MOV, MP3, WAV, PNG, JPG, GIF
            </div>
          </div>
        ) : viewMode === "grid" ? (
          /* 그리드 뷰 */
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
            gap: 4, padding: 4,
          }}>
            {filtered.map((item) => (
              <div
                key={item.id}
                style={{
                  background: selectedId === item.id ? "var(--accent-dim)" : "var(--bg-tertiary)",
                  border: `1px solid ${selectedId === item.id ? "var(--accent)" : "var(--border-primary)"}`,
                  cursor: "pointer",
                  overflow: "hidden",
                }}
                onClick={() => setSelectedId(item.id)}
                onDoubleClick={() => handleDoubleClick(item)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/x-media-id", item.id);
                  e.dataTransfer.effectAllowed = "copy";
                }}
              >
                {/* 썸네일 */}
                <div style={{
                  width: "100%", aspectRatio: "16/9",
                  background: "#0a0a0a",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden",
                }}>
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <span style={{ fontSize: 20, opacity: 0.3 }}>{typeIcon(item.type)}</span>
                  )}
                </div>
                {/* 파일명 */}
                <div style={{
                  padding: "3px 4px",
                  fontSize: 9,
                  color: "var(--text-secondary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}>
                  {item.name}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 리스트 뷰 */
          <div>
            {filtered.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "4px 8px",
                  background: selectedId === item.id ? "var(--accent-dim)" : "transparent",
                  borderBottom: "1px solid var(--border-primary)",
                  cursor: "pointer", fontSize: 11,
                }}
                onClick={() => setSelectedId(item.id)}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/x-media-id", item.id);
                  e.dataTransfer.effectAllowed = "copy";
                }}
              >
                <span style={{ fontSize: 12 }}>{typeIcon(item.type)}</span>
                <span style={{ flex: 1, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.name}
                </span>
                {item.type !== "image" && (
                  <span className="timecode" style={{ fontSize: 9, color: "var(--text-muted)" }}>
                    {formatDuration(item.duration)}
                  </span>
                )}
                <span style={{ fontSize: 9, color: "var(--text-muted)", minWidth: 48, textAlign: "right" }}>
                  {formatFileSize(item.fileSize)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 하단 정보 바 */}
      <div style={{
        height: 22, flexShrink: 0,
        background: "var(--bg-tertiary)", borderTop: "1px solid var(--border-primary)",
        display: "flex", alignItems: "center", padding: "0 8px",
        fontSize: 9, color: "var(--text-muted)", gap: 12,
      }}>
        <span>{media.length} items</span>
        {selectedId && (() => {
          const item = media.find((m) => m.id === selectedId);
          if (!item) return null;
          return (
            <>
              <span>{item.name}</span>
              {item.width && item.height && <span>{item.width}×{item.height}</span>}
              {item.type !== "image" && <span>{formatDuration(item.duration)}</span>}
              <span>{formatFileSize(item.fileSize)}</span>
            </>
          );
        })()}
      </div>
    </div>
  );
}
