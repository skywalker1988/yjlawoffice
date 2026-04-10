/**
 * 상담 서비스 — 상담 신청 CRUD 비즈니스 로직
 * - 상담 생성 시 고객 자동 등록 + Apps Script 웹훅 알림
 */
const { db } = require("../db");
const { consultations, clients } = require("../db/schema");
const { eq, desc, sql } = require("drizzle-orm");
const {
  ServiceError,
  validateUUID,
  parsePagination,
  buildPaginationMeta,
  KOREAN_PHONE_REGEX,
  cleanPhone,
} = require("./helpers");

/** 상담 분야 한국어 라벨 */
const CATEGORY_LABELS = {
  civil: "민사", criminal: "형사", family: "가사", admin: "행정",
  tax: "조세", realestate: "부동산", corporate: "기업법무", other: "기타",
};

/** Google Apps Script 웹훅 URL (환경변수로 관리) */
const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_WEBHOOK_URL || "";

/**
 * Apps Script 웹훅으로 상담 데이터를 전송한다 (이메일 + 스프레드시트).
 * 전송 실패 시 로그만 남기고 에러를 던지지 않는다.
 * @param {object} data - 상담 데이터
 */
async function notifyAppsScript(data) {
  if (!APPS_SCRIPT_URL) {
    console.warn("[상담 알림] APPS_SCRIPT_WEBHOOK_URL 환경변수가 설정되지 않았습니다");
    return;
  }
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
    // 응답 상태만 기록 (본문에 민감 데이터 포함 가능하므로 로깅하지 않음)
    await res.text();
    if (!res.ok) console.warn("[상담 알림] Apps Script 응답 오류:", res.status);
  } catch (err) {
    console.error("[상담 알림] Apps Script 전송 실패:", err.message);
  }
}

/**
 * 상담 신청 시 고객 DB에 자동 등록 또는 기존 고객 정보를 업데이트한다.
 * 실패해도 상담 생성에는 영향을 주지 않도록 내부에서 에러를 처리한다.
 * @param {object} dbData - { name, phone, email, category }
 * @param {string} consultationId - 생성된 상담 ID
 */
async function autoRegisterClient(dbData, consultationId) {
  const phoneDigits = cleanPhone(dbData.phone);
  try {
    let existingClient = null;

    if (phoneDigits) {
      [existingClient] = await db.select().from(clients)
        .where(eq(clients.phone, phoneDigits));
    }
    if (!existingClient && dbData.email) {
      [existingClient] = await db.select().from(clients)
        .where(eq(clients.email, dbData.email));
    }

    if (existingClient) {
      await db.update(clients).set({
        phone: phoneDigits || existingClient.phone,
        email: dbData.email || existingClient.email,
        category: dbData.category !== "general" ? dbData.category : existingClient.category,
        consultationId,
        updatedAt: sql`(datetime('now'))`,
      }).where(eq(clients.id, existingClient.id));
    } else {
      await db.insert(clients).values({
        name: dbData.name,
        phone: phoneDigits,
        email: dbData.email || null,
        category: dbData.category !== "general" ? dbData.category : null,
        source: "consultation",
        consultationId,
      });
    }
  } catch (clientErr) {
    console.error("[고객 자동등록 오류]", clientErr.message);
  }
}

/**
 * 상담 신청 생성 (공개 API)
 * - name, phone 또는 email, message(10자 이상) 필수
 * - 고객 자동 등록 + 웹훅 알림
 * @param {object} data - 요청 body 전체
 * @returns {object} 생성된 상담 레코드
 */
async function createConsultation(data) {
  const { name, phone, email, category, preferredDate, preferredTime, message, agreed } = data;

  // 필수값 검증
  if (!name || !name.trim()) {
    throw new ServiceError("이름을 입력해주세요", 400);
  }

  const hasPhone = phone && phone.trim();
  const hasEmail = email && email.trim();
  if (!hasPhone && !hasEmail) {
    throw new ServiceError("연락처(전화번호) 또는 이메일 중 최소 하나를 입력해주세요", 400);
  }
  if (hasPhone && !KOREAN_PHONE_REGEX.test(phone.replace(/\s/g, ""))) {
    throw new ServiceError("올바른 연락처를 입력해주세요 (예: 010-1234-5678)", 400);
  }
  if (!message || message.trim().length < 10) {
    throw new ServiceError("상담 내용은 10자 이상 입력해주세요", 400);
  }
  if (message.length > 5000) {
    throw new ServiceError("상담 내용은 5,000자 이내로 입력해주세요", 400);
  }
  if (name.length > 100) {
    throw new ServiceError("이름은 100자 이내로 입력해주세요", 400);
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

  // 고객 자동 등록 (실패해도 상담 생성은 성공)
  await autoRegisterClient(dbData, inserted.id);

  // 웹훅 알림 (실패해도 무시)
  const webhookData = {
    ...dbData,
    preferredDate: preferredDate || null,
    preferredTime: preferredTime || null,
    agreed: !!agreed,
  };
  try { await notifyAppsScript(webhookData); } catch (_) {}

  return inserted;
}

/**
 * 상담 목록 조회 (관리자)
 * @param {object} filters - { page, limit, status }
 * @returns {{ items: Array, meta: object }}
 */
async function listConsultations(filters) {
  const { page, limit, offset } = parsePagination(filters);

  let query = db.select().from(consultations);
  let countQuery = db.select({ total: sql`count(*)` }).from(consultations);

  if (filters.status) {
    query = query.where(eq(consultations.status, filters.status));
    countQuery = countQuery.where(eq(consultations.status, filters.status));
  }

  const rows = await query.orderBy(desc(consultations.createdAt)).limit(limit).offset(offset);
  const [{ total }] = await countQuery;

  return {
    items: rows,
    meta: buildPaginationMeta(total, page, limit),
  };
}

/**
 * 상담 상태/메모 수정 (관리자)
 * @param {string} id - 상담 UUID
 * @param {object} data - { status, adminNote }
 * @returns {object} 수정된 상담 레코드
 */
async function updateConsultation(id, data) {
  validateUUID(id);

  const [existing] = await db.select().from(consultations).where(eq(consultations.id, id));
  if (!existing) {
    throw new ServiceError("상담 내역을 찾을 수 없습니다", 404);
  }

  const { status, adminNote } = data;
  const updateData = { updatedAt: sql`(datetime('now'))` };
  if (status !== undefined) updateData.status = status;
  if (adminNote !== undefined) updateData.adminNote = adminNote;

  const [updated] = await db
    .update(consultations)
    .set(updateData)
    .where(eq(consultations.id, id))
    .returning();

  return updated;
}

/**
 * 상담 삭제 (관리자)
 * @param {string} id - 상담 UUID
 * @returns {{ deleted: true }}
 */
async function deleteConsultation(id) {
  validateUUID(id);

  const [existing] = await db.select().from(consultations).where(eq(consultations.id, id));
  if (!existing) {
    throw new ServiceError("상담 내역을 찾을 수 없습니다", 404);
  }

  await db.delete(consultations).where(eq(consultations.id, id));
  return { deleted: true };
}

module.exports = {
  createConsultation,
  listConsultations,
  updateConsultation,
  deleteConsultation,
};
