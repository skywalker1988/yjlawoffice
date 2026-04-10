/**
 * VaultDocumentList — 문서 목록 렌더링 (리스트/카드 뷰)
 * - 리스트 뷰: 한 줄에 유형, 제목, 중요도, 상태, 날짜 표시
 * - 카드 뷰: 그리드 형태로 문서 카드 표시
 */
import { Link } from "react-router-dom";
import { Badge } from "../../components/ui/Badge";
import { Stars } from "../../components/Stars";
import { getTypeLabel, getTypeColor } from "../../utils/document-types";
import { STATUS_LABELS } from "../../utils/constants";
import { parseAuthor } from "../../utils/format";

/**
 * @param {object} props
 * @param {Array} props.documents - 문서 배열
 * @param {string} props.viewMode - "list" | "card"
 */
export default function VaultDocumentList({ documents, viewMode }) {
  if (documents.length === 0) {
    return (
      <p style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>
        문서가 없습니다.
      </p>
    );
  }

  if (viewMode === "card") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
        {documents.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} />
        ))}
      </div>
    );
  }

  return (
    <div className="stagger">
      {documents.map((doc) => (
        <DocumentListItem key={doc.id} doc={doc} />
      ))}
    </div>
  );
}

/** 리스트 뷰 한 줄 아이템 */
function DocumentListItem({ doc }) {
  return (
    <Link
      to={`/vault/${doc.id}`}
      className="reveal block group transition-colors duration-200 hover:bg-[var(--bg-secondary)]"
      style={{
        padding: "18px 20px",
        margin: "0 -20px",
        borderBottom: "1px solid rgba(0,0,0,0.06)",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <Badge
          style={{
            backgroundColor: getTypeColor(doc.documentType),
            color: "#fff",
            fontSize: 10,
          }}
        >
          {getTypeLabel(doc.documentType)}
        </Badge>
        <span
          className="group-hover:text-[var(--accent-gold)] transition-colors"
          style={{
            fontSize: 15,
            fontWeight: 500,
            flex: 1,
            color: "var(--text-primary)",
          }}
        >
          {doc.title}
        </span>
        {doc.importance && <Stars rating={doc.importance} />}
        <span style={{ fontSize: 12, color: "#aaa" }}>
          {STATUS_LABELS[doc.status] || doc.status}
        </span>
        <span
          className="font-en"
          style={{ fontSize: 11, color: "#ccc" }}
        >
          {doc.createdAt
            ? new Date(doc.createdAt).toLocaleDateString("ko-KR")
            : ""}
        </span>
      </div>
      {doc.author && (
        <div className="flex gap-2 mt-1 items-center flex-wrap">
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {parseAuthor(doc.author)}
          </span>
        </div>
      )}
    </Link>
  );
}

/** 카드 뷰 아이템 */
function DocumentCard({ doc }) {
  return (
    <Link
      to={`/vault/${doc.id}`}
      className="reveal block group transition-all duration-300 hover:shadow-md"
      style={{
        background: "#fff",
        border: "1px solid rgba(0,0,0,0.06)",
        padding: 24,
        textDecoration: "none",
        color: "inherit",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Badge
          style={{
            backgroundColor: getTypeColor(doc.documentType),
            color: "#fff",
          }}
        >
          {getTypeLabel(doc.documentType)}
        </Badge>
        <span style={{ fontSize: 11, color: "#aaa", marginLeft: "auto" }}>
          {STATUS_LABELS[doc.status] || doc.status}
        </span>
      </div>
      <h3
        className="group-hover:text-[var(--accent-gold)] transition-colors"
        style={{
          fontSize: 15,
          fontWeight: 500,
          color: "var(--text-primary)",
          marginBottom: 8,
          lineHeight: 1.5,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {doc.title}
      </h3>
      {doc.author && (
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>
          {parseAuthor(doc.author)}
        </p>
      )}
      <div className="flex items-center justify-between mt-auto">
        {doc.importance && <Stars rating={doc.importance} />}
        <span
          className="font-en"
          style={{ fontSize: 11, color: "#ccc" }}
        >
          {doc.createdAt
            ? new Date(doc.createdAt).toLocaleDateString("ko-KR")
            : ""}
        </span>
      </div>
    </Link>
  );
}
