/** 미디어 관리 — 파일 카드 그리드 */
import { COLORS } from "../../../components/admin/styles";
import { formatDate } from "../../../utils/formatters";

const IMAGE_EXTS = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "ico"];

/** 파일 확장자로 아이콘 문자 반환 */
function fileIcon(filename) {
  const ext = (filename || "").split(".").pop().toLowerCase();
  if (IMAGE_EXTS.includes(ext)) return "\u{1F5BC}";
  if (["mp4", "webm", "mov", "avi"].includes(ext)) return "\u{1F3AC}";
  if (["pdf"].includes(ext)) return "\u{1F4C4}";
  if (["doc", "docx"].includes(ext)) return "\u{1F4DD}";
  if (["xls", "xlsx"].includes(ext)) return "\u{1F4CA}";
  if (["ppt", "pptx"].includes(ext)) return "\u{1F4CE}";
  return "\u{1F4C1}";
}

/** 파일 크기 포맷 */
function formatSize(bytes) {
  if (!bytes) return "-";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/** 이미지 파일 여부 */
function isImage(filename) {
  const ext = (filename || "").split(".").pop().toLowerCase();
  return IMAGE_EXTS.includes(ext);
}

/* 다른 모듈에서도 사용 가능하도록 내보내기 */
export { fileIcon, formatSize, isImage, IMAGE_EXTS };

/** 개별 미디어 파일 카드 */
function MediaCard({ file, onClick }) {
  return (
    <div
      onClick={() => onClick(file)}
      style={{
        background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8,
        overflow: "hidden", cursor: "pointer", transition: "box-shadow 0.2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 4px 16px ${COLORS.accent}22`; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
    >
      {/* 썸네일 영역 */}
      <div style={{
        height: 120, display: "flex", alignItems: "center", justifyContent: "center",
        background: COLORS.bgInactive, overflow: "hidden",
      }}>
        {isImage(file.filename) && file.url ? (
          <img
            src={file.url}
            alt={file.alt || file.filename}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ fontSize: 40 }}>{fileIcon(file.filename)}</span>
        )}
      </div>
      {/* 파일 정보 */}
      <div style={{ padding: "10px 12px" }}>
        <p style={{
          margin: 0, fontSize: 13, fontWeight: 500, color: COLORS.text,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {file.filename}
        </p>
        <p style={{ margin: "4px 0 0", fontSize: 11, color: COLORS.textMuted }}>
          {formatSize(file.size)} · {formatDate(file.createdAt)}
        </p>
      </div>
    </div>
  );
}

/** 미디어 파일 그리드 */
export default function MediaGrid({ files, onSelect }) {
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
      gap: 16,
    }}>
      {files.map((file) => (
        <MediaCard key={file.id} file={file} onClick={onSelect} />
      ))}
    </div>
  );
}
