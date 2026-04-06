/**
 * 고객 관리 API 라우트 — 고객 CRUD
 * - 상담 신청 시 자동 등록되거나 관리자가 직접 등록
 * - 메시지 발송 시 수신자 목록으로 활용
 */
const { Router } = require("express");
const { db } = require("../db");
const { clients } = require("../db/schema");
const { eq, desc, sql, and, like, or } = require("drizzle-orm");

const router = Router();

/** UUID v4 형식 검증 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/sb/clients — 고객 목록 조회
 * - 쿼리: page, limit, q(검색), source, active
 */
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { q, source, active } = req.query;

    const conditions = [];
    if (source) conditions.push(eq(clients.source, source));
    if (active !== undefined) conditions.push(eq(clients.isActive, active === "true" ? 1 : 0));
    if (q) {
      conditions.push(
        or(
          like(clients.name, `%${q}%`),
          like(clients.phone, `%${q}%`),
          like(clients.email, `%${q}%`),
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let query = db.select().from(clients);
    let countQuery = db.select({ total: sql`count(*)` }).from(clients);

    if (whereClause) {
      query = query.where(whereClause);
      countQuery = countQuery.where(whereClause);
    }

    const rows = await query.orderBy(desc(clients.createdAt)).limit(limit).offset(offset);
    const [{ total }] = await countQuery;

    res.json({
      data: rows,
      error: null,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/**
 * POST /api/sb/clients — 고객 등록
 */
router.post("/", async (req, res) => {
  try {
    const { name, phone, email, category, memo, source } = req.body;
    if (!name?.trim() || !phone?.trim()) {
      return res.status(400).json({ data: null, error: "이름과 전화번호는 필수입니다", meta: null });
    }

    // 전화번호 중복 체크
    const cleanPhone = phone.trim().replace(/[-\s]/g, "");
    const [existing] = await db.select().from(clients)
      .where(eq(clients.phone, cleanPhone));
    if (existing) {
      return res.status(409).json({ data: null, error: "이미 등록된 전화번호입니다", meta: null });
    }

    const [inserted] = await db.insert(clients).values({
      name: name.trim(),
      phone: cleanPhone,
      email: email?.trim() || null,
      category: category || null,
      memo: memo?.trim() || null,
      source: source || "manual",
    }).returning();

    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/**
 * PATCH /api/sb/clients/:id — 고객 정보 수정
 */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [existing] = await db.select().from(clients).where(eq(clients.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "고객을 찾을 수 없습니다", meta: null });
    }

    const { name, phone, email, category, memo, isActive } = req.body;
    const updateData = { updatedAt: sql`(datetime('now'))` };
    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim().replace(/[-\s]/g, "");
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (category !== undefined) updateData.category = category;
    if (memo !== undefined) updateData.memo = memo?.trim() || null;
    if (isActive !== undefined) updateData.isActive = isActive ? 1 : 0;

    const [updated] = await db.update(clients)
      .set(updateData)
      .where(eq(clients.id, id))
      .returning();

    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/**
 * DELETE /api/sb/clients/:id — 고객 삭제
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [existing] = await db.select().from(clients).where(eq(clients.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "고객을 찾을 수 없습니다", meta: null });
    }

    await db.delete(clients).where(eq(clients.id, id));
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

module.exports = router;
