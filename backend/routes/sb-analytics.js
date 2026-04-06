/**
 * 분석(Analytics) API 라우트 — 페이지뷰 통계, 상위 페이지, 리퍼러, 전환율, CSV 내보내기
 * - page_views 테이블 기반 집계 쿼리
 * - 기간 필터: 7d, 30d, 90d
 */
const { Router } = require("express");
const { sqlite } = require("../db");

const router = Router();

/** 기간 문자열을 SQLite date modifier로 변환 */
const PERIOD_MAP = {
  "7d": "-7 days",
  "30d": "-30 days",
  "90d": "-90 days",
};

/**
 * 기간 파라미터를 SQLite 날짜 modifier로 변환
 * @param {string} period - "7d" | "30d" | "90d"
 * @returns {string} SQLite date modifier (기본값: "-7 days")
 */
function getPeriodModifier(period) {
  return PERIOD_MAP[period] || PERIOD_MAP["7d"];
}

/**
 * GET /overview?period=7d — 전체 통계 개요
 * - totalViews: 총 페이지뷰
 * - uniqueVisitors: 고유 방문자 수 (session_id 기준)
 * - viewsPerDay: 일별 조회수 배열 [{date, count}]
 */
router.get("/overview", (req, res) => {
  try {
    const modifier = getPeriodModifier(req.query.period);

    const totals = sqlite.prepare(`
      SELECT
        COUNT(*) as totalViews,
        COUNT(DISTINCT session_id) as uniqueVisitors
      FROM page_views
      WHERE created_at >= datetime('now', ?)
    `).get(modifier);

    const viewsPerDay = sqlite.prepare(`
      SELECT
        date(created_at) as date,
        COUNT(*) as count
      FROM page_views
      WHERE created_at >= datetime('now', ?)
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all(modifier);

    res.json({
      data: {
        totalViews: totals.totalViews,
        uniqueVisitors: totals.uniqueVisitors,
        viewsPerDay,
      },
      error: null,
      meta: null,
    });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/**
 * GET /pages?period=7d&limit=10 — 상위 페이지별 조회수
 */
router.get("/pages", (req, res) => {
  try {
    const modifier = getPeriodModifier(req.query.period);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));

    const rows = sqlite.prepare(`
      SELECT
        page,
        path,
        COUNT(*) as views,
        COUNT(DISTINCT session_id) as uniqueViews
      FROM page_views
      WHERE created_at >= datetime('now', ?)
      GROUP BY page, path
      ORDER BY views DESC
      LIMIT ?
    `).all(modifier, limit);

    res.json({ data: rows, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/**
 * GET /referrers?period=7d&limit=10 — 상위 리퍼러 도메인
 */
router.get("/referrers", (req, res) => {
  try {
    const modifier = getPeriodModifier(req.query.period);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));

    const rows = sqlite.prepare(`
      SELECT
        referrer,
        COUNT(*) as count
      FROM page_views
      WHERE created_at >= datetime('now', ?)
        AND referrer IS NOT NULL
        AND referrer != ''
      GROUP BY referrer
      ORDER BY count DESC
      LIMIT ?
    `).all(modifier, limit);

    res.json({ data: rows, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/**
 * GET /consultations/conversion?period=30d — 페이지뷰 대비 상담 신청 전환율
 * - views: 기간 내 총 페이지뷰
 * - consultations: 기간 내 상담 신청 수
 * - conversionRate: 전환율 (%)
 */
router.get("/consultations/conversion", (req, res) => {
  try {
    const modifier = getPeriodModifier(req.query.period || "30d");

    const { totalViews } = sqlite.prepare(`
      SELECT COUNT(*) as totalViews
      FROM page_views
      WHERE created_at >= datetime('now', ?)
    `).get(modifier);

    const { totalConsultations } = sqlite.prepare(`
      SELECT COUNT(*) as totalConsultations
      FROM consultations
      WHERE created_at >= datetime('now', ?)
    `).get(modifier);

    const conversionRate = totalViews > 0
      ? Math.round((totalConsultations / totalViews) * 10000) / 100
      : 0;

    res.json({
      data: {
        views: totalViews,
        consultations: totalConsultations,
        conversionRate,
      },
      error: null,
      meta: null,
    });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/**
 * GET /export?period=30d — CSV 내보내기
 * - Content-Type: text/csv
 */
router.get("/export", (req, res) => {
  try {
    const modifier = getPeriodModifier(req.query.period || "30d");

    const rows = sqlite.prepare(`
      SELECT id, page, path, referrer, user_agent, ip, session_id, created_at
      FROM page_views
      WHERE created_at >= datetime('now', ?)
      ORDER BY created_at DESC
    `).all(modifier);

    // CSV 헤더
    const headers = ["id", "page", "path", "referrer", "user_agent", "ip", "session_id", "created_at"];
    const csvLines = [headers.join(",")];

    for (const row of rows) {
      const values = headers.map((h) => {
        const val = row[h] ?? "";
        // 쉼표나 따옴표 포함 시 이스케이프
        const str = String(val);
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      csvLines.push(values.join(","));
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=page-views.csv");
    res.send(csvLines.join("\n"));
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

module.exports = router;
