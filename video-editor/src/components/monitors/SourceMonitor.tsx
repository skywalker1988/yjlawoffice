/**
 * SourceMonitor — 소스 모니터 (미디어 프리뷰 + In/Out 마킹)
 */
"use client";

import { useRef, useEffect } from "react";
import { useSourceMonitorStore } from "@/stores/sourceMonitorStore";
import { formatDuration } from "@/utils/mediaProbe";

export default function SourceMonitor() {
  const {
    mediaUrl, mediaType, mediaName, inPoint, outPoint,
    playing, currentTime, duration,
    setInPoint, setOutPoint, togglePlay, setPlaying,
    setCurrentTime, setDuration,
  } = useSourceMonitorStore();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onMeta = () => setDuration(v.duration);
    const onTime = () => setCurrentTime(v.currentTime);
    const onEnd = () => setPlaying(false);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnd);
    return () => {
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("timeupdate", onTime);
      v.removeEventListener("ended", onEnd);
    };
  }, [mediaUrl, setDuration, setCurrentTime, setPlaying]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) v.play();
    else v.pause();
  }, [playing]);

  const seek = (t: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = t;
      setCurrentTime(t);
    }
  };

  if (!mediaUrl) {
    return (
      <div style={{
        height: "100%", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "var(--bg-primary)", color: "var(--text-muted)",
      }}>
        <div style={{ fontSize: 11, opacity: 0.5 }}>Source Monitor</div>
        <div style={{ fontSize: 10, marginTop: 4, opacity: 0.3 }}>
          미디어를 더블클릭하여 프리뷰
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#0a0a0a" }}>
      {/* 프리뷰 영역 */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
        {mediaType === "video" ? (
          <video
            ref={videoRef}
            key={mediaUrl}
            src={mediaUrl}
            style={{ maxWidth: "100%", maxHeight: "100%" }}
            playsInline
          />
        ) : mediaType === "image" ? (
          <img src={mediaUrl} alt={mediaName ?? ""} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        ) : mediaType === "audio" ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
            <div style={{ fontSize: 40, opacity: 0.2, marginBottom: 8 }}>🎵</div>
            <div style={{ fontSize: 11 }}>{mediaName}</div>
            <audio ref={videoRef as any} key={mediaUrl} src={mediaUrl} />
          </div>
        ) : null}
      </div>

      {/* 미니 타임라인 (In/Out) */}
      {mediaType !== "image" && duration > 0 && (
        <div style={{
          height: 20, background: "var(--bg-tertiary)", margin: "0 8px",
          position: "relative", cursor: "pointer",
          border: "1px solid var(--border-primary)",
        }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            seek(pct * duration);
          }}
        >
          {/* In/Out 영역 */}
          {(inPoint !== null || outPoint !== null) && (
            <div style={{
              position: "absolute", top: 0, bottom: 0,
              left: `${((inPoint ?? 0) / duration) * 100}%`,
              width: `${(((outPoint ?? duration) - (inPoint ?? 0)) / duration) * 100}%`,
              background: "var(--accent-dim)",
              borderLeft: inPoint !== null ? "2px solid var(--accent)" : "none",
              borderRight: outPoint !== null ? "2px solid var(--accent)" : "none",
            }} />
          )}
          {/* 플레이헤드 */}
          <div style={{
            position: "absolute", top: 0, bottom: 0,
            left: `${(currentTime / duration) * 100}%`,
            width: 2, background: "var(--playhead)",
          }} />
        </div>
      )}

      {/* 전송 컨트롤 */}
      <div style={{
        height: 36, background: "var(--bg-tertiary)",
        borderTop: "1px solid var(--border-primary)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      }}>
        <button className="tool-btn" style={{ fontSize: 9, width: 24, height: 24 }}
          title="Set In Point (I)"
          onClick={() => setInPoint(currentTime)}
        >
          [
        </button>
        <button className="tool-btn" style={{ fontSize: 10, width: 24, height: 24 }}
          onClick={() => seek(Math.max(0, currentTime - 1 / 30))}
        >
          ◀
        </button>
        <button
          className="tool-btn"
          style={{
            width: 30, height: 30, fontSize: 14,
            background: "var(--accent)", borderRadius: "50%", color: "white",
          }}
          onClick={togglePlay}
        >
          {playing ? "⏸" : "▶"}
        </button>
        <button className="tool-btn" style={{ fontSize: 10, width: 24, height: 24 }}
          onClick={() => seek(Math.min(duration, currentTime + 1 / 30))}
        >
          ▶
        </button>
        <button className="tool-btn" style={{ fontSize: 9, width: 24, height: 24 }}
          title="Set Out Point (O)"
          onClick={() => setOutPoint(currentTime)}
        >
          ]
        </button>

        <div style={{ width: 1, height: 16, background: "var(--border-primary)", margin: "0 6px" }} />

        <span className="timecode" style={{ fontSize: 11 }}>
          {formatDuration(currentTime)}
        </span>
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>/</span>
        <span className="timecode" style={{ fontSize: 10, color: "var(--text-muted)" }}>
          {formatDuration(duration)}
        </span>

        {(inPoint !== null || outPoint !== null) && (
          <>
            <div style={{ width: 1, height: 16, background: "var(--border-primary)", margin: "0 4px" }} />
            <span style={{ fontSize: 9, color: "var(--accent)" }}>
              {inPoint !== null ? `I:${formatDuration(inPoint)}` : ""}
              {inPoint !== null && outPoint !== null ? " " : ""}
              {outPoint !== null ? `O:${formatDuration(outPoint)}` : ""}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
