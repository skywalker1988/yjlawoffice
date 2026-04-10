/**
 * 블로그/법률 칼럼 API 라우트 — 게시글 CRUD + 조회수 증가
 * - 비즈니스 로직은 services/blog-service.js에 위임
 */
const { Router } = require("express");
const { adminAuth } = require("../lib/auth");
const blogService = require("../services/blog-service");

const router = Router();

/**
 * 조회수 중복 방지용 인메모리 캐시 (IP:slug → 만료시각)
 * 같은 IP에서 같은 글을 10분 내 재조회 시 조회수 증가하지 않음
 */
const VIEW_COOLDOWN_MS = 10 * 60 * 1000;
const viewCache = new Map();

// 만료된 캐시 엔트리 정리 (5분마다)
setInterval(() => {
  const now = Date.now();
  for (const [key, expiresAt] of viewCache) {
    if (now > expiresAt) viewCache.delete(key);
  }
}, 5 * 60 * 1000).unref();

// GET /api/sb/blog — 공개 게시글 목록 (페이지네이션, 카테고리 필터)
router.get("/", async (req, res) => {
  try {
    const result = await blogService.listPosts(req.query);
    res.json({ data: result.items, error: null, meta: result.meta });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ data: null, error: e.message || "서버 내부 오류가 발생했습니다", meta: null });
  }
});

// GET /api/sb/blog/:slug — 슬러그로 게시글 조회 + 조회수 증가 (IP 중복 방지)
router.get("/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const cacheKey = `${ip}:${slug}`;
    const skipIncrement = viewCache.has(cacheKey) && Date.now() < viewCache.get(cacheKey);

    const post = await blogService.getPost(slug, { skipIncrement });

    if (!skipIncrement) {
      viewCache.set(cacheKey, Date.now() + VIEW_COOLDOWN_MS);
    }

    res.json({ data: post, error: null, meta: null });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ data: null, error: e.message || "서버 내부 오류가 발생했습니다", meta: null });
  }
});

// POST /api/sb/blog — 게시글 생성
router.post("/", adminAuth, async (req, res) => {
  try {
    const inserted = await blogService.createPost(req.body);
    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ data: null, error: e.message || "서버 내부 오류가 발생했습니다", meta: null });
  }
});

// PATCH /api/sb/blog/:id — 게시글 수정
router.patch("/:id", adminAuth, async (req, res) => {
  try {
    const updated = await blogService.updatePost(req.params.id, req.body);
    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ data: null, error: e.message || "서버 내부 오류가 발생했습니다", meta: null });
  }
});

// DELETE /api/sb/blog/:id — 게시글 삭제
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const result = await blogService.deletePost(req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ data: null, error: e.message || "서버 내부 오류가 발생했습니다", meta: null });
  }
});

module.exports = router;
