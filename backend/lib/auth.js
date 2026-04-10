/**
 * 인증 유틸리티 — 비밀번호 해싱, 세션 관리 (SQLite 영속화, TTL 적용)
 * - Node.js 내장 crypto 모듈 사용 (bcrypt 불필요)
 * - SQLite 세션 스토어 (서버 재시작 후에도 세션 유지)
 * - 세션 TTL: 24시간 (만료 후 자동 삭제)
 */
const crypto = require("crypto");
const { sqlite } = require("../db");

/** 세션 만료 시간 (24시간, 밀리초) */
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/** 세션 정리 주기 (1시간, 밀리초) */
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;

// SQLite 세션 테이블 생성 (관리자)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )
`);

// SQLite 포털 세션 테이블 생성 (의뢰인)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS portal_sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    email TEXT NOT NULL,
    client_id TEXT,
    created_at INTEGER NOT NULL
  )
`);

/**
 * 평문 비밀번호를 salt:hash 형태로 해싱
 * @param {string} plain - 평문 비밀번호
 * @returns {string} "salt:hash" 형식 문자열
 */
function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(plain, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * 저장된 해시와 평문 비밀번호 비교
 * @param {string} plain - 평문 비밀번호
 * @param {string} stored - "salt:hash" 형식 저장값
 * @returns {boolean}
 */
function verifyPassword(plain, stored) {
  const [salt, hash] = stored.split(":");
  const verify = crypto.scryptSync(plain, salt, 64).toString("hex");
  // 타이밍 공격 방지를 위해 timingSafeEqual 사용
  if (hash.length !== verify.length) return false;
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(verify, "hex"));
}

/** 랜덤 토큰 생성 (32바이트 hex) */
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

// Prepared statements (성능 최적화)
const insertSessionStmt = sqlite.prepare(
  "INSERT INTO sessions (token, user_id, role, created_at) VALUES (?, ?, ?, ?)"
);
const selectSessionStmt = sqlite.prepare(
  "SELECT user_id, role, created_at FROM sessions WHERE token = ?"
);
const deleteSessionStmt = sqlite.prepare(
  "DELETE FROM sessions WHERE token = ?"
);
const cleanupSessionsStmt = sqlite.prepare(
  "DELETE FROM sessions WHERE created_at < ?"
);

/**
 * 세션 생성 (SQLite에 저장)
 * @param {string} userId - 사용자 ID
 * @param {string} role - 사용자 역할
 * @returns {string} 세션 토큰
 */
function createSession(userId, role) {
  const token = generateToken();
  insertSessionStmt.run(token, userId, role, Date.now());
  return token;
}

/**
 * 세션 조회 (만료 검사 포함)
 * @param {string} token - 세션 토큰
 * @returns {{ userId: string, role: string, createdAt: number } | null}
 */
function getSession(token) {
  const row = selectSessionStmt.get(token);
  if (!row) return null;

  // 만료된 세션 자동 삭제
  if (Date.now() - row.created_at > SESSION_TTL_MS) {
    deleteSessionStmt.run(token);
    return null;
  }

  return { userId: row.user_id, role: row.role, createdAt: row.created_at };
}

/** 세션 삭제 */
function deleteSession(token) {
  deleteSessionStmt.run(token);
}

/** 허용되는 관리자 역할 */
const VALID_ROLES = ["admin", "editor"];

/**
 * 관리자 인증 미들웨어 — Bearer 토큰으로 세션 검증
 * 모든 관리자 전용 API에 적용
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
 * 역할 기반 접근 제어 미들웨어 팩토리
 * adminAuth 다음에 체이닝하여 사용
 * @param {...string} roles - 허용할 역할 목록
 * @returns {Function} Express 미들웨어
 * @example router.post("/", adminAuth, requireRole("admin"), handler)
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.adminUser || !roles.includes(req.adminUser.role)) {
      return res.status(403).json({ data: null, error: "권한이 없습니다", meta: null });
    }
    next();
  };
}

// =============================================
// 포털 세션 관리 (SQLite 영속화)
// =============================================

const insertPortalSessionStmt = sqlite.prepare(
  "INSERT INTO portal_sessions (token, user_id, email, client_id, created_at) VALUES (?, ?, ?, ?, ?)"
);
const selectPortalSessionStmt = sqlite.prepare(
  "SELECT user_id, email, client_id, created_at FROM portal_sessions WHERE token = ?"
);
const deletePortalSessionStmt = sqlite.prepare(
  "DELETE FROM portal_sessions WHERE token = ?"
);
const cleanupPortalSessionsStmt = sqlite.prepare(
  "DELETE FROM portal_sessions WHERE created_at < ?"
);

/**
 * 포털 세션 생성 (SQLite에 저장)
 * @param {string} userId
 * @param {string} email
 * @param {string|null} clientId
 * @returns {string} 세션 토큰
 */
function createPortalSession(userId, email, clientId) {
  const token = generateToken();
  insertPortalSessionStmt.run(token, userId, email, clientId || null, Date.now());
  return token;
}

/**
 * 포털 세션 조회 (만료 검사 포함)
 * @param {string} token
 * @returns {{ userId: string, email: string, clientId: string|null, createdAt: number } | null}
 */
function getPortalSession(token) {
  if (!token) return null;
  const row = selectPortalSessionStmt.get(token);
  if (!row) return null;

  if (Date.now() - row.created_at > SESSION_TTL_MS) {
    deletePortalSessionStmt.run(token);
    return null;
  }

  return {
    userId: row.user_id,
    email: row.email,
    clientId: row.client_id,
    createdAt: row.created_at,
  };
}

/**
 * 포털 세션 삭제
 * @param {string} token
 */
function deletePortalSession(token) {
  deletePortalSessionStmt.run(token);
}

/**
 * 포털 인증 미들웨어 — x-portal-token 헤더로 세션 검증
 */
function portalAuth(req, res, next) {
  const token = req.headers["x-portal-token"];
  const session = getPortalSession(token);
  if (!session) {
    return res.status(401).json({ data: null, error: "인증이 필요합니다", meta: null });
  }
  req.portalUser = session;
  next();
}

// 만료된 세션 주기적 정리 (1시간마다, 관리자 + 포털 모두)
// unref()로 프로세스 종료를 방해하지 않도록 설정
setInterval(() => {
  const expiryThreshold = Date.now() - SESSION_TTL_MS;
  cleanupSessionsStmt.run(expiryThreshold);
  cleanupPortalSessionsStmt.run(expiryThreshold);
}, CLEANUP_INTERVAL_MS).unref();

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  createSession,
  getSession,
  deleteSession,
  adminAuth,
  requireRole,
  VALID_ROLES,
  createPortalSession,
  getPortalSession,
  deletePortalSession,
  portalAuth,
  SESSION_TTL_MS,
};
