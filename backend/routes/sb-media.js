/**
 * 미디어 파일 관리 API 라우트
 * - 파일 업로드 (단일/다중), 목록 조회, 메타데이터 수정, 삭제
 * - 폴더별 분류 및 파일 타입 필터링 지원
 */
const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { db } = require("../db");
const { mediaFiles } = require("../db/schema");
const { eq, desc, and, like, count, sql } = require("drizzle-orm");

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

// 허용 파일 확장자
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|pdf|mp4|webm)$/i;

// 스토리지 경로 설정
const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, "..", "data");
const MEDIA_DIR = path.join(STORAGE_PATH, "uploads", "media");

// 미디어 디렉토리 생성
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });

// 폴더명 검증 — 경로 탐색 공격 방지
function sanitizeFolder(folder) {
  return (folder || "general")
    .replace(/[^a-zA-Z0-9가-힣_-]/g, "")
    .slice(0, 50) || "general";
}

// Multer 디스크 스토리지 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = sanitizeFolder(req.body.folder);
    const dir = path.join(MEDIA_DIR, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `media-${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED_EXTENSIONS.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("지원하지 않는 파일 형식입니다"));
    }
  },
});

// GET /api/sb/media/folders — 폴더 목록 (고유값)
router.get("/folders", async (req, res) => {
  try {
    const rows = await db
      .selectDistinct({ folder: mediaFiles.folder })
      .from(mediaFiles)
      .orderBy(mediaFiles.folder);

    const folders = rows.map((r) => r.folder);
    res.json({ data: folders, error: null, meta: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message, meta: null });
  }
});

// GET /api/sb/media — 파일 목록 (페이지네이션, 필터)
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? "20")));
    const offset = (page - 1) * limit;

    const folder = req.query.folder || null;
    const type = req.query.type || null;
    const search = req.query.search || null;

    const conditions = [];
    if (folder) conditions.push(eq(mediaFiles.folder, folder));
    if (type === "image") conditions.push(like(mediaFiles.mimeType, "image/%"));
    if (type === "video") conditions.push(like(mediaFiles.mimeType, "video/%"));
    if (type === "document") conditions.push(like(mediaFiles.mimeType, "application/%"));
    if (search) conditions.push(like(mediaFiles.originalName, `%${search}%`));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ total: count() })
      .from(mediaFiles)
      .where(where);

    const rows = await db
      .select()
      .from(mediaFiles)
      .where(where)
      .orderBy(desc(mediaFiles.createdAt))
      .limit(limit)
      .offset(offset);

    res.json({
      data: rows,
      error: null,
      meta: {
        page,
        limit,
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message, meta: null });
  }
});

// GET /api/sb/media/:id — 단일 파일 상세
router.get("/:id", async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return;

    const [row] = await db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.id, req.params.id));

    if (!row) {
      return res.status(404).json({ data: null, error: "파일을 찾을 수 없습니다", meta: null });
    }

    res.json({ data: row, error: null, meta: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message, meta: null });
  }
});

// POST /api/sb/media/upload — 단일 파일 업로드
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ data: null, error: "파일이 필요합니다", meta: null });
    }

    const folder = sanitizeFolder(req.body.folder);
    const url = `/uploads/media/${folder}/${req.file.filename}`;

    const [record] = await db
      .insert(mediaFiles)
      .values({
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url,
        alt: req.body.alt || null,
        folder,
        uploadedBy: req.body.uploadedBy || "admin",
      })
      .returning();

    res.status(201).json({ data: record, error: null, meta: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message, meta: null });
  }
});

// POST /api/sb/media/upload-multiple — 다중 파일 업로드 (최대 10개)
router.post("/upload-multiple", upload.array("files", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ data: null, error: "파일이 필요합니다", meta: null });
    }

    const folder = sanitizeFolder(req.body.folder);
    const records = [];

    for (const file of req.files) {
      const url = `/uploads/media/${folder}/${file.filename}`;

      const [record] = await db
        .insert(mediaFiles)
        .values({
          filename: file.filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url,
          alt: req.body.alt || null,
          folder,
          uploadedBy: req.body.uploadedBy || "admin",
        })
        .returning();

      records.push(record);
    }

    res.status(201).json({ data: records, error: null, meta: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message, meta: null });
  }
});

// PATCH /api/sb/media/:id — 메타데이터 수정 (alt, folder)
router.patch("/:id", async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return;

    const [existing] = await db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.id, req.params.id));

    if (!existing) {
      return res.status(404).json({ data: null, error: "파일을 찾을 수 없습니다", meta: null });
    }

    const updates = {};
    if (req.body.alt !== undefined) updates.alt = req.body.alt;

    // 폴더 변경 시 물리적 파일 이동
    if (req.body.folder && req.body.folder !== existing.folder) {
      const newFolder = sanitizeFolder(req.body.folder);
      const oldPath = path.join(MEDIA_DIR, existing.folder, existing.filename);
      const newDir = path.join(MEDIA_DIR, newFolder);
      const newPath = path.join(newDir, existing.filename);

      if (!fs.existsSync(newDir)) fs.mkdirSync(newDir, { recursive: true });

      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
      }

      updates.folder = newFolder;
      updates.url = `/uploads/media/${newFolder}/${existing.filename}`;
    }

    if (Object.keys(updates).length === 0) {
      return res.json({ data: existing, error: null, meta: null });
    }

    const [updated] = await db
      .update(mediaFiles)
      .set(updates)
      .where(eq(mediaFiles.id, req.params.id))
      .returning();

    res.json({ data: updated, error: null, meta: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message, meta: null });
  }
});

// DELETE /api/sb/media/:id — 파일 삭제 (DB + 물리적 파일)
router.delete("/:id", async (req, res) => {
  try {
    if (!validateId(req.params.id, res)) return;

    const [existing] = await db
      .select()
      .from(mediaFiles)
      .where(eq(mediaFiles.id, req.params.id));

    if (!existing) {
      return res.status(404).json({ data: null, error: "파일을 찾을 수 없습니다", meta: null });
    }

    // 물리적 파일 삭제
    const filePath = path.join(MEDIA_DIR, existing.folder, existing.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // DB 레코드 삭제
    await db
      .delete(mediaFiles)
      .where(eq(mediaFiles.id, req.params.id));

    res.json({ data: { id: req.params.id }, error: null, meta: null });
  } catch (err) {
    res.status(500).json({ data: null, error: err.message, meta: null });
  }
});

module.exports = router;
