/** 변호사 관리 API — CRUD + 정렬 */
const { Router } = require("express");
const { eq, asc } = require("drizzle-orm");
const { db } = require("../db");
const { lawyers } = require("../db/schema");
const crypto = require("crypto");

const router = Router();

/** GET /api/sb/lawyers — 활성 변호사 목록 (공개용, 정렬순) */
router.get("/", async (req, res) => {
  try {
    const all = req.query.all === "true";
    const rows = db
      .select()
      .from(lawyers)
      .orderBy(asc(lawyers.sortOrder))
      .all();

    const result = all ? rows : rows.filter((r) => r.isActive === 1);
    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** GET /api/sb/lawyers/:id — 변호사 상세 */
router.get("/:id", async (req, res) => {
  try {
    const row = db
      .select()
      .from(lawyers)
      .where(eq(lawyers.id, req.params.id))
      .get();
    if (!row) return res.status(404).json({ error: "변호사를 찾을 수 없습니다" });
    res.json({ data: row });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** POST /api/sb/lawyers — 변호사 등록 */
router.post("/", async (req, res) => {
  try {
    const id = crypto.randomUUID();
    const { name, nameEn, position, photoUrl, education, career, specialties, introduction, email, phone, sortOrder, isActive } = req.body;
    if (!name) return res.status(400).json({ error: "이름은 필수입니다" });

    db.insert(lawyers).values({
      id,
      name,
      nameEn: nameEn || null,
      position: position || "어소시에이트",
      photoUrl: photoUrl || null,
      education: education || null,
      career: career || null,
      specialties: specialties || null,
      introduction: introduction || null,
      email: email || null,
      phone: phone || null,
      sortOrder: sortOrder ?? 0,
      isActive: isActive ?? 1,
    }).run();

    const created = db.select().from(lawyers).where(eq(lawyers.id, id)).get();
    res.status(201).json({ data: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** PATCH /api/sb/lawyers/:id — 변호사 정보 수정 */
router.patch("/:id", async (req, res) => {
  try {
    const existing = db.select().from(lawyers).where(eq(lawyers.id, req.params.id)).get();
    if (!existing) return res.status(404).json({ error: "변호사를 찾을 수 없습니다" });

    const updates = {};
    const fields = ["name", "nameEn", "position", "photoUrl", "education", "career", "specialties", "introduction", "email", "phone", "sortOrder", "isActive"];
    for (const f of fields) {
      if (req.body[f] !== undefined) updates[f] = req.body[f];
    }
    updates.updatedAt = new Date().toISOString().replace("T", " ").slice(0, 19);

    db.update(lawyers).set(updates).where(eq(lawyers.id, req.params.id)).run();
    const updated = db.select().from(lawyers).where(eq(lawyers.id, req.params.id)).get();
    res.json({ data: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/** DELETE /api/sb/lawyers/:id — 변호사 삭제 */
router.delete("/:id", async (req, res) => {
  try {
    const existing = db.select().from(lawyers).where(eq(lawyers.id, req.params.id)).get();
    if (!existing) return res.status(404).json({ error: "변호사를 찾을 수 없습니다" });

    db.delete(lawyers).where(eq(lawyers.id, req.params.id)).run();
    res.json({ data: { deleted: true } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
