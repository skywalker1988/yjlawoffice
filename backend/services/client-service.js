/**
 * 고객 서비스 — 고객 CRUD 비즈니스 로직
 * - 상담 신청 시 자동 등록되거나 관리자가 직접 등록
 */
const { db } = require("../db");
const { clients } = require("../db/schema");
const { eq, desc, sql, and, like, or } = require("drizzle-orm");
const {
  ServiceError,
  validateUUID,
  parsePagination,
  buildPaginationMeta,
  cleanPhone,
} = require("./helpers");

/**
 * 고객 목록 조회 (페이지네이션 + 검색/필터)
 * @param {object} filters - { page, limit, q, source, active }
 * @returns {{ items: Array, meta: object }}
 */
async function listClients(filters) {
  const { page, limit, offset } = parsePagination(filters);

  const conditions = [];
  if (filters.source) {
    conditions.push(eq(clients.source, filters.source));
  }
  if (filters.active !== undefined) {
    conditions.push(eq(clients.isActive, filters.active === "true" ? 1 : 0));
  }
  if (filters.q) {
    const { escapeLike } = require("../lib/sanitize");
    const escaped = escapeLike(filters.q);
    conditions.push(
      or(
        like(clients.name, `%${escaped}%`),
        like(clients.phone, `%${escaped}%`),
        like(clients.email, `%${escaped}%`),
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

  return {
    items: rows,
    meta: buildPaginationMeta(total, page, limit),
  };
}

/**
 * 고객 등록
 * @param {object} data - { name, phone, email?, category?, memo?, source? }
 * @returns {object} 생성된 고객 레코드
 */
async function createClient(data) {
  const { name, phone, email, category, memo, source } = data;

  if (!name?.trim() || !phone?.trim()) {
    throw new ServiceError("이름과 전화번호는 필수입니다", 400);
  }

  const phoneDigits = cleanPhone(phone.trim());

  // 전화번호 중복 체크
  const [existing] = await db.select().from(clients)
    .where(eq(clients.phone, phoneDigits));
  if (existing) {
    throw new ServiceError("이미 등록된 전화번호입니다", 409);
  }

  const [inserted] = await db.insert(clients).values({
    name: name.trim(),
    phone: phoneDigits,
    email: email?.trim() || null,
    category: category || null,
    memo: memo?.trim() || null,
    source: source || "manual",
  }).returning();

  return inserted;
}

/**
 * 고객 정보 수정
 * @param {string} id - 고객 UUID
 * @param {object} data - 수정할 필드
 * @returns {object} 수정된 고객 레코드
 */
async function updateClient(id, data) {
  validateUUID(id);

  const [existing] = await db.select().from(clients).where(eq(clients.id, id));
  if (!existing) {
    throw new ServiceError("고객을 찾을 수 없습니다", 404);
  }

  const { name, phone, email, category, memo, isActive } = data;
  const updateData = { updatedAt: sql`(datetime('now'))` };
  if (name !== undefined) updateData.name = name.trim();
  if (phone !== undefined) updateData.phone = cleanPhone(phone.trim());
  if (email !== undefined) updateData.email = email?.trim() || null;
  if (category !== undefined) updateData.category = category;
  if (memo !== undefined) updateData.memo = memo?.trim() || null;
  if (isActive !== undefined) updateData.isActive = isActive ? 1 : 0;

  const [updated] = await db.update(clients)
    .set(updateData)
    .where(eq(clients.id, id))
    .returning();

  return updated;
}

/**
 * 고객 삭제
 * @param {string} id - 고객 UUID
 * @returns {{ deleted: true }}
 */
async function deleteClient(id) {
  validateUUID(id);

  const [existing] = await db.select().from(clients).where(eq(clients.id, id));
  if (!existing) {
    throw new ServiceError("고객을 찾을 수 없습니다", 404);
  }

  await db.delete(clients).where(eq(clients.id, id));
  return { deleted: true };
}

module.exports = {
  listClients,
  createClient,
  updateClient,
  deleteClient,
};
