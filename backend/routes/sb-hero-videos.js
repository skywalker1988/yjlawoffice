/**
 * 히어로 배경 영상 API 라우트 — CRUD + 활성화 관리
 */
const { Router } = require("express");
const { db, sqlite } = require("../db");
const { heroVideos } = require("../db/schema");
const { eq, desc, asc, count } = require("drizzle-orm");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const router = Router();

// 영상 업로드용 Multer 설정 (100MB 제한)
const UPLOAD_DIR = path.join(
  process.env.STORAGE_PATH || path.join(__dirname, "..", "data"),
  "uploads",
  "videos"
);
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || ".mp4";
      cb(null, `hero-${crypto.randomUUID()}${ext}`);
    },
  }),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".mp4", ".webm", ".mov"];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// GET / — 전체 목록
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    let rows;
    if (category) {
      rows = await db.select().from(heroVideos)
        .where(eq(heroVideos.category, category))
        .orderBy(asc(heroVideos.sortOrder), desc(heroVideos.createdAt));
    } else {
      rows = await db.select().from(heroVideos)
        .orderBy(asc(heroVideos.sortOrder), desc(heroVideos.createdAt));
    }
    res.json({ data: rows, error: null, meta: { total: rows.length } });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// GET /active — 현재 활성 영상 (공개 엔드포인트)
router.get("/active", async (req, res) => {
  try {
    const [video] = await db.select().from(heroVideos)
      .where(eq(heroVideos.isActive, 1))
      .limit(1);
    res.json({ data: video || null, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// GET /:id — 단건 조회
router.get("/:id", async (req, res) => {
  try {
    const [video] = await db.select().from(heroVideos)
      .where(eq(heroVideos.id, req.params.id));
    if (!video) {
      return res.status(404).json({ data: null, error: "Video not found", meta: null });
    }
    res.json({ data: video, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// POST / — 새 영상 등록 (URL 방식)
router.post("/", async (req, res) => {
  try {
    const { title, url, category } = req.body;
    if (!title || !url) {
      return res.status(400).json({ data: null, error: "title과 url은 필수입니다", meta: null });
    }
    const [inserted] = await db.insert(heroVideos).values({
      title,
      url,
      category: category || "manhattan",
    }).returning();
    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// POST /upload — 파일 업로드 방식
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ data: null, error: "영상 파일이 필요합니다", meta: null });
    }
    const { title, category } = req.body;
    const videoUrl = `/uploads/videos/${req.file.filename}`;
    const [inserted] = await db.insert(heroVideos).values({
      title: title || req.file.originalname,
      url: videoUrl,
      category: category || "manhattan",
    }).returning();
    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// PATCH /:id — 수정
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.select().from(heroVideos).where(eq(heroVideos.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "Video not found", meta: null });
    }
    const updateData = {};
    const allowedFields = ["title", "url", "category", "sortOrder"];
    for (const key of allowedFields) {
      if (key in req.body) updateData[key] = req.body[key];
    }
    updateData.updatedAt = new Date().toISOString().replace("T", " ").slice(0, 19);

    const [updated] = await db.update(heroVideos)
      .set(updateData)
      .where(eq(heroVideos.id, id))
      .returning();
    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// PATCH /:id/activate — 활성화 (다른 모든 영상 비활성화 후 이 영상만 활성화)
router.patch("/:id/activate", async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    // 트랜잭션으로 원자적 처리
    sqlite.transaction(() => {
      sqlite.prepare("UPDATE hero_videos SET is_active = 0, updated_at = ?").run(now);
      sqlite.prepare("UPDATE hero_videos SET is_active = 1, updated_at = ? WHERE id = ?").run(now, id);
    })();
    const [video] = await db.select().from(heroVideos).where(eq(heroVideos.id, id));
    res.json({ data: video, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// DELETE /:id — 삭제
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.select().from(heroVideos).where(eq(heroVideos.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "Video not found", meta: null });
    }
    // 로컬 업로드 파일인 경우 파일도 삭제
    if (existing.url.startsWith("/uploads/videos/")) {
      const filePath = path.join(UPLOAD_DIR, path.basename(existing.url));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await db.delete(heroVideos).where(eq(heroVideos.id, id));
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

module.exports = router;
