/**
 * VaultUploadModal — 마크다운 업로드 결과 모달
 * - 자동 분석 결과 (유형, 구조, 키워드, 문서 특성) 표시
 * - 문서 열기 / 닫기 액션
 */
import { useNavigate } from "react-router-dom";
import { getTypeLabel, getTypeColor } from "../../utils/document-types";

/**
 * @param {object} props
 * @param {object} props.uploadResult - 업로드 분석 결과 데이터
 * @param {function} props.onClose - 모달 닫기 핸들러
 */
export default function VaultUploadModal({ uploadResult, onClose }) {
  const navigate = useNavigate();

  if (!uploadResult) return null;

  const { document: doc, analysis } = uploadResult;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* 배경 오버레이 */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={onClose} />

      {/* 모달 본체 */}
      <div style={{ position: "relative", background: "#fff", borderRadius: 10, padding: 0, maxWidth: 520, width: "92%", boxShadow: "0 16px 48px rgba(0,0,0,0.25)", maxHeight: "80vh", overflow: "auto" }}>
        {/* 헤더 */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 15, fontWeight: 600 }}>문서 자동 분석 완료</h3>
          <button onClick={onClose} style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 18, color: "var(--text-muted)" }}>✕</button>
        </div>

        <div style={{ padding: 20 }}>
          {/* 문서 정보 */}
          <div style={{ marginBottom: 16 }}>
            <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>{doc?.title}</h4>
            {doc?.subtitle && <p style={{ fontSize: 12, color: "#888" }}>{doc.subtitle}</p>}
          </div>

          {/* 분석 요약 (유형 + 구조) */}
          <AnalysisSummaryGrid analysis={analysis} />

          {/* 키워드 */}
          {analysis?.keywords?.length > 0 && (
            <KeywordList keywords={analysis.keywords} />
          )}

          {/* 문서 특성 */}
          <StructureFeatures analysis={analysis} />

          {/* 액션 버튼 */}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={onClose}
              style={{ padding: "8px 16px", border: "1px solid var(--gray-100)", borderRadius: 6, background: "#fff", fontSize: 12, cursor: "pointer" }}>닫기</button>
            <button onClick={() => { onClose(); navigate(`/vault/${doc?.id}`); }}
              style={{ padding: "8px 16px", border: "none", borderRadius: 6, background: "var(--accent-gold)", color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 500 }}>문서 열기</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 분석 요약 그리드 (유형 + 단어/페이지 수) */
function AnalysisSummaryGrid({ analysis }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
      <div style={{ padding: 10, background: "#f8f9fb", borderRadius: 6 }}>
        <p style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>문서 유형</p>
        <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: getTypeColor(analysis?.documentType), color: "#fff" }}>
          {getTypeLabel(analysis?.documentType)}
        </span>
      </div>
      <div style={{ padding: 10, background: "#f8f9fb", borderRadius: 6 }}>
        <p style={{ fontSize: 10, color: "#888", marginBottom: 2 }}>구조</p>
        <p style={{ fontSize: 11, color: "#333" }}>
          {analysis?.structure?.wordCount?.toLocaleString()}단어,{" "}
          {analysis?.structure?.estimatedPages}페이지
        </p>
      </div>
    </div>
  );
}

/** 키워드 목록 */
function KeywordList({ keywords }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 10, color: "#888", marginBottom: 6 }}>추출된 키워드</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {keywords.map((kw, i) => (
          <span key={i} style={{ padding: "2px 8px", borderRadius: 12, fontSize: 10, background: "#e8ecf0", color: "#444" }}>{kw}</span>
        ))}
      </div>
    </div>
  );
}

/** 문서 구조 특성 태그 */
function StructureFeatures({ analysis }) {
  const featureStyle = { fontSize: 10, padding: "2px 6px", border: "1px solid var(--gray-100)", borderRadius: 3, color: "var(--gray-500)" };
  const structure = analysis?.structure;

  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 10, color: "#888", marginBottom: 6 }}>문서 특성</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {structure?.hasCodeBlocks && <span style={featureStyle}>코드 블록</span>}
        {structure?.hasImages && <span style={featureStyle}>이미지</span>}
        {structure?.hasTables && <span style={featureStyle}>표</span>}
        {structure?.hasLinks && <span style={featureStyle}>링크</span>}
        {structure?.hasFrontmatter && <span style={featureStyle}>프론트매터</span>}
        <span style={featureStyle}>제목 {structure?.headingCount}개</span>
      </div>
    </div>
  );
}
