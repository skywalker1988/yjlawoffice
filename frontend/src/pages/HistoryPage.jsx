/**
 * HistoryPage — 세계사 연표 + Leaflet 지도 페이지
 * - 시대별/카테고리별 필터링, 지도 위 이벤트 시각화, 타임라인 뷰
 */
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, ScaleControl, LayersControl, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { Input } from "../components/ui/Input";
import { Stars } from "../components/Stars";
import useReveal from "../hooks/useReveal";
import { api } from "../utils/api";
import { CATEGORY_CONFIG, ALL_CATEGORIES, REGION_COORDS } from "../utils/constants";

// Fix leaflet icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

function formatEventDate(ev) {
  let s = ev.year < 0 ? "BC " + Math.abs(ev.year) : String(ev.year);
  if (ev.month) s += `.${String(ev.month).padStart(2, "0")}`;
  if (ev.day) s += `.${String(ev.day).padStart(2, "0")}`;
  if (ev.endYear) s += ` ~ ${ev.endYear}`;
  return s;
}


// ====== Map Controls ======

function FullscreenControl() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const btn = L.DomUtil.create("div", "leaflet-bar leaflet-control");
    btn.innerHTML = `<a href="#" title="전체화면" style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;font-size:18px;text-decoration:none;color:#333;background:#fff;">⛶</a>`;
    btn.style.cursor = "pointer";
    const toggle = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (!document.fullscreenElement) container.requestFullscreen?.();
      else document.exitFullscreen?.();
    };
    btn.addEventListener("click", toggle);
    const ctrl = L.Control.extend({ onAdd: () => btn });
    const instance = new ctrl({ position: "topright" });
    instance.addTo(map);
    return () => { instance.remove(); };
  }, [map]);
  return null;
}

function LocateControl() {
  const map = useMap();
  useEffect(() => {
    const btn = L.DomUtil.create("div", "leaflet-bar leaflet-control");
    btn.innerHTML = `<a href="#" title="내 위치" style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;font-size:16px;text-decoration:none;color:#333;background:#fff;">◎</a>`;
    btn.style.cursor = "pointer";
    const locate = (e) => {
      e.preventDefault(); e.stopPropagation();
      map.locate({ setView: true, maxZoom: 12 });
    };
    btn.addEventListener("click", locate);
    const ctrl = L.Control.extend({ onAdd: () => btn });
    const instance = new ctrl({ position: "topright" });
    instance.addTo(map);
    return () => { instance.remove(); };
  }, [map]);
  return null;
}

function FlyToEvent({ coords }) {
  const map = useMap();
  useEffect(() => { if (coords) map.flyTo(coords, 5, { duration: 0.8 }); }, [coords, map]);
  return null;
}

// ====== Main ======

