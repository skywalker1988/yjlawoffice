/**
 * 상담 신청 API 라우트 — 상담 CRUD (공개 생성 + 관리자 조회/수정/삭제)
 * - 생성 시 Google Apps Script 웹훅으로 이메일 알림 + 스프레드시트 저장
 */
const { Router } = require("express");
const { db } = require("../db");
const { consultations, clients } = require("../db/schema");
const { eq, desc, sql } = require("drizzle-orm");

/** 상담 분야 한국어 라벨 */
const CATEGORY_LABELS = {
  civil: "민사", criminal: "형사", family: "가사", admin: "행정",
  tax: "조세", realestate: "부동산", corporate: "기업법무", other: "기타",
};

/** Google Apps Script 웹훅 URL */
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxiIWHrRhyorWYX6eznoE1d-_AuQ9nAqp2H2LqtOGsQkd3mV-3GHF7X9nQdFLUdm0cnxg/exec";

/** Apps Script 웹훅으로 상담 데이터 전송 (이메일 + 스프레드시트) */
async function notifyAppsScript(data) {
  try {
    const payload = JSON.stringify({
      name: data.name,
      phone: data.phone,
      email: data.email || "",
      category: CATEGORY_LABELS[data.category] || data.category,
      preferredDate: data.preferredDate || "",
      preferredTime: data.preferredTime || "",
      message: data.message,
      agreed: data.agreed ? "동의" : "미동의",
    });
    const res = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: payload,
      redirect: "follow",
    });
    const text = await res.text();
    console.log("[상담 알림] Apps Script 응답:", res.status, text);
  } catch (err) {
    console.error("[상담 알림] Apps Script 전송 실패:", err.message);
  }
}

const router = Router();

/** 한국 전화번호 패턴 (010-1234-5678, 01012345678, 02-535-0461 등) */
const KOREAN_PHONE_REGEX = /^(0[0-9]{1,2})-?([0-9]{3,4})-?([0-9]{4})$/;

/** UUID v4 형식 검증 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/sb/consultations — 상담 신청 생성 (공개)
 * - name, phone, category, message 필수
 * - phone은 한국 전화번호 형식 검증
 * - message는 10자 이상
 */
router.post("/", async (req, res) => {
  try {
    const { name, phone, email, category, preferredDate, preferredTime, message, agreed } = req.body;

    // 필수값 검증
    if (!name || !name.trim()) {
      return res.status(400).json({ data: null, error: "이름을 입력해주세요", meta: null });
    }
    // 전화번호 또는 이메일 중 최소 하나 필수
    const hasPhone = phone && phone.trim();
    const hasEmail = email && email.trim();
    if (!hasPhone && !hasEmail) {
      return res.status(400).json({ data: null, error: "연락처(전화번호) 또는 이메일 중 최소 하나를 입력해주세요", meta: null });
    }
    if (hasPhone && !KOREAN_PHONE_REGEX.test(phone.replace(/\s/g, ""))) {
      return res.status(400).json({ data: null, error: "올바른 연락처를 입력해주세요 (예: 010-1234-5678)", meta: null });
    }
    if (!message || message.trim().length < 10) {
      return res.status(400).json({ data: null, error: "상담 내용은 10자 이상 입력해주세요", meta: null });
    }

    const dbData = {
      name: name.trim(),
      phone: hasPhone ? phone.trim() : "",
      email: hasEmail ? email.trim() : null,
      category: category || "general",
      message: message.trim(),
    };

    const [inserted] = await db
      .insert(consultations)
      .values(dbData)
      .returning();

    // 고객 DB에 자동 등록 (전화번호 또는 이메일 기준 중복 체크)
    const cleanPhone = dbData.phone ? dbData.phone.replace(/[-\s]/g, "") : "";
    try {
      let existingClient = null;
      // 전화번호가 있으면 전화번호로 검색, 없으면 이메일로 검색
      if (cleanPhone) {
        [existingClient] = await db.select().from(clients)
          .where(eq(clients.phone, cleanPhone));
      }
      if (!existingClient && dbData.email) {
        [existingClient] = await db.select().from(clients)
          .where(eq(clients.email, dbData.email));
      }

      if (existingClient) {
        // 기존 고객이면 정보 업데이트
        await db.update(clients).set({
          phone: cleanPhone || existingClient.phone,
          email: dbData.email || existingClient.email,
          category: dbData.category !== "general" ? dbData.category : existingClient.category,
          consultationId: inserted.id,
          updatedAt: sql`(datetime('now'))`,
        }).where(eq(clients.id, existingClient.id));
      } else {
        // 새 고객 등록
        await db.insert(clients).values({
          name: dbData.name,
          phone: cleanPhone,
          email: dbData.email || null,
          category: dbData.category !== "general" ? dbData.category : null,
          source: "consultation",
          consultationId: inserted.id,
        });
      }
    } catch (clientErr) {
      console.error("[고객 자동등록 오류]", clientErr.message);
    }

    // 이메일 알림 + 스프레드시트 저장 (DB에 없는 필드도 포함)
    const webhookData = {
      ...dbData,
      preferredDate: preferredDate || null,
      preferredTime: preferredTime || null,
      agreed: !!agreed,
    };
    try { await notifyAppsScript(webhookData); } catch (_) {}

    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/**
 * GET /api/sb/consultations — 상담 목록 조회 (관리자)
 * - 쿼리: page, limit, status
 */
router.get("/", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { status } = req.query;

    let query = db.select().from(consultations);
    let countQuery = db.select({ total: sql`count(*)` }).from(consultations);

    if (status) {
      query = query.where(eq(consultations.status, status));
      countQuery = countQuery.where(eq(consultations.status, status));
    }

    const rows = await query.orderBy(desc(consultations.createdAt)).limit(limit).offset(offset);
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
 * PATCH /api/sb/consultations/:id — 상담 상태/메모 수정 (관리자)
 */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [existing] = await db.select().from(consultations).where(eq(consultations.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "상담 내역을 찾을 수 없습니다", meta: null });
    }

    const { status, adminNote } = req.body;
    const updateData = { updatedAt: sql`(datetime('now'))` };
    if (status !== undefined) updateData.status = status;
    if (adminNote !== undefined) updateData.adminNote = adminNote;

    const [updated] = await db
      .update(consultations)
      .set(updateData)
      .where(eq(consultations.id, id))
      .returning();

    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/**
 * DELETE /api/sb/consultations/:id — 상담 삭제 (관리자)
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [existing] = await db.select().from(consultations).where(eq(consultations.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "상담 내역을 찾을 수 없습니다", meta: null });
    }

    await db.delete(consultations).where(eq(consultations.id, id));
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

module.exports = router;
