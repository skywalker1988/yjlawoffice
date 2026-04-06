/**
 * 메시지 발송 API 라우트 — 템플릿 CRUD + SMS/이메일 발송 + 이력 조회
 * - CoolSMS로 문자 발송, Nodemailer로 이메일 발송
 * - 상담 고객 연락처 연동
 */
const { Router } = require("express");
const { db } = require("../db");
const { messageTemplates, messageLogs, consultations } = require("../db/schema");
const { eq, desc, sql, and } = require("drizzle-orm");
const { sendSMS } = require("../lib/sms-service");
const { sendEmail } = require("../lib/email-service");

const router = Router();

/** UUID v4 형식 검증 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 상담 분야 한국어 라벨 */
const CATEGORY_LABELS = {
  general: "일반", civil: "민사", criminal: "형사", family: "가사",
  admin: "행정", tax: "조세", realestate: "부동산", corporate: "기업법무", other: "기타",
};

/**
 * 플레이스홀더 치환
 * - {name}: 수신자 이름, {date}: 오늘 날짜, {category}: 상담 분야
 */
function replacePlaceholders(text, data) {
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  return text
    .replace(/\{name\}/g, data.name || "")
    .replace(/\{date\}/g, today)
    .replace(/\{category\}/g, CATEGORY_LABELS[data.category] || data.category || "");
}

// =============================================
// 템플릿 CRUD
// =============================================

/** GET /templates — 템플릿 목록 */
router.get("/templates", async (req, res) => {
  try {
    const { channel } = req.query;
    let query = db.select().from(messageTemplates);
    if (channel) {
      query = query.where(eq(messageTemplates.channel, channel));
    }
    const rows = await query.orderBy(messageTemplates.sortOrder);
    res.json({ data: rows, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** POST /templates — 템플릿 생성 */
router.post("/templates", async (req, res) => {
  try {
    const { name, channel, subject, content, isActive, sortOrder } = req.body;
    if (!name?.trim() || !content?.trim()) {
      return res.status(400).json({ data: null, error: "이름과 내용은 필수입니다", meta: null });
    }
    if (channel && !["sms", "email"].includes(channel)) {
      return res.status(400).json({ data: null, error: "채널은 sms 또는 email이어야 합니다", meta: null });
    }

    const [inserted] = await db.insert(messageTemplates).values({
      name: name.trim(),
      channel: channel || "sms",
      subject: subject?.trim() || null,
      content: content.trim(),
      isActive: isActive !== undefined ? (isActive ? 1 : 0) : 1,
      sortOrder: sortOrder || 0,
    }).returning();

    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** PATCH /templates/:id — 템플릿 수정 */
router.patch("/templates/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [existing] = await db.select().from(messageTemplates).where(eq(messageTemplates.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "템플릿을 찾을 수 없습니다", meta: null });
    }

    const { name, channel, subject, content, isActive, sortOrder } = req.body;
    const updateData = { updatedAt: sql`(datetime('now'))` };
    if (name !== undefined) updateData.name = name.trim();
    if (channel !== undefined) updateData.channel = channel;
    if (subject !== undefined) updateData.subject = subject?.trim() || null;
    if (content !== undefined) updateData.content = content.trim();
    if (isActive !== undefined) updateData.isActive = isActive ? 1 : 0;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const [updated] = await db.update(messageTemplates)
      .set(updateData)
      .where(eq(messageTemplates.id, id))
      .returning();

    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** DELETE /templates/:id — 템플릿 삭제 */
router.delete("/templates/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [existing] = await db.select().from(messageTemplates).where(eq(messageTemplates.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "템플릿을 찾을 수 없습니다", meta: null });
    }

    await db.delete(messageTemplates).where(eq(messageTemplates.id, id));
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// =============================================
// 메시지 발송
// =============================================

/**
 * POST /send — 메시지 발송
 * body: { channel, recipients: [{ name, contact, consultationId?, category? }], templateId?, subject?, content }
 */
router.post("/send", async (req, res) => {
  try {
    const { channel, recipients, templateId, subject, content } = req.body;

    if (!channel || !["sms", "email"].includes(channel)) {
      return res.status(400).json({ data: null, error: "채널은 sms 또는 email이어야 합니다", meta: null });
    }
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ data: null, error: "수신자를 1명 이상 지정해주세요", meta: null });
    }
    if (!content?.trim()) {
      return res.status(400).json({ data: null, error: "메시지 내용을 입력해주세요", meta: null });
    }
    if (channel === "email" && !subject?.trim()) {
      return res.status(400).json({ data: null, error: "이메일 제목을 입력해주세요", meta: null });
    }

    const results = [];
    for (const recipient of recipients) {
      const renderedContent = replacePlaceholders(content, {
        name: recipient.name,
        category: recipient.category,
      });
      const renderedSubject = subject ? replacePlaceholders(subject, {
        name: recipient.name,
        category: recipient.category,
      }) : null;

      let sendResult;
      if (channel === "sms") {
        sendResult = await sendSMS(recipient.contact, renderedContent);
      } else {
        sendResult = await sendEmail(recipient.contact, renderedSubject, renderedContent);
      }

      const now = new Date().toISOString().replace("T", " ").slice(0, 19);

      // 발송 이력 저장 (발송 시각 포함)
      const [log] = await db.insert(messageLogs).values({
        channel,
        recipientName: recipient.name || null,
        recipientContact: recipient.contact,
        consultationId: recipient.consultationId || null,
        templateId: templateId || null,
        subject: renderedSubject,
        content: renderedContent,
        status: sendResult.success ? "sent" : "failed",
        errorMessage: sendResult.error || null,
        sentAt: sendResult.success ? now : null,
      }).returning();

      results.push({
        recipientContact: recipient.contact,
        success: sendResult.success,
        messageId: sendResult.messageId,
        error: sendResult.error,
        logId: log.id,
        sentAt: sendResult.success ? now : null,
      });
    }

    const sent = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    res.json({
      data: { total: results.length, sent, failed, results },
      error: null,
      meta: null,
    });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// =============================================
// 발송 이력
// =============================================

/** GET /logs — 발송 이력 목록 (페이지네이션) */
router.get("/logs", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { channel, status } = req.query;

    const conditions = [];
    if (channel) conditions.push(eq(messageLogs.channel, channel));
    if (status) conditions.push(eq(messageLogs.status, status));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    let query = db.select().from(messageLogs);
    let countQuery = db.select({ total: sql`count(*)` }).from(messageLogs);

    if (whereClause) {
      query = query.where(whereClause);
      countQuery = countQuery.where(whereClause);
    }

    const rows = await query.orderBy(desc(messageLogs.createdAt)).limit(limit).offset(offset);
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

/** DELETE /logs/:id — 이력 삭제 */
router.delete("/logs/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [existing] = await db.select().from(messageLogs).where(eq(messageLogs.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "이력을 찾을 수 없습니다", meta: null });
    }

    await db.delete(messageLogs).where(eq(messageLogs.id, id));
    res.json({ data: { deleted: true }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

module.exports = router;
