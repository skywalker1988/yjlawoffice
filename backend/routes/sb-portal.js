/**
 * 의뢰인 포털 API 라우트 — 회원가입/로그인(공개) + 사건 조회/메시지(인증) + 사건 관리(관리자)
 */
const { Router } = require("express");
const { db } = require("../db");
const { portalUsers, caseFilesTable, caseDocuments, caseMessages, clients } = require("../db/schema");
const { eq, desc, and, sql } = require("drizzle-orm");
const { hashPassword, verifyPassword, getSession } = require("../lib/auth");
const crypto = require("crypto");

const router = Router();

/** UUID v4 형식 검증 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** 이메일 형식 검증 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 한국 전화번호 패턴 */
const KOREAN_PHONE_REGEX = /^(0[0-9]{1,2})-?([0-9]{3,4})-?([0-9]{4})$/;

// =============================================
// 포털 세션 스토어 (인메모리)
// =============================================
const portalSessions = new Map();

/**
 * 포털 인증 미들웨어
 * - x-portal-token 헤더로 세션 검증
 */
function portalAuth(req, res, next) {
  const token = req.headers["x-portal-token"];
  const session = portalSessions.get(token);
  if (!session) {
    return res.status(401).json({ data: null, error: "인증이 필요합니다", meta: null });
  }
  req.portalUser = session;
  next();
}

// =============================================
// 공개 엔드포인트 (인증 불필요)
// =============================================

/**
 * POST /api/sb/portal/register — 포털 회원가입
 * - email, password, name, phone 필수
 * - phone으로 기존 고객(clients) 매칭
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({ data: null, error: "올바른 이메일 주소를 입력해주세요", meta: null });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ data: null, error: "비밀번호는 6자 이상이어야 합니다", meta: null });
    }
    if (!name || !name.trim()) {
      return res.status(400).json({ data: null, error: "이름을 입력해주세요", meta: null });
    }
    if (!phone || !KOREAN_PHONE_REGEX.test(phone.replace(/\s/g, ""))) {
      return res.status(400).json({ data: null, error: "올바른 연락처를 입력해주세요", meta: null });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 이메일 중복 체크
    const [existingUser] = await db
      .select()
      .from(portalUsers)
      .where(eq(portalUsers.email, normalizedEmail));

    if (existingUser) {
      return res.status(409).json({ data: null, error: "이미 가입된 이메일입니다", meta: null });
    }

    // 전화번호로 기존 고객 매칭
    const cleanPhone = phone.replace(/[-\s]/g, "");
    const [matchedClient] = await db
      .select()
      .from(clients)
      .where(eq(clients.phone, cleanPhone));

    const passwordHash = hashPassword(password);

    const [created] = await db.insert(portalUsers).values({
      email: normalizedEmail,
      passwordHash,
      clientId: matchedClient ? matchedClient.id : null,
    }).returning();

    // 매칭된 고객이 없으면 새 고객 레코드 생성
    if (!matchedClient) {
      const [newClient] = await db.insert(clients).values({
        name: name.trim(),
        phone: cleanPhone,
        email: normalizedEmail,
        source: "manual",
      }).returning();

      // portalUser에 clientId 연결
      await db
        .update(portalUsers)
        .set({ clientId: newClient.id })
        .where(eq(portalUsers.id, created.id));

      created.clientId = newClient.id;
    }

    res.json({
      data: { id: created.id, email: created.email, clientId: created.clientId },
      error: null,
      meta: null,
    });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/**
 * POST /api/sb/portal/login — 포털 로그인
 * - email, password
 * - 세션 토큰 발급
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ data: null, error: "이메일과 비밀번호를 입력해주세요", meta: null });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const [user] = await db
      .select()
      .from(portalUsers)
      .where(eq(portalUsers.email, normalizedEmail));

    if (!user) {
      return res.status(401).json({ data: null, error: "이메일 또는 비밀번호가 올바르지 않습니다", meta: null });
    }

    if (!user.isActive) {
      return res.status(403).json({ data: null, error: "비활성화된 계정입니다", meta: null });
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ data: null, error: "이메일 또는 비밀번호가 올바르지 않습니다", meta: null });
    }

    // 세션 토큰 생성
    const token = crypto.randomBytes(32).toString("hex");
    portalSessions.set(token, {
      userId: user.id,
      email: user.email,
      clientId: user.clientId,
    });

    res.json({
      data: {
        token,
        user: { id: user.id, email: user.email, clientId: user.clientId },
      },
      error: null,
      meta: null,
    });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/**
 * POST /api/sb/portal/logout — 로그아웃
 */
router.post("/logout", (req, res) => {
  const token = req.headers["x-portal-token"];
  if (token) {
    portalSessions.delete(token);
  }
  res.json({ data: { message: "로그아웃 되었습니다" }, error: null, meta: null });
});

// =============================================
// 인증 필요 엔드포인트 (portalAuth 미들웨어)
// =============================================

/**
 * GET /api/sb/portal/me — 현재 사용자 정보
 */
