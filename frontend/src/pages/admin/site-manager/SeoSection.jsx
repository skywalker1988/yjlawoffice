/** SEO 설정 편집 탭 — 페이지별 메타태그/OG/검색 미리보기 */
import { useState, useEffect, useCallback } from "react";
import { api } from "../../../utils/api";
import { TOAST_DURATION_MS } from "../../../utils/timing";
import { FormField } from "../../../components/admin";
import { COLORS, btnStyle } from "../../../components/admin/styles";
import { SectionCard } from "./shared";
import { SEO_PAGES } from "./constants";
import { showToast } from "../../../utils/showToast";

const SITE_URL = "https://yjlaw.co.kr";

export default function SeoSection({ toast, setToast }) {
  const [seoPage, setSeoPage] = useState("home");
  const [seoData, setSeoData] = useState({});
  const [seoSaving, setSeoSaving] = useState(false);

  const loadSeoPage = useCallback((pageKey) => {
    api.get(`/site-settings?key=seo/${pageKey}`).then((json) => {
      const rows = json.data ?? [];
      const row = rows.find((r) => r.key === `seo/${pageKey}`);
      if (row) {
        try {
          const parsed = typeof row.value === "string" ? JSON.parse(row.value) : row.value;
          setSeoData((prev) => ({ ...prev, [pageKey]: parsed }));
        } catch {
          setSeoData((prev) => ({ ...prev, [pageKey]: {} }));
        }
      } else {
        setSeoData((prev) => ({ ...prev, [pageKey]: prev[pageKey] || {} }));
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadSeoPage(seoPage);
  }, [seoPage, loadSeoPage]);

  const saveSeoPage = async (pageKey) => {
    setSeoSaving(true);
    try {
      await api.post("/site-settings/bulk", {
        settings: { [`seo/${pageKey}`]: seoData[pageKey] || {} },
      });
      setToast("SEO 설정이 저장되었습니다");
      setTimeout(() => setToast(""), TOAST_DURATION_MS);
    } catch (err) {
      showToast("SEO 저장 실패: " + err.message);
    } finally {
      setSeoSaving(false);
    }
  };

  const updateSeo = (field, value) => {
    setSeoData((prev) => ({
      ...prev,
      [seoPage]: { ...(prev[seoPage] || {}), [field]: value },
    }));
  };

  const data = seoData[seoPage] || {};
  const pageInfo = SEO_PAGES.find((p) => p.key === seoPage);
  const descLen = (data.metaDescription || "").length;

  return (
    <>
      {/* 페이지 서브탭 */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap" }}>
        {SEO_PAGES.map((p) => (
          <button
            key={p.key}
            onClick={() => setSeoPage(p.key)}
            style={{
              padding: "6px 14px", fontSize: 12, fontWeight: seoPage === p.key ? 600 : 400,
              color: seoPage === p.key ? "#fff" : COLORS.textSecondary,
              background: seoPage === p.key ? COLORS.accent : "rgba(176,141,87,0.08)",
              border: "none", borderRadius: 4, cursor: "pointer",
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <SectionCard title={`SEO 설정 — ${pageInfo?.label || seoPage}`}>
        <FormField
          label="메타 타이틀"
          value={data.metaTitle || ""}
          onChange={(v) => updateSeo("metaTitle", v)}
          placeholder="페이지 제목 (60자 이내 권장)"
        />
        <div style={{ marginTop: 12 }}>
          <FormField
            label="메타 설명"
            type="textarea"
            minHeight={72}
            value={data.metaDescription || ""}
            onChange={(v) => updateSeo("metaDescription", v)}
            placeholder="페이지 설명 (160자 이내 권장)"
          />
          <div style={{
            fontSize: 11, marginTop: 4, textAlign: "right",
            color: descLen > 160 ? COLORS.danger : COLORS.textMuted,
          }}>
            {descLen}/160
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <FormField
            label="키워드"
            value={data.keywords || ""}
            onChange={(v) => updateSeo("keywords", v)}
            placeholder="쉼표로 구분 (예: 법률사무소, 변호사, 상담)"
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <FormField
            label="OG 이미지 URL"
            value={data.ogImage || ""}
            onChange={(v) => updateSeo("ogImage", v)}
            placeholder="https://example.com/og-image.jpg"
          />
        </div>
      </SectionCard>

      {/* Google 검색 미리보기 */}
      <SectionCard title="Google 검색 미리보기">
        <div style={{
          background: "#fff", border: `1px solid ${COLORS.border}`, borderRadius: 8,
          padding: 20, maxWidth: 600,
        }}>
          <div style={{
            fontSize: 18, color: "#1a0dab", fontWeight: 400,
            marginBottom: 4, cursor: "pointer",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {data.metaTitle || `${pageInfo?.label || ""} | 윤정 법률사무소`}
          </div>
          <div style={{ fontSize: 13, color: "#006621", marginBottom: 4 }}>
            {SITE_URL}{pageInfo?.url || "/"}
          </div>
          <div style={{
            fontSize: 13, color: "#545454", lineHeight: 1.5,
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {data.metaDescription || "메타 설명을 입력하면 여기에 표시됩니다."}
          </div>
        </div>
      </SectionCard>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button onClick={() => saveSeoPage(seoPage)} disabled={seoSaving} style={btnStyle(COLORS.accent)}>
          {seoSaving ? "저장 중..." : "SEO 저장"}
        </button>
      </div>
    </>
  );
}