export default function HistoryPage() {
  const navigate = useNavigate();
  const ref = useReveal();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const [category, setCategory] = useState("");
  const [region, setRegion] = useState("");
  const [yearFrom, setYearFrom] = useState("");
  const [yearTo, setYearTo] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef(null);

  const [belowView, setBelowView] = useState("timeline");
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [activeCategories, setActiveCategories] = useState(new Set(ALL_CATEGORIES));

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  useEffect(() => { api.get("/history/stats").then(j => setStats(j.data)).catch(() => {}); }, []);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams();
    p.set("limit", "200"); p.set("sort", "asc");
    if (category) p.set("category", category);
    if (region) p.set("region", region);
    if (yearFrom) p.set("year_from", yearFrom);
    if (yearTo) p.set("year_to", yearTo);
    if (debouncedSearch) p.set("q", debouncedSearch);
    api.get(`/history?${p}`)
      .then(j => setEvents(j.data ?? []))
      .catch(() => setEvents([])).finally(() => setLoading(false));
  }, [category, region, yearFrom, yearTo, debouncedSearch]);

  const toggleCategory = (cat) => setActiveCategories(prev => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n; });

  const filteredEvents = events.filter(e => activeCategories.has(e.category));

  const mapEvents = useMemo(() => filteredEvents.map(e => {
    const coords = (e.latitude != null && e.longitude != null) ? [e.latitude, e.longitude] : (REGION_COORDS[e.region] || null);
    return { ...e, coords };
  }).filter(e => e.coords), [filteredEvents]);

  const eras = useMemo(() => {
    const g = {};
    for (const ev of filteredEvents) {
      const era = ev.year < 0 ? "기원전" : ev.year < 500 ? "고대" : ev.year < 1500 ? "중세" : ev.year < 1800 ? "근세" : ev.year < 1900 ? "근대" : ev.year < 2000 ? "현대" : "21세기";
      (g[era] ??= []).push(ev);
    }
    return Object.entries(g);
  }, [filteredEvents]);

  const regions = useMemo(() => [...new Set(events.map(e => e.region).filter(Boolean))].sort(), [events]);

  return (
    <div ref={ref}>
      {/* Hero */}
      <section style={{ height: "40vh", minHeight: 320, background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", paddingTop: 94 }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(26,26,26,0.95), rgba(40,30,20,0.9))" }} />
        <div style={{ position: "relative", textAlign: "center", zIndex: 2, padding: "0 24px" }}>
          <div className="sep mx-auto" style={{ marginBottom: 24 }} />
          <h1 className="font-serif" style={{ fontSize: "clamp(1.8rem, 4vw, 3rem)", fontWeight: 300, letterSpacing: "0.25em", color: "#fff", marginBottom: 8 }}>WORLD HISTORY</h1>
          <p className="font-en" style={{ fontSize: 12, letterSpacing: "0.2em", color: "rgba(255,255,255,0.3)" }}>INTERACTIVE MAP & TIMELINE</p>
        </div>
      </section>

      <div style={{ height: 48, background: "linear-gradient(to bottom, #1a1a1a, #fff)" }} />

      <section style={{ padding: "24px 0 80px" }}>
        <div className="container">
          {/* Category chips */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 8, marginBottom: 20 }}>
            {ALL_CATEGORIES.map(cat => {
              const cfg = CATEGORY_CONFIG[cat]; const active = activeCategories.has(cat);
              return (
                <button key={cat} onClick={() => toggleCategory(cat)} style={{ display: "flex", alignItems: "center", gap: 6, borderRadius: 20, padding: "5px 12px", fontSize: 11, fontWeight: 500, cursor: "pointer", border: "none", backgroundColor: active ? cfg.color + "18" : "#f0f0f0", color: active ? cfg.color : "#999", opacity: active ? 1 : 0.5, transition: "all 0.2s" }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: cfg.color, display: "inline-block" }} />{cfg.label}
                </button>
              );
            })}
          </div>

          {/* Filter bar */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 10, background: "#fff", padding: 14, borderRadius: 10, border: "1px solid rgba(0,0,0,0.06)", marginBottom: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <label style={{ fontSize: 10, fontWeight: 500, color: "#999" }}>지역</label>
              <Select value={region} onChange={e => setRegion(e.target.value)} style={{ width: 130 }}>
                <option value="">전체</option>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </Select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <label style={{ fontSize: 10, fontWeight: 500, color: "#999" }}>연도</label>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Input type="number" placeholder="시작" value={yearFrom} onChange={e => setYearFrom(e.target.value)} style={{ width: 85 }} />
                <span style={{ color: "#ccc" }}>~</span>
                <Input type="number" placeholder="끝" value={yearTo} onChange={e => setYearTo(e.target.value)} style={{ width: 85 }} />
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1, minWidth: 160 }}>
              <label style={{ fontSize: 10, fontWeight: 500, color: "#999" }}>검색</label>
              <Input placeholder="사건명 검색..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          {loading && <div style={{ textAlign: "center", padding: "80px 0", color: "#999" }}><div className="spinner" style={{ margin: "0 auto 12px" }} /><span style={{ fontSize: 14 }}>불러오는 중...</span></div>}

          {!loading && filteredEvents.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px 0", color: "#bbb" }}>
              <p style={{ fontSize: 48, marginBottom: 12 }}>🌍</p>
              <p style={{ fontSize: 18, fontWeight: 500 }}>등록된 역사 이벤트가 없습니다</p>
            </div>
          )}

          {/* ==================== MAP (항상 표시) ==================== */}
          {!loading && filteredEvents.length > 0 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginBottom: 40 }} className="history-map-grid">
                <div style={{ height: 600, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
                  <MapContainer
                    center={[30, 20]}
                    zoom={2}
                    minZoom={2}
                    maxZoom={18}
                    zoomControl={false}
                    scrollWheelZoom={true}
                    doubleClickZoom={true}
                    touchZoom={true}
                    dragging={true}
                    worldCopyJump={true}
                    style={{ height: "100%", width: "100%", background: "#ddd" }}
                  >
                    {/* Zoom 왼쪽 상단 */}
                    <ZoomControl position="topleft" />

                    {/* 전체화면 + 내 위치 */}
                    <FullscreenControl />
                    <LocateControl />

                    {/* 축척 */}
                    <ScaleControl position="bottomleft" imperial={false} />

                    {/* 레이어 선택: 지도/위성/하이브리드/지형 (한국어 라벨) */}
                    <LayersControl position="topright">
                      <LayersControl.BaseLayer checked name="지도">
                        <TileLayer
                          url="https://mt1.google.com/vt/lyrs=m&hl=ko&x={x}&y={y}&z={z}"
                          attribution="&copy; Google Maps"
                          maxZoom={20}
                        />
                      </LayersControl.BaseLayer>
                      <LayersControl.BaseLayer name="위성">
                        <TileLayer
                          url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                          attribution="&copy; Google Maps"
                          maxZoom={20}
                        />
                      </LayersControl.BaseLayer>
                      <LayersControl.BaseLayer name="하이브리드">
                        <TileLayer
                          url="https://mt1.google.com/vt/lyrs=y&hl=ko&x={x}&y={y}&z={z}"
                          attribution="&copy; Google Maps"
                          maxZoom={20}
                        />
                      </LayersControl.BaseLayer>
                      <LayersControl.BaseLayer name="지형">
                        <TileLayer
                          url="https://mt1.google.com/vt/lyrs=p&hl=ko&x={x}&y={y}&z={z}"
                          attribution="&copy; Google Maps"
                          maxZoom={20}
                        />
                      </LayersControl.BaseLayer>
                    </LayersControl>

                    <FlyToEvent coords={flyTarget} />

                    {mapEvents.map(event => {
                      const cfg = CATEGORY_CONFIG[event.category] || { color: "#999", label: event.category };
                      const r = 7 + (event.importance - 1) * 3;
                      return (
                        <CircleMarker key={event.id} center={event.coords} radius={r}
                          pathOptions={{ color: "#fff", weight: 2, fillColor: cfg.color, fillOpacity: 0.85 }}
                          eventHandlers={{ click: () => setSelectedEvent(event) }}>
                          <Popup maxWidth={300} minWidth={220}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                                <span style={{ borderRadius: 10, padding: "2px 8px", fontSize: 10, fontWeight: 600, backgroundColor: cfg.color + "20", color: cfg.color }}>{cfg.label}</span>
                                <span style={{ fontSize: 11, color: "#999" }}>{formatEventDate(event)}</span>
                              </div>
                              <p style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.5, margin: "0 0 6px" }}>{event.title}</p>
                              {event.description && <p style={{ fontSize: 12, color: "#666", lineHeight: 1.7, margin: "0 0 8px" }}>{event.description}</p>}
                              <div style={{ fontSize: 11, color: "#aaa", display: "flex", gap: 8, flexWrap: "wrap" }}>
                                {event.region && <span>📍 {event.region}</span>}
                                {event.country && <span>🏳️ {event.country}</span>}
                                <span>{"★".repeat(event.importance)}{"☆".repeat(5 - event.importance)}</span>
                              </div>
                              {event.relatedDocumentId && (
                                <button onClick={() => navigate(`/vault/${event.relatedDocumentId}`)}
                                  style={{ fontSize: 11, color: "#b08d57", background: "none", border: "none", padding: 0, cursor: "pointer", marginTop: 8, fontWeight: 600 }}>
                                  📄 관련 문서 보기 →
                                </button>
                              )}
                            </div>
                          </Popup>
                        </CircleMarker>
                      );
                    })}
                  </MapContainer>
                </div>

                {/* Sidebar */}
                <div style={{ height: 600, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)", background: "#fff", display: "flex", flexDirection: "column" }}>
                  <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(0,0,0,0.06)", fontSize: 11, color: "#999", fontWeight: 600, letterSpacing: "0.05em", flexShrink: 0, display: "flex", justifyContent: "space-between" }}>
                    <span>📍 {mapEvents.length}개 이벤트</span>
                    <span>{stats ? `BC${Math.abs(stats.yearRange?.minYear || 0)} ~ ${stats.yearRange?.maxYear || ""}` : ""}</span>
                  </div>
                  <div style={{ flex: 1, overflowY: "auto" }}>
                    {filteredEvents.map(event => {
                      const cfg = CATEGORY_CONFIG[event.category] || { color: "#999" };
                      const isSel = selectedEvent?.id === event.id;
                      const coords = (event.latitude != null && event.longitude != null) ? [event.latitude, event.longitude] : (REGION_COORDS[event.region] || null);
                      return (
                        <div key={event.id} onClick={() => { setSelectedEvent(event); if (coords) setFlyTarget([...coords]); }}
                          style={{ padding: "9px 14px", borderBottom: "1px solid rgba(0,0,0,0.04)", cursor: "pointer", background: isSel ? "rgba(176,141,87,0.06)" : "transparent", borderLeft: isSel ? "3px solid #b08d57" : "3px solid transparent", transition: "all 0.12s" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: cfg.color, flexShrink: 0, display: "inline-block" }} />
                            <span style={{ fontSize: 10, color: "#aaa" }}>{formatEventDate(event)}</span>
                          </div>
                          <p style={{ fontSize: 12, fontWeight: 500, color: "#1a1a1a", lineHeight: 1.4, margin: 0 }}>{event.title}</p>
                          {event.region && <p style={{ fontSize: 10, color: "#bbb", margin: "2px 0 0" }}>{event.region}{event.country ? ` · ${event.country}` : ""}</p>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Below-map toggle */}
              <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 28 }}>
                <Button variant={belowView === "timeline" ? "default" : "outline"} size="sm" onClick={() => setBelowView("timeline")}>타임라인</Button>
                <Button variant={belowView === "list" ? "default" : "outline"} size="sm" onClick={() => setBelowView("list")}>목록</Button>
              </div>

              {/* TIMELINE */}
              {belowView === "timeline" && (
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "rgba(0,0,0,0.08)", transform: "translateX(-50%)" }} />
                  {eras.map(([eraName, eraEvents]) => (
                    <div key={eraName} style={{ marginBottom: 48 }}>
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
                        <span className="font-serif" style={{ background: "#fff", padding: "6px 20px", fontSize: "clamp(1rem, 2vw, 1.2rem)", fontWeight: 300, color: "#b08d57", letterSpacing: "0.1em", position: "relative", zIndex: 1 }}>{eraName}</span>
                      </div>
                      {eraEvents.map((event, i) => {
                        const cfg = CATEGORY_CONFIG[event.category] || { label: event.category, color: "#999" };
                        const isLeft = i % 2 === 0;
                        const coords = (event.latitude != null && event.longitude != null) ? [event.latitude, event.longitude] : (REGION_COORDS[event.region] || null);
                        return (
                          <div key={event.id} style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 16, flexDirection: isLeft ? "row" : "row-reverse", position: "relative" }}>
                            <div style={{ position: "absolute", left: "50%", width: 9 + (event.importance - 1) * 2.5, height: 9 + (event.importance - 1) * 2.5, borderRadius: "50%", background: cfg.color, border: "2px solid #fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transform: "translate(-50%, 8px)", zIndex: 2 }} />
                            <div style={{ width: "calc(50% - 24px)", marginLeft: isLeft ? 0 : "auto", marginRight: isLeft ? "auto" : 0 }}>
                              <Card className="cursor-pointer hover:shadow-md transition-shadow" style={{ padding: "14px 18px" }}
                                onClick={() => { setSelectedEvent(event); if (coords) setFlyTarget([...coords]); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 5 }}>
                                  <Badge style={{ backgroundColor: cfg.color + "18", color: cfg.color, border: "none", fontSize: 10 }}>{cfg.label}</Badge>
                                  <span style={{ fontSize: 10, color: "#999", whiteSpace: "nowrap" }}>{formatEventDate(event)}</span>
                                </div>
                                <h3 style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a", lineHeight: 1.5, margin: "0 0 4px" }}>{event.title}</h3>
                                {event.description && <p style={{ fontSize: 11, color: "#888", lineHeight: 1.7, margin: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{event.description}</p>}
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                                  <span style={{ fontSize: 10, color: "#bbb" }}>{event.region}{event.country ? ` · ${event.country}` : ""}</span>
                                  <Stars rating={event.importance} />
                                </div>
                              </Card>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {/* LIST */}
              {belowView === "list" && (
                <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)", background: "#fff" }}>
                  <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.08)", fontSize: 11, color: "#999", textAlign: "left" }}>
                        <th style={{ padding: "10px 14px" }}>연도</th><th style={{ padding: "10px 14px" }}>분류</th><th style={{ padding: "10px 14px" }}>사건</th><th style={{ padding: "10px 14px" }}>지역</th><th style={{ padding: "10px 14px" }}>중요도</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.map(event => {
                        const cfg = CATEGORY_CONFIG[event.category] || { label: event.category, color: "#999" };
                        const coords = (event.latitude != null && event.longitude != null) ? [event.latitude, event.longitude] : (REGION_COORDS[event.region] || null);
                        return (
                          <tr key={event.id} className="cursor-pointer hover:bg-gray-50 transition-colors" style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                            onClick={() => { setSelectedEvent(event); if (coords) setFlyTarget([...coords]); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                            <td style={{ padding: "8px 14px", color: "#666", whiteSpace: "nowrap", fontSize: 12 }}>{formatEventDate(event)}</td>
                            <td style={{ padding: "8px 14px" }}><Badge style={{ backgroundColor: cfg.color + "18", color: cfg.color, border: "none", fontSize: 10 }}>{cfg.label}</Badge></td>
                            <td style={{ padding: "8px 14px", fontWeight: 500, color: "#1a1a1a", maxWidth: 380 }}>
                              {event.title}
                              {event.description && <div style={{ fontSize: 11, color: "#999", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 380 }}>{event.description}</div>}
                            </td>
                            <td style={{ padding: "8px 14px", color: "#999", fontSize: 11, whiteSpace: "nowrap" }}>{event.region}{event.country ? ` · ${event.country}` : ""}</td>
                            <td style={{ padding: "8px 14px" }}><Stars rating={event.importance} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <p style={{ textAlign: "center", marginTop: 36, fontSize: 12, color: "#bbb" }}>총 {filteredEvents.length}개의 역사적 사건</p>
            </>
          )}
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          .history-map-grid { grid-template-columns: 1fr !important; }
          .history-map-grid > div:first-child { height: 420px !important; }
          .history-map-grid > div:last-child { height: 280px !important; }
        }
        .leaflet-popup-content-wrapper { border-radius: 10px !important; box-shadow: 0 4px 16px rgba(0,0,0,0.12) !important; }
        .leaflet-popup-content { margin: 12px 14px !important; font-family: var(--font-sans-kr) !important; }
        .leaflet-control-layers { border-radius: 8px !important; border: none !important; box-shadow: 0 2px 8px rgba(0,0,0,0.12) !important; }
        .leaflet-control-layers-toggle { width: 34px !important; height: 34px !important; }
        .leaflet-bar { border-radius: 8px !important; border: none !important; box-shadow: 0 2px 8px rgba(0,0,0,0.12) !important; overflow: hidden; }
        .leaflet-bar a { border-bottom: 1px solid rgba(0,0,0,0.08) !important; }
        .leaflet-bar a:last-child { border-bottom: none !important; }
      `}</style>
    </div>
  );
}
