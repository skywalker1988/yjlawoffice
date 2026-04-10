/**
 * 사이트맵 XML 생성 라우트 — SEO용 동적 사이트맵
 * - 정적 페이지 + 블로그 글 + 성공 사례
 */
const { Router } = require("express");
const { db } = require("../db");
const { blogPosts, caseResults, lawyers } = require("../db/schema");
const { eq } = require("drizzle-orm");

const router = Router();

/** 사이트 기본 URL (환경변수 또는 기본값) */
const SITE_URL = process.env.SITE_URL || "https://yjlaw.co.kr";

/** 정적 페이지 목록 (path, 변경 빈도, 우선순위) */
const STATIC_PAGES = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/practice", changefreq: "monthly", priority: "0.8" },
  { path: "/lawyers", changefreq: "monthly", priority: "0.7" },
  { path: "/consultation", changefreq: "monthly", priority: "0.9" },
  { path: "/blog", changefreq: "weekly", priority: "0.7" },
  { path: "/cases", changefreq: "monthly", priority: "0.7" },
  { path: "/reviews", changefreq: "monthly", priority: "0.6" },
];

/**
 * GET /api/sb/sitemap — XML 사이트맵 생성
 */
router.get("/", async (req, res) => {
  try {
    // 공개된 블로그 글 조회
    const posts = await db
      .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt })
      .from(blogPosts)
      .where(eq(blogPosts.isPublished, 1));

    // 공개된 성공 사례 조회
    const cases = await db
      .select({ id: caseResults.id, updatedAt: caseResults.updatedAt })
      .from(caseResults)
      .where(eq(caseResults.isPublished, 1));

    const today = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    // 정적 페이지
    for (const page of STATIC_PAGES) {
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}${page.path}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // 블로그 글
    for (const post of posts) {
      const lastmod = post.updatedAt ? post.updatedAt.split("T")[0] : today;
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}/blog/${post.slug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    }

    // 성공 사례
    for (const c of cases) {
      const lastmod = c.updatedAt ? c.updatedAt.split("T")[0] : today;
      xml += `  <url>\n`;
      xml += `    <loc>${SITE_URL}/cases/${c.id}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    }

    xml += `</urlset>`;

    res.set("Content-Type", "application/xml");
    res.send(xml);
  } catch (e) {
    console.error(e);
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

module.exports = router;
