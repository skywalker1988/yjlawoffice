/**
 * 문서 API 라우트
 * - CRUD, FTS5 검색, 파일 업로드 (PDF/MD/TXT/HTML), 마크다운 자동 분석
 */
const { Router } = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { db, searchFTSWithSnippet } = require("../db");
const {
  documents,
  documentCategories,
  categories,
  collections,
  documentCollections,
  highlights,
  documentRelations,
} = require("../db/schema");
const { eq, desc, sql, and, like, count } = require("drizzle-orm");

const { analyzeMarkdown } = require("../lib/markdown-analyzer");

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

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

function stripMarkdown(md) {
  return md
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/`{1,3}[^`]*`{1,3}/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[(.+?)\]\(.*?\)/g, "$1")
    .replace(/>\s+/g, "")
    .replace(/[-*+]\s+/g, "")
    .replace(/\d+\.\s+/g, "")
    .replace(/---+/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// GET /api/sb/documents — list with pagination & filters
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page ?? "1"));
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit ?? "20")));
    const offset = (page - 1) * limit;

    const documentType = req.query.document_type || null;
    const status = req.query.status || null;
    const importance = req.query.importance || null;
    const search = req.query.q || null;

    const conditions = [];
    if (documentType) conditions.push(eq(documents.documentType, documentType));
    if (status) conditions.push(eq(documents.status, status));
    if (importance) conditions.push(eq(documents.importance, parseInt(importance)));
    if (search) conditions.push(like(documents.title, `%${search}%`));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ total: count() })
      .from(documents)
      .where(where);

    const rows = await db
      .select()
      .from(documents)
      .where(where)
      .orderBy(desc(documents.createdAt))
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

// GET /api/sb/documents/search — FTS5 search
router.get("/search", async (req, res) => {
  try {
    const q = req.query.q;
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit ?? "20")));

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ data: null, error: "Query parameter 'q' is required", meta: null });
    }

    const results = searchFTSWithSnippet(q, limit);
    res.json({ data: results, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// POST /api/sb/documents — create
router.post("/", async (req, res) => {
  try {
    const {
      title, documentType, subtitle, author, source, publishedDate,
      contentMarkdown, contentPlain, summary, status: docStatus,
      importance, filePath, fileType, metadata, categoryIds,
    } = req.body;

    if (!title || !documentType) {
      return res.status(400).json({ data: null, error: "title and documentType are required", meta: null });
    }

    // importance 범위 검증 (1~5)
    if (importance !== undefined && importance !== null) {
      const imp = parseInt(importance);
      if (isNaN(imp) || imp < 1 || imp > 5) {
        return res.status(400).json({ data: null, error: "importance는 1~5 사이의 값이어야 합니다", meta: null });
      }
    }

    const plain = contentPlain
      ? contentPlain
      : contentMarkdown
        ? stripMarkdown(contentMarkdown)
        : null;

    const [inserted] = await db
      .insert(documents)
      .values({
        title,
        documentType,
        subtitle: subtitle ?? null,
        author: typeof author === "object" ? JSON.stringify(author) : (author ?? null),
        source: source ?? null,
        publishedDate: publishedDate ?? null,
        contentMarkdown: contentMarkdown ?? null,
        contentPlain: plain,
        summary: summary ?? null,
        status: docStatus ?? "unread",
        importance: importance ?? 3,
        filePath: filePath ?? null,
        fileType: fileType ?? null,
        metadata: typeof metadata === "object" ? JSON.stringify(metadata) : (metadata ?? null),
      })
      .returning();

    if (categoryIds && Array.isArray(categoryIds) && categoryIds.length > 0) {
      await db.insert(documentCategories).values(
        categoryIds.map((categoryId) => ({ documentId: inserted.id, categoryId }))
      );
    }

    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// POST /api/sb/documents/upload — file upload
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ data: null, error: "No file provided", meta: null });
    }

    const buffer = req.file.buffer;
    const ext = path.extname(req.file.originalname).toLowerCase().replace(".", "");

    // 허용된 파일 확장자만 처리
    const ALLOWED_EXTENSIONS = ["pdf", "md", "markdown", "txt", "html", "htm"];
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return res.status(400).json({
        data: null,
        error: `지원하지 않는 파일 형식입니다: .${ext} (허용: ${ALLOWED_EXTENSIONS.join(", ")})`,
        meta: null,
      });
    }

    // MIME 타입 검증
    const ALLOWED_MIMES = {
      pdf: ["application/pdf"],
      md: ["text/markdown", "text/plain", "application/octet-stream"],
      markdown: ["text/markdown", "text/plain", "application/octet-stream"],
      txt: ["text/plain", "application/octet-stream"],
      html: ["text/html", "application/octet-stream"],
      htm: ["text/html", "application/octet-stream"],
    };
    const allowedMimes = ALLOWED_MIMES[ext];
    if (allowedMimes && !allowedMimes.includes(req.file.mimetype)) {
      return res.status(400).json({
        data: null,
        error: `잘못된 파일 형식입니다. .${ext} 파일의 MIME 타입이 올바르지 않습니다.`,
        meta: null,
      });
    }

    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const uuid = crypto.randomUUID();
    const fileName = `${uuid}.${ext}`;

    const relativeDir = path.join("data", "files", year, month);
    const absoluteDir = path.join(__dirname, "..", relativeDir);
    if (!fs.existsSync(absoluteDir)) {
      fs.mkdirSync(absoluteDir, { recursive: true });
    }

    const filePath = path.join(relativeDir, fileName);
    const absolutePath = path.join(absoluteDir, fileName);
    fs.writeFileSync(absolutePath, buffer);

    let contentPlain = null;
    let fileType = ext;

    if (ext === "pdf") {
      try {
        const pdfParse = require("pdf-parse");
        const parsed = await pdfParse(buffer);
        contentPlain = parsed.text;
        fileType = "pdf";
      } catch (e) {
        console.error("[PDF Parse Error]", e.message);
        contentPlain = null;
      }
    } else if (ext === "md" || ext === "markdown") {
      contentPlain = buffer.toString("utf-8");
      fileType = "markdown";
    } else if (ext === "txt") {
      contentPlain = buffer.toString("utf-8");
      fileType = "text";
    } else if (ext === "html" || ext === "htm") {
      contentPlain = buffer.toString("utf-8");
      fileType = "html";
    }

    res.json({
      data: {
        filePath: filePath.replace(/\\/g, "/"),
        contentPlain,
        fileType,
        fileSize: buffer.length,
      },
      error: null,
      meta: null,
    });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// POST /api/sb/documents/upload-markdown — upload markdown file with auto-analysis & document creation
router.post("/upload-markdown", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ data: null, error: "No file provided", meta: null });
    }

    const buffer = req.file.buffer;
    const ext = path.extname(req.file.originalname).toLowerCase().replace(".", "");
    const originalName = req.file.originalname;

    if (!["md", "markdown", "txt"].includes(ext)) {
      return res.status(400).json({ data: null, error: "Only markdown and text files are supported", meta: null });
    }

    const rawContent = buffer.toString("utf-8");

    // Analyze markdown content
    const analysis = analyzeMarkdown(rawContent, originalName);

    // Save file to disk
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const uuid = crypto.randomUUID();
    const fileName = `${uuid}.${ext}`;
    const relativeDir = path.join("data", "files", year, month);
    const absoluteDir = path.join(__dirname, "..", relativeDir);
    if (!fs.existsSync(absoluteDir)) {
      fs.mkdirSync(absoluteDir, { recursive: true });
    }
    const filePath = path.join(relativeDir, fileName);
    const absolutePath = path.join(absoluteDir, fileName);
    fs.writeFileSync(absolutePath, buffer);

    // Build metadata JSON from analysis
    const metadataObj = {
      ...analysis.extraMetadata,
      keywords: analysis.keywords,
      structure: analysis.structure,
      analyzedAt: new Date().toISOString(),
      originalFilename: originalName,
    };

    // Create document automatically
    const [inserted] = await db
      .insert(documents)
      .values({
        title: analysis.title,
        documentType: analysis.documentType,
        subtitle: analysis.subtitle,
        author: analysis.author,
        source: analysis.source,
        publishedDate: analysis.publishedDate,
        contentMarkdown: analysis.contentMarkdown,
        contentPlain: analysis.contentPlain,
        summary: analysis.summary,
        status: "unread",
        importance: analysis.importance,
        filePath: filePath.replace(/\\/g, "/"),
        fileType: "markdown",
        metadata: JSON.stringify(metadataObj),
      })
      .returning();

    // Auto-link categories from suggestions
    if (analysis.suggestedCategories && analysis.suggestedCategories.length > 0) {
      for (const catName of analysis.suggestedCategories) {
        const [existing] = await db
          .select()
          .from(categories)
          .where(eq(categories.name, catName));

        if (existing) {
          await db.insert(documentCategories).values({
            documentId: inserted.id,
            categoryId: existing.id,
          });
        }
      }
    }

    res.json({
      data: {
        document: inserted,
        analysis: {
          documentType: analysis.documentType,
          keywords: analysis.keywords,
          suggestedCategories: analysis.suggestedCategories,
          structure: analysis.structure,
          frontmatter: analysis.frontmatter,
        },
      },
      error: null,
      meta: { message: "Markdown analyzed and document created successfully" },
    });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// POST /api/sb/documents/analyze-markdown — analyze without creating (preview)
router.post("/analyze-markdown", upload.single("file"), async (req, res) => {
  try {
    let rawContent;
    let filename = "";

    if (req.file) {
      rawContent = req.file.buffer.toString("utf-8");
      filename = req.file.originalname;
    } else if (req.body.content) {
      rawContent = req.body.content;
      filename = req.body.filename || "";
    } else {
      return res.status(400).json({ data: null, error: "No file or content provided", meta: null });
    }

    const analysis = analyzeMarkdown(rawContent, filename);

    res.json({
      data: analysis,
      error: null,
      meta: null,
    });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// GET /api/sb/documents/:id — detail
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateId(id, res)) return;

    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    if (!doc) {
      return res.status(404).json({ data: null, error: "Document not found", meta: null });
    }

    const docCategories = await db
      .select({ id: categories.id, name: categories.name, slug: categories.slug, color: categories.color, icon: categories.icon })
      .from(documentCategories)
      .innerJoin(categories, eq(documentCategories.categoryId, categories.id))
      .where(eq(documentCategories.documentId, id));

    const docCollections = await db
      .select({ id: collections.id, name: collections.name, color: collections.color, icon: collections.icon })
      .from(documentCollections)
      .innerJoin(collections, eq(documentCollections.collectionId, collections.id))
      .where(eq(documentCollections.documentId, id));

    const docHighlights = await db
      .select()
      .from(highlights)
      .where(eq(highlights.documentId, id));

    const docRelations = await db
      .select()
      .from(documentRelations)
      .where(sql`${documentRelations.sourceId} = ${id} OR ${documentRelations.targetId} = ${id}`);

    res.json({
      data: {
        ...doc,
        categories: docCategories,
        collections: docCollections,
        highlights: docHighlights,
        relations: docRelations,
      },
      error: null,
      meta: null,
    });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// PATCH /api/sb/documents/:id — update
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateId(id, res)) return;

    const [existing] = await db.select().from(documents).where(eq(documents.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "Document not found", meta: null });
    }

    const { categoryIds, ...fields } = req.body;

    const updateData = {};
    const allowedFields = [
      "title", "documentType", "subtitle", "author", "source", "publishedDate",
      "contentMarkdown", "contentPlain", "summary", "status", "importance",
      "filePath", "fileType", "fileSize", "metadata",
    ];

    for (const key of allowedFields) {
      if (key in fields) {
        let value = fields[key];
        if ((key === "author" || key === "metadata") && typeof value === "object") {
          value = JSON.stringify(value);
        }
        updateData[key] = value;
      }
    }

    updateData.updatedAt = new Date().toISOString().replace("T", " ").slice(0, 19);

    const [updated] = await db
      .update(documents)
      .set(updateData)
      .where(eq(documents.id, id))
      .returning();

    if (categoryIds && Array.isArray(categoryIds)) {
      await db.delete(documentCategories).where(eq(documentCategories.documentId, id));
      if (categoryIds.length > 0) {
        await db.insert(documentCategories).values(
          categoryIds.map((categoryId) => ({ documentId: id, categoryId }))
        );
      }
    }

    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// DELETE /api/sb/documents/:id — soft then hard delete
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateId(id, res)) return;

    const [existing] = await db.select().from(documents).where(eq(documents.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "Document not found", meta: null });
    }

    if (existing.status === "archived") {
      await db.delete(documents).where(eq(documents.id, id));
      return res.json({ data: { deleted: true }, error: null, meta: null });
    }

    const [updated] = await db
      .update(documents)
      .set({
        status: "archived",
        updatedAt: new Date().toISOString().replace("T", " ").slice(0, 19),
      })
      .where(eq(documents.id, id))
      .returning();

    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

module.exports = router;
