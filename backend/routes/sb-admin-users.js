/**
 * 관리자 사용자 API 라우트 — 로그인/로그아웃, 사용자 CRUD
 * - 인메모리 세션 기반 인증
 * - 서버 시작 시 기본 관리자 계정 자동 생성
 */
const { Router } = require("express");
const { db } = require("../db");
const { adminUsers } = require("../db/schema");
const { eq, sql } = require("drizzle-orm");
const { hashPassword, verifyPassword, createSession, getSession, deleteSession, adminAuth, requireRole, VALID_ROLES } = require("../lib/auth");
const { sqlite } = require("../db");

const router = Router();

/** UUID v4 형식 검증 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Authorization 헤더에서 Bearer 토큰 추출
 * @param {import("express").Request} req
 * @returns {string|null}
 */
function extractToken(req) {
  const auth = req.get("Authorization") || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

/**
 * 사용자 객체에서 passwordHash 제거
 * @param {object} user
 * @returns {object}
 */
function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, ...safe } = user;
  return safe;
}

/**
 * POST /login — 로그인
 * - username, password로 인증 후 세션 토큰 반환
 */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ data: null, error: "아이디와 비밀번호를 입력해주세요", meta: null });
    }

    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    if (!user) {
      return res.status(401).json({ data: null, error: "아이디 또는 비밀번호가 올바르지 않습니다", meta: null });
    }

    if (!user.isActive) {
      return res.status(403).json({ data: null, error: "비활성화된 계정입니다", meta: null });
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ data: null, error: "아이디 또는 비밀번호가 올바르지 않습니다", meta: null });
    }

    // 마지막 로그인 시간 업데이트
    await db.update(adminUsers).set({
      lastLoginAt: sql`(datetime('now'))`,
      updatedAt: sql`(datetime('now'))`,
    }).where(eq(adminUsers.id, user.id));

    const token = createSession(user.id, user.role);

    res.json({
      data: {
        token,
        user: { id: user.id, username: user.username, name: user.name, role: user.role, email: user.email },
      },
      error: null,
      meta: null,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

/**
 * POST /logout — 로그아웃
 * - Authorization 헤더의 토큰으로 세션 삭제
 */
router.post("/logout", (req, res) => {
  const token = extractToken(req);
  if (token) deleteSession(token);
  res.json({ data: { success: true }, error: null, meta: null });
});

/**
 * GET /me — 현재 로그인된 사용자 정보
 */
router.get("/me", async (req, res) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ data: null, error: "인증 토큰이 필요합니다", meta: null });
    }

    const session = getSession(token);
    if (!session) {
      return res.status(401).json({ data: null, error: "유효하지 않은 세션입니다", meta: null });
    }

    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, session.userId));
    if (!user || !user.isActive) {
      return res.status(401).json({ data: null, error: "사용자를 찾을 수 없습니다", meta: null });
    }

    res.json({ data: sanitizeUser(user), error: null, meta: null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

/**
 * GET / — 관리자 사용자 목록 (admin 역할만 접근 가능)
 */
router.get("/", adminAuth, requireRole("admin"), async (req, res) => {
  try {
    const rows = await db.select().from(adminUsers);
    res.json({ data: rows.map(sanitizeUser), error: null, meta: null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

/**
 * POST / — 관리자 사용자 생성 (admin 역할만 가능)
 * - username 중복 검사, 비밀번호 해싱, role 화이트리스트 검증
 */
router.post("/", adminAuth, requireRole("admin"), async (req, res) => {
  try {
    const { username, password, name, role, email } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ data: null, error: "아이디, 비밀번호, 이름은 필수입니다", meta: null });
    }

    if (password.length < 8) {
      return res.status(400).json({ data: null, error: "비밀번호는 8자 이상이어야 합니다", meta: null });
    }

    const assignedRole = role || "editor";
    if (!VALID_ROLES.includes(assignedRole)) {
      return res.status(400).json({ data: null, error: `유효하지 않은 역할입니다. 허용: ${VALID_ROLES.join(", ")}`, meta: null });
    }

    // 중복 username 검사
    const [existing] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    if (existing) {
      return res.status(409).json({ data: null, error: "이미 사용 중인 아이디입니다", meta: null });
    }

    const [inserted] = await db.insert(adminUsers).values({
      username,
      passwordHash: hashPassword(password),
      name,
      role: assignedRole,
      email: email || null,
    }).returning();

    res.json({ data: sanitizeUser(inserted), error: null, meta: null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

/**
 * PATCH /:id — 관리자 사용자 수정 (admin 역할만 가능)
 * - password 제공 시 재해싱, name/role/email/isActive 수정 가능
 * - 자기 자신 비활성화 불가, 마지막 admin 역할 변경/비활성화 불가
 */
router.patch("/:id", adminAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    const [existing] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "사용자를 찾을 수 없습니다", meta: null });
    }

    const { password, name, role, email, isActive } = req.body;
    const updateData = { updatedAt: sql`(datetime('now'))` };

    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ data: null, error: "비밀번호는 8자 이상이어야 합니다", meta: null });
      }
      updateData.passwordHash = hashPassword(password);
    }
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) {
      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ data: null, error: `유효하지 않은 역할입니다. 허용: ${VALID_ROLES.join(", ")}`, meta: null });
      }
      // 마지막 admin의 역할 변경 방지
      if (existing.role === "admin" && role !== "admin") {
        const activeAdminCount = sqlite.prepare(
          "SELECT COUNT(*) as cnt FROM admin_users WHERE role = 'admin' AND is_active = 1"
        ).get().cnt;
        if (activeAdminCount <= 1) {
          return res.status(400).json({ data: null, error: "마지막 관리자의 역할을 변경할 수 없습니다", meta: null });
        }
      }
      updateData.role = role;
    }
    if (email !== undefined) updateData.email = email;
    if (isActive !== undefined) {
      // 자기 자신 비활성화 방지
      if (!isActive && id === req.adminUser.userId) {
        return res.status(400).json({ data: null, error: "자기 자신을 비활성화할 수 없습니다", meta: null });
      }
      // 마지막 active admin 비활성화 방지
      if (!isActive && existing.role === "admin" && existing.isActive) {
        const activeAdminCount = sqlite.prepare(
          "SELECT COUNT(*) as cnt FROM admin_users WHERE role = 'admin' AND is_active = 1"
        ).get().cnt;
        if (activeAdminCount <= 1) {
          return res.status(400).json({ data: null, error: "마지막 관리자를 비활성화할 수 없습니다", meta: null });
        }
      }
      updateData.isActive = isActive ? 1 : 0;
    }

    const [updated] = await db.update(adminUsers).set(updateData)
      .where(eq(adminUsers.id, id)).returning();

    // 비활성화된 사용자의 기존 세션 삭제
    if (isActive !== undefined && !isActive) {
      sqlite.prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
    }

    res.json({ data: sanitizeUser(updated), error: null, meta: null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

/**
 * DELETE /:id — 관리자 사용자 비활성화 (소프트 삭제, admin 역할만 가능)
 * - 자기 자신 삭제 불가, 마지막 admin 삭제 불가
 */
router.delete("/:id", adminAuth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ data: null, error: "유효하지 않은 ID 형식입니다", meta: null });
    }

    // 자기 자신 삭제 방지
    if (id === req.adminUser.userId) {
      return res.status(400).json({ data: null, error: "자기 자신을 삭제할 수 없습니다", meta: null });
    }

    const [existing] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    if (!existing) {
      return res.status(404).json({ data: null, error: "사용자를 찾을 수 없습니다", meta: null });
    }

    // 마지막 active admin 삭제 방지
    if (existing.role === "admin" && existing.isActive) {
      const activeAdminCount = sqlite.prepare(
        "SELECT COUNT(*) as cnt FROM admin_users WHERE role = 'admin' AND is_active = 1"
      ).get().cnt;
      if (activeAdminCount <= 1) {
        return res.status(400).json({ data: null, error: "마지막 관리자를 삭제할 수 없습니다", meta: null });
      }
    }

    const [updated] = await db.update(adminUsers).set({
      isActive: 0,
      updatedAt: sql`(datetime('now'))`,
    }).where(eq(adminUsers.id, id)).returning();

    // 비활성화된 사용자의 기존 세션 삭제
    sqlite.prepare("DELETE FROM sessions WHERE user_id = ?").run(id);

    res.json({ data: sanitizeUser(updated), error: null, meta: null });
  } catch (e) {
    console.error(e);
    res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
  }
});

// 기본 관리자 계정 자동 생성 (환경변수 필수)
(async function initDefaultAdmin() {
  try {
    const [existing] = await db.select().from(adminUsers);
    if (!existing) {
      const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;
      if (!initialPassword) {
        console.error("[Auth] ⚠ ADMIN_INITIAL_PASSWORD 환경변수가 설정되지 않았습니다. 기본 관리자 계정을 생성하려면 .env에 ADMIN_INITIAL_PASSWORD를 설정하세요.");
        return;
      }
      if (initialPassword.length < 8) {
        console.error("[Auth] ⚠ ADMIN_INITIAL_PASSWORD는 8자 이상이어야 합니다.");
        return;
      }
      await db.insert(adminUsers).values({
        username: process.env.ADMIN_INITIAL_USERNAME || "admin",
        passwordHash: hashPassword(initialPassword),
        name: "관리자",
        role: "admin",
      });
      console.log("[Auth] 기본 관리자 계정 생성 완료 (최초 로그인 후 비밀번호를 변경해주세요)");
    }
  } catch (e) {
    console.error("[Auth] 기본 관리자 계정 생성 실패:", e.message);
  }
})();

module.exports = router;
