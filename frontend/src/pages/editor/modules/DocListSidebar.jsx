/**
 * DocListSidebar — 에디터 좌측 문서 탐색기 패널
 * - 문서 유형별 트리 구조로 표시 (노트는 지역→국가→카테고리 계층)
 * - 검색, 접기/펼치기, 새 문서 생성 버튼
 */
import { useState, useMemo } from "react";
import { DOC_TYPES, TYPE_NUMBERS, REGION_NUMBERS, COUNTRY_CODES, CAT_NUMBERS } from "./constants";

export function DocListSidebar({ documents, onSelect, currentId, onNew, search, setSearch, collapsed, setCollapsed }) {
  const [expandedFolders, setExpandedFolders] = useState({});
  const toggleFolder = (key) => setExpandedFolders(prev => ({ ...prev, [key]: !prev[key] }));

  const filtered = useMemo(() => {
    if (!search) return documents;
    return documents.filter(d => (d.title || "").toLowerCase().includes(search.toLowerCase()));
  }, [documents, search]);

  const tree = useMemo(() => {
    const typeLabels = {};
    DOC_TYPES.forEach(t => { typeLabels[t.value] = t.label; });
    const folders = [];
    const byType = {};
    for (const d of filtered) {
      const type = d.documentType || "note";
      if (!byType[type]) byType[type] = [];
      byType[type].push(d);
    }
    const typeOrder = ["note", "news", "statute", "case_law", "paper", "textbook", "book"];
    for (const type of typeOrder) {
      const docs = byType[type];
      if (!docs || docs.length === 0) continue;
      const typeNum = TYPE_NUMBERS[type] || "900";
      const typeLabel = typeLabels[type] || type;

      if (type === "note") {
        const byRegion = {};
        for (const d of docs) {
          let meta = null;
          try { meta = d.metadata ? JSON.parse(d.metadata) : null; } catch {}
          const region = meta?.region || "기타";
          const country = meta?.country || "미분류";
          const category = meta?.category || "";
          if (!byRegion[region]) byRegion[region] = {};
          if (!byRegion[region][country]) byRegion[region][country] = [];
          byRegion[region][country].push({ ...d, _cat: category, _year: meta?.year });
        }
        const regionFolders = Object.entries(byRegion).sort(([a], [b]) => {
          return (REGION_NUMBERS[a] || "99").localeCompare(REGION_NUMBERS[b] || "99");
        }).map(([region, countries]) => {
          const regionNum = REGION_NUMBERS[region] || "99";
          const countryFolders = Object.entries(countries).sort(([a], [b]) => {
            return (COUNTRY_CODES[a] || "999").localeCompare(COUNTRY_CODES[b] || "999");
          }).map(([country, countryDocs]) => {
            const countryCode = COUNTRY_CODES[country] || "000";
            const sorted = [...countryDocs].sort((a, b) => (a._year || 0) - (b._year || 0));
            const numbered = sorted.map((d, i) => {
              const catNum = CAT_NUMBERS[d._cat] || "00";
              const docNum = `${typeNum}.${regionNum}.${countryCode}.${catNum}.${String(i + 1).padStart(3, "0")}`;
              return { ...d, _num: docNum };
            });
            return { label: `${countryCode}_${country}`, docs: numbered, count: numbered.length };
          });
          return { label: `${regionNum}_${region}`, children: countryFolders, count: Object.values(countries).flat().length };
        });
        folders.push({ key: type, label: `${typeNum}_${typeLabel}`, children: regionFolders, count: docs.length });
      } else {
        const sorted = [...docs].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        const numbered = sorted.map((d, i) => ({ ...d, _num: `${typeNum}.${String(i + 1).padStart(3, "0")}` }));
        folders.push({ key: type, label: `${typeNum}_${typeLabel}`, docs: numbered, count: docs.length });
      }
    }
    return folders;
  }, [filtered]);

  const renderDoc = (d) => (
    <div key={d.id} onClick={(e) => { e.stopPropagation(); onSelect(d.id); }}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "3px 8px 3px 14px", cursor: "pointer",
        background: d.id === currentId ? "rgba(59,130,246,0.08)" : "transparent",
      }}
      onMouseEnter={e => { if (d.id !== currentId) e.currentTarget.style.background = "rgba(0,0,0,0.03)"; }}
      onMouseLeave={e => { if (d.id !== currentId) e.currentTarget.style.background = d.id === currentId ? "rgba(59,130,246,0.08)" : "transparent"; }}
    >
      <span style={{ fontSize: 11, opacity: 0.4, flexShrink: 0 }}>▪</span>
      <span style={{
        flex: 1, fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        color: d.id === currentId ? "#1e293b" : "#4b5563",
        fontWeight: d.id === currentId ? 500 : 400,
      }}>
        {(d.title || "(제목 없음)").replace("[세계사] ", "")}
      </span>
    </div>
  );

  const renderFolder = (label, key, count, depth, children) => {
    const isOpen = expandedFolders[key] !== undefined ? expandedFolders[key] : depth < 1;
    return (
      <div key={key}>
        <div onClick={() => toggleFolder(key)}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: `3px 8px 3px ${8 + depth * 14}px`,
            cursor: "pointer", userSelect: "none",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(0,0,0,0.04)"}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
        >
          <span style={{ fontSize: 9, color: "#9ca3af", width: 10, flexShrink: 0, transition: "transform 0.12s", transform: isOpen ? "rotate(90deg)" : "rotate(0)" }}>▶</span>
          <span style={{ flex: 1, fontSize: 12, color: "#374151", fontWeight: depth === 0 ? 500 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
        </div>
        {isOpen && <div>{children}</div>}
      </div>
    );
  };

  if (collapsed) {
    return (
      <div style={{ width: 36, flexShrink: 0, background: "#eae6e1", borderRight: "1px solid #d5d0ca", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 10 }}>
        <button onClick={() => setCollapsed(false)} title="탐색기 열기"
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "#888", padding: 4 }}>▶</button>
      </div>
    );
  }

  return (
    <div style={{ width: 270, flexShrink: 0, background: "#eae6e1", borderRight: "1px solid #d5d0ca", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "6px 8px", borderBottom: "1px solid #d5d0ca", flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
        <button onClick={onNew} title="새 파일" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#666", padding: "0 2px" }}>✏</button>
        <button title="새 폴더" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#666", padding: "0 2px" }}>📁</button>
        <button title="정렬" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#666", padding: "0 2px" }}>⇕</button>
        <button onClick={() => setCollapsed(true)} title="접기" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#666", padding: "0 2px" }}>◀</button>
      </div>
      <div style={{ padding: "4px 8px 6px", borderBottom: "1px solid #d5d0ca", flexShrink: 0 }}>
        <input type="text" placeholder="검색..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: "100%", padding: "4px 6px", fontSize: 11, border: "1px solid #c5c0ba", borderRadius: 3, outline: "none", background: "#f5f2ee", color: "#333", boxSizing: "border-box" }} />
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "2px 0" }}>
        {filtered.length === 0 && <p style={{ color: "#999", fontSize: 11, padding: "12px 10px" }}>문서가 없습니다.</p>}
        {tree.map(group => (
          renderFolder(group.label, group.key, group.count, 0,
            <>
              {group.children && group.children.map(region =>
                renderFolder(region.label, `${group.key}_${region.label}`, region.count, 1,
                  <>
                    {region.children && region.children.map(country =>
                      renderFolder(country.label, `${group.key}_${region.label}_${country.label}`, country.count, 2,
                        <>{country.docs.map(renderDoc)}</>
                      )
                    )}
                  </>
                )
              )}
              {group.docs && group.docs.map(renderDoc)}
            </>
          )
        ))}
      </div>
      <div style={{ padding: "5px 10px", borderTop: "1px solid #d5d0ca", fontSize: 10, color: "#999", flexShrink: 0 }}>
        {filtered.length}개 문서
      </div>
    </div>
  );
}
