/**
 * 세계사 이벤트 API 라우트 — 이벤트 CRUD + 통계
 */
const { Router } = require("express");
const { db } = require("../db");
const { historyEvents } = require("../db/schema");
const { eq, desc, asc, and, gte, lte, like, count, sql } = require("drizzle-orm");

const router = Router();

// GET /api/sb/history — list with filters
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page ?? "1"));
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit ?? "50")));
    const offset = (page - 1) * limit;

    const category = req.query.category || null;
    const region = req.query.region || null;
    const yearFrom = req.query.year_from ? parseInt(req.query.year_from) : null;
    const yearTo = req.query.year_to ? parseInt(req.query.year_to) : null;
    const importance = req.query.importance ? parseInt(req.query.importance) : null;
    const search = req.query.q || null;
    const sortDir = req.query.sort === "desc" ? desc : asc;

    const conditions = [];
    if (category) conditions.push(eq(historyEvents.category, category));
    if (region) conditions.push(eq(historyEvents.region, region));
    if (yearFrom) conditions.push(gte(historyEvents.year, yearFrom));
    if (yearTo) conditions.push(lte(historyEvents.year, yearTo));
    if (importance) conditions.push(eq(historyEvents.importance, importance));
    if (search) conditions.push(like(historyEvents.title, `%${search}%`));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ total: count() })
      .from(historyEvents)
      .where(where);

    const rows = await db
      .select()
      .from(historyEvents)
      .where(where)
      .orderBy(sortDir(historyEvents.year), sortDir(historyEvents.month))
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

// GET /api/sb/history/stats — 통계
router.get("/stats", async (req, res) => {
  try {
    const [totalResult] = await db.select({ total: count() }).from(historyEvents);

    const byCategory = await db
      .select({ category: historyEvents.category, count: count() })
      .from(historyEvents)
      .groupBy(historyEvents.category);

    const byRegion = await db
      .select({ region: historyEvents.region, count: count() })
      .from(historyEvents)
      .groupBy(historyEvents.region);

    const yearRange = await db
      .select({
        minYear: sql`MIN(${historyEvents.year})`,
        maxYear: sql`MAX(${historyEvents.year})`,
      })
      .from(historyEvents);

    res.json({
      data: {
        total: totalResult.total,
        byCategory,
        byRegion,
        yearRange: yearRange[0] || { minYear: null, maxYear: null },
      },
      error: null,
      meta: null,
    });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// POST /api/sb/history — create
router.post("/", async (req, res) => {
  try {
    const { title, description, year, month, day, endYear, category, region, country, importance, latitude, longitude, source, relatedDocumentId } = req.body;

    if (!title || year === undefined) {
      return res.status(400).json({ data: null, error: "title and year are required", meta: null });
    }

    const [inserted] = await db
      .insert(historyEvents)
      .values({
        title,
        description: description ?? null,
        year,
        month: month ?? null,
        day: day ?? null,
        endYear: endYear ?? null,
        category: category ?? "politics",
        region: region ?? null,
        country: country ?? null,
        importance: importance ?? 3,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        source: source ?? null,
        relatedDocumentId: relatedDocumentId ?? null,
      })
      .returning();

    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// GET /api/sb/history/:id
router.get("/:id", async (req, res) => {
  try {
    const [event] = await db.select().from(historyEvents).where(eq(historyEvents.id, req.params.id));
    if (!event) {
      return res.status(404).json({ data: null, error: "Event not found", meta: null });
    }
    res.json({ data: event, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// PATCH /api/sb/history/:id — update
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.select().from(historyEvents).where(eq(historyEvents.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "Event not found", meta: null });
    }

    const updateData = {};
    const allowedFields = ["title", "description", "year", "month", "day", "endYear", "category", "region", "country", "importance", "latitude", "longitude", "source", "relatedDocumentId"];
    for (const key of allowedFields) {
      if (key in req.body) updateData[key] = req.body[key];
    }
    updateData.updatedAt = new Date().toISOString().replace("T", " ").slice(0, 19);

    const [updated] = await db
      .update(historyEvents)
      .set(updateData)
      .where(eq(historyEvents.id, id))
      .returning();

    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// DELETE /api/sb/history/:id
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [existing] = await db.select().from(historyEvents).where(eq(historyEvents.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "Event not found", meta: null });
    }

    await db.delete(historyEvents).where(eq(historyEvents.id, id));
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

module.exports = router;
