/**
 * 카테고리 API 라우트 — 카테고리 CRUD
 */
const { Router } = require("express");
const { db } = require("../db");
const { categories } = require("../db/schema");
const { eq } = require("drizzle-orm");

const router = Router();

// GET /api/sb/categories
router.get("/", async (req, res) => {
  try {
    const rows = await db.select().from(categories);
    res.json({ data: rows, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// POST /api/sb/categories
router.post("/", async (req, res) => {
  try {
    const { name, slug, parentId, color, icon, sortOrder } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ data: null, error: "name and slug are required", meta: null });
    }

    const [inserted] = await db
      .insert(categories)
      .values({
        name,
        slug,
        parentId: parentId ?? null,
        color: color ?? null,
        icon: icon ?? null,
        sortOrder: sortOrder ?? 0,
      })
      .returning();

    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// PATCH /api/sb/categories/:id
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.select().from(categories).where(eq(categories.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "Category not found", meta: null });
    }

    const updateData = {};
    const allowedFields = ["name", "slug", "parentId", "color", "icon", "sortOrder"];
    for (const key of allowedFields) {
      if (key in req.body) updateData[key] = req.body[key];
    }

    const [updated] = await db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();

    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// DELETE /api/sb/categories/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.select().from(categories).where(eq(categories.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "Category not found", meta: null });
    }

    await db.delete(categories).where(eq(categories.id, id));
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

module.exports = router;