router.get("/me", portalAuth, async (req, res) => {
  try {
    const { userId, clientId } = req.portalUser;

    const [user] = await db
      .select({ id: portalUsers.id, email: portalUsers.email, clientId: portalUsers.clientId })
      .from(portalUsers)
      .where(eq(portalUsers.id, userId));

    let clientInfo = null;
    if (clientId) {
      const [client] = await db.select().from(clients).where(eq(clients.id, clientId));
      clientInfo = client || null;
    }

    res.json({ data: { user, client: clientInfo }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/**
 * GET /api/sb/portal/cases — 내 사건 목록
 */
router.get("/cases", portalAuth, async (req, res) => {
  try {
    const { clientId } = req.portalUser;

    if (!clientId) {
      return res.json({ data: [], error: null, meta: null });
    }

    const rows = await db
      .select()
      .from(caseFilesTable)
      .where(eq(caseFilesTable.clientId, clientId))
      .orderBy(desc(caseFilesTable.createdAt));

    res.json({ data: rows, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/**
 * GET /api/sb/portal/cases/:id — 사건 상세 (문서 + 최근 메시지 포함)
 * - 본인 사건만 조회 가능
 */
router.get("/cases/:id", portalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { clientId } = req.portalUser;

    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [caseFile] = await db
      .select()
      .from(caseFilesTable)
      .where(and(eq(caseFilesTable.id, id), eq(caseFilesTable.clientId, clientId)));

    if (!caseFile) {
      return res.status(404).json({ data: null, error: "사건을 찾을 수 없습니다", meta: null });
    }

    // 관련 문서 조회
    const documents = await db
      .select()
      .from(caseDocuments)
      .where(eq(caseDocuments.caseFileId, id))
      .orderBy(desc(caseDocuments.createdAt));

    // 최근 메시지 10건 조회
    const messages = await db
      .select()
      .from(caseMessages)
      .where(eq(caseMessages.caseFileId, id))
      .orderBy(desc(caseMessages.createdAt))
      .limit(10);

    res.json({
      data: { ...caseFile, documents, messages: messages.reverse() },
      error: null,
      meta: null,
    });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/**
 * GET /api/sb/portal/cases/:id/messages — 사건 메시지 목록 (페이지네이션)
 */
router.get("/cases/:id/messages", portalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { clientId } = req.portalUser;

    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    // 본인 사건 확인
    const [caseFile] = await db
      .select()
      .from(caseFilesTable)
      .where(and(eq(caseFilesTable.id, id), eq(caseFilesTable.clientId, clientId)));

    if (!caseFile) {
      return res.status(404).json({ data: null, error: "사건을 찾을 수 없습니다", meta: null });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const rows = await db
      .select()
      .from(caseMessages)
      .where(eq(caseMessages.caseFileId, id))
      .orderBy(desc(caseMessages.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: sql`count(*)` })
      .from(caseMessages)
      .where(eq(caseMessages.caseFileId, id));

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
 * POST /api/sb/portal/cases/:id/messages — 의뢰인 메시지 전송
 */
router.post("/cases/:id/messages", portalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { clientId, userId } = req.portalUser;

    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    // 본인 사건 확인
    const [caseFile] = await db
      .select()
      .from(caseFilesTable)
      .where(and(eq(caseFilesTable.id, id), eq(caseFilesTable.clientId, clientId)));

    if (!caseFile) {
      return res.status(404).json({ data: null, error: "사건을 찾을 수 없습니다", meta: null });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ data: null, error: "메시지 내용을 입력해주세요", meta: null });
    }

    const [inserted] = await db.insert(caseMessages).values({
      caseFileId: id,
      senderId: userId,
      senderType: "client",
      content: content.trim(),
    }).returning();

    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

// =============================================
// 관리자 엔드포인트
// =============================================

/**
 * 관리자 인증 미들웨어 — Bearer 토큰으로 admin 세션 검증
 */
function adminAuth(req, res, next) {
  const auth = req.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const session = token ? getSession(token) : null;
  if (!session) {
    return res.status(401).json({ data: null, error: "관리자 인증이 필요합니다", meta: null });
  }
  req.adminUser = session;
  next();
}

/**
 * GET /api/sb/portal/admin/cases — 전체 사건 목록 (관리자)
 */
router.get("/admin/cases", adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const rows = await db
      .select()
      .from(caseFilesTable)
      .orderBy(desc(caseFilesTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: sql`count(*)` })
      .from(caseFilesTable);

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
 * POST /api/sb/portal/admin/cases — 사건 생성 (관리자)
 * - clientId, title 필수, lawyerId, description 선택
 */
router.post("/admin/cases", adminAuth, async (req, res) => {
  try {
    const { clientId, title, lawyerId, description } = req.body;

    if (!clientId || !UUID_REGEX.test(clientId)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 고객 ID입니다", meta: null });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ data: null, error: "사건 제목을 입력해주세요", meta: null });
    }

    const [inserted] = await db.insert(caseFilesTable).values({
      clientId,
      title: title.trim(),
      lawyerId: lawyerId || null,
      description: description || null,
    }).returning();

    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/**
 * PATCH /api/sb/portal/admin/cases/:id — 사건 수정 (관리자)
 */
router.patch("/admin/cases/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [existing] = await db.select().from(caseFilesTable).where(eq(caseFilesTable.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "사건을 찾을 수 없습니다", meta: null });
    }

    const { status, description, title, lawyerId } = req.body;
    const updateData = { updatedAt: sql`(datetime('now'))` };

    if (status !== undefined) updateData.status = status;
    if (description !== undefined) updateData.description = description;
    if (title !== undefined) updateData.title = title.trim();
    if (lawyerId !== undefined) updateData.lawyerId = lawyerId;

    const [updated] = await db
      .update(caseFilesTable)
      .set(updateData)
      .where(eq(caseFilesTable.id, id))
      .returning();

    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/**
 * POST /api/sb/portal/admin/cases/:id/messages — 변호사 메시지 전송 (관리자)
 */
router.post("/admin/cases/:id/messages", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [caseFile] = await db.select().from(caseFilesTable).where(eq(caseFilesTable.id, id));
    if (!caseFile) {
      return res.status(404).json({ data: null, error: "사건을 찾을 수 없습니다", meta: null });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ data: null, error: "메시지 내용을 입력해주세요", meta: null });
    }

    const [inserted] = await db.insert(caseMessages).values({
      caseFileId: id,
      senderType: "lawyer",
      content: content.trim(),
    }).returning();

    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

module.exports = router;
