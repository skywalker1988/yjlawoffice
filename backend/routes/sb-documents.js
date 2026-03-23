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
  tags,
  documentTags,
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

    // Fetch tags for each document
    const docIds = rows.map((r) => r.id);
    const tagsByDoc = {};

    if (docIds.length > 0) {
      const tagRows = await db
        .select({
          documentId: documentTags.documentId,
          tagId: tags.id,
          tagName: tags.name,
          tagColor: tags.color,
        })
        .from(documentTags)
        .innerJoin(tags, eq(documentTags.tagId, tags.id))
        .where(
          sql`${documentTags.documentId} IN (${sql.join(
            docIds.map((id) => sql`${id}`),
            sql`, `
          )})`
        );

      for (const row of tagRows) {
        if (!tagsByDoc[row.documentId]) tagsByDoc[row.documentId] = [];
        tagsByDoc[row.documentId].push({
          id: row.tagId,
          name: row.tagName,
          color: row.tagColor,
        });
      }
    }

    const data = rows.map((doc) => ({
      ...doc,
      tags: tagsByDoc[doc.id] ?? [],
    }));

    res.json({
      data,
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
      importance, filePath, fileType, metadata, tagIds, categoryIds,
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

    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      await db.insert(documentTags).values(
        tagIds.map((tagId) => ({ documentId: inserted.id, tagId }))
      );
    }

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

    // Auto-create tags from suggestions
    const createdTagIds = [];
    if (analysis.suggestedTags && analysis.suggestedTags.length > 0) {
      for (const tagName of analysis.suggestedTags.slice(0, 8)) {
        try {
          // 기존 태그 확인
          const [existing] = await db
            .select()
            .from(tags)
            .where(eq(tags.name, tagName));

          if (existing) {
            createdTagIds.push(existing.id);
          } else {
            // 새 태그 생성 (동시 요청 시 UNIQUE 제약 위반 가능)
            const colors = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const [newTag] = await db
              .insert(tags)
              .values({ name: tagName, color })
              .returning();
            createdTagIds.push(newTag.id);
          }
        } catch {
          // UNIQUE 제약 위반 시 기존 태그 재조회
          const [existing] = await db
            .select()
            .from(tags)
            .where(eq(tags.name, tagName));
          if (existing) createdTagIds.push(existing.id);
        }
      }

      // Link tags to document
      if (createdTagIds.length > 0) {
        await db.insert(documentTags).values(
          createdTagIds.map((tagId) => ({ documentId: inserted.id, tagId }))
        );
      }
    }

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

    // Fetch created document with tags
    const docTags = await db
      .select({ id: tags.id, name: tags.name, color: tags.color })
      .from(documentTags)
      .innerJoin(tags, eq(documentTags.tagId, tags.id))
      .where(eq(documentTags.documentId, inserted.id));

    res.json({
      data: {
        document: { ...inserted, tags: docTags },
        analysis: {
          documentType: analysis.documentType,
          keywords: analysis.keywords,
          suggestedTags: analysis.suggestedTags,
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

    const [doc] = await db.select().from(documents).where(eq(documents.id, id));
    if (!doc) {
      return res.status(404).json({ data: null, error: "Document not found", meta: null });
    }

    const docTags = await db
      .select({ id: tags.id, name: tags.name, color: tags.color })
      .from(documentTags)
      .innerJoin(tags, eq(documentTags.tagId, tags.id))
      .where(eq(documentTags.documentId, id));

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
        tags: docTags,
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

    const [existing] = await db.select().from(documents).where(eq(documents.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "Document not found", meta: null });
    }

    const { tagIds, categoryIds, ...fields } = req.body;

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

    if (tagIds && Array.isArray(tagIds)) {
      await db.delete(documentTags).where(eq(documentTags.documentId, id));
      if (tagIds.length > 0) {
        await db.insert(documentTags).values(
          tagIds.map((tagId) => ({ documentId: id, tagId }))
        );
      }
    }

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
