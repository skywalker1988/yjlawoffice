/**
 * 블로그/법률 칼럼 API 라우트 — 게시글 CRUD + 조회수 증가
 */
const { Router } = require("express");
const { db } = require("../db");
const { blogPosts } = require("../db/schema");
const { eq, desc, and, count, sql } = require("drizzle-orm");

const router = Router();

// UUID 형식 검증 헬퍼
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function validateId(id, res) {
  if (!id || !UUID_REGEX.test(id)) {
    res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    return false;
  }
  return true;
}

/**
 * 슬러그 생성 — 제목에서 URL-safe 문자열 생성
 * 한글은 그대로 유지하고 특수문자만 제거
 */
function generateSlug(title) {
  const base = title
    .toLowerCase()
    .replace(/[^\w가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = Date.now().toString(36);
  return `${base}-${suffix}`;
}

// GET /api/sb/blog — 공개 게시글 목록 (페이지네이션, 카테고리 필터)
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page ?? "1"));
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit ?? "12")));
    const offset = (page - 1) * limit;
    const category = req.query.category || null;
    const includeUnpublished = req.query.all === "true";

    const conditions = [];
    if (!includeUnpublished) {
      conditions.push(eq(blogPosts.isPublished, 1));
    }
    if (category) {
      conditions.push(eq(blogPosts.category, category));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ total: count() })
      .from(blogPosts)
      .where(where);

    const rows = await db
      .select()
      .from(blogPosts)
      .where(where)
      .orderBy(desc(blogPosts.publishedAt), desc(blogPosts.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      data: rows,
      error: null,
      meta: { total: totalResult.total, page, limit, totalPages: Math.ceil(totalResult.total / limit) },
    });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// GET /api/sb/blog/:slug — 슬러그로 게시글 조회 + 조회수 증가
router.get("/:slug", async (req, res) => {
  try {
    const { slug } = req.params;

    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, slug));

    if (!post) {
      return res.status(404).json({ data: null, error: "게시글을 찾을 수 없습니다", meta: null });
    }

    // 조회수 증가
    await db
      .update(blogPosts)
      .set({ viewCount: post.viewCount + 1 })
      .where(eq(blogPosts.id, post.id));

    res.json({ data: { ...post, viewCount: post.viewCount + 1 }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// POST /api/sb/blog — 게시글 생성
router.post("/", async (req, res) => {
  try {
    const { title, category, excerpt, content, author, thumbnailUrl, isPublished } = req.body;

    if (!title || !content) {
      return res.status(400).json({ data: null, error: "title과 content는 필수입니다", meta: null });
    }

    const slug = req.body.slug || generateSlug(title);
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);

    const [inserted] = await db
      .insert(blogPosts)
      .values({
        title,
        slug,
        category: category ?? "legal_column",
        excerpt: excerpt ?? null,
        content,
        author: author ?? null,
        thumbnailUrl: thumbnailUrl ?? null,
        isPublished: isPublished ? 1 : 0,
        publishedAt: isPublished ? now : null,
      })
      .returning();

    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    // slug 중복 에러 처리
    if (e.message?.includes("UNIQUE constraint")) {
      return res.status(409).json({ data: null, error: "이미 존재하는 슬러그입니다", meta: null });
    }
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// PATCH /api/sb/blog/:id — 게시글 수정
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateId(id, res)) return;

    const [existing] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "게시글을 찾을 수 없습니다", meta: null });
    }

    const updateData = {};
    const allowedFields = ["title", "slug", "category", "excerpt", "content", "author", "thumbnailUrl", "isPublished"];
    for (const key of allowedFields) {
      if (key in req.body) updateData[key] = req.body[key];
    }

    // 발행 상태 변경 시 publishedAt 설정
    if ("isPublished" in req.body) {
      updateData.isPublished = req.body.isPublished ? 1 : 0;
      if (req.body.isPublished && !existing.publishedAt) {
        updateData.publishedAt = new Date().toISOString().replace("T", " ").slice(0, 19);
      }
    }

    updateData.updatedAt = new Date().toISOString().replace("T", " ").slice(0, 19);

    const [updated] = await db
      .update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, id))
      .returning();

    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// DELETE /api/sb/blog/:id — 게시글 삭제
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateId(id, res)) return;

    const [existing] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "게시글을 찾을 수 없습니다", meta: null });
    }

    await db.delete(blogPosts).where(eq(blogPosts.id, id));
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

module.exports = router;
