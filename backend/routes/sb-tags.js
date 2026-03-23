/**
 * 태그 API 라우트 — 태그 CRUD
 */
const { Router } = require("express");
const { db } = require("../db");
const { tags, documentTags } = require("../db/schema");
const { eq, count } = require("drizzle-orm");

const router = Router();

// GET /api/sb/tags
router.get("/", async (req, res) => {
  try {
    const rows = await db
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
        createdAt: tags.createdAt,
        documentCount: count(documentTags.documentId),
      })
      .from(tags)
      .leftJoin(documentTags, eq(tags.id, documentTags.tagId))
      .groupBy(tags.id);

    res.json({ data: rows, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// POST /api/sb/tags
router.post("/", async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) {
      return res.status(400).json({ data: null, error: "name is required", meta: null });
    }

    const [inserted] = await db
      .insert(tags)
      .values({ name, color: color ?? "#b08d57" })
      .returning();

    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// PUT /api/sb/tags/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    const [existing] = await db.select().from(tags).where(eq(tags.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "Tag not found", meta: null });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (color !== undefined) updateData.color = color;

    const [updated] = await db.update(tags).set(updateData).where(eq(tags.id, id)).returning();
    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// DELETE /api/sb/tags/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.select().from(tags).where(eq(tags.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "Tag not found", meta: null });
    }

    await db.delete(tags).where(eq(tags.id, id));
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

module.exports = router;
