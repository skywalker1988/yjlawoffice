/**
 * 페이지 방문 로깅 미들웨어
 * - 공개 페이지 요청만 기록 (API, 관리자, 정적 파일 제외)
 * - IP + User-Agent + 날짜 기반 세션 ID 생성 (고유 방문자 카운팅용)
 */
const { sqlite } = require("../db");
const crypto = require("crypto");

const insertStmt = sqlite.prepare(
  "INSERT INTO page_views (id, page, path, referrer, user_agent, ip, session_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))"
);

/**
 * 경로에서 페이지 이름 추출
 * @param {string} path - URL 경로
 * @returns {string} 페이지 이름
 */
function getPageName(path) {
  if (path === "/") return "home";
  const segment = path.split("/")[1];
  return segment || "home";
}

/**
 * IP + UA + 날짜 조합으로 세션 ID 생성 (일별 고유 방문자 식별)
 * @param {string} ip
 * @param {string} ua - User-Agent
 * @returns {string} 16자리 해시
 */
function getSessionId(ip, ua) {
  const date = new Date().toISOString().slice(0, 10);
  return crypto.createHash("sha256").update(`${ip}:${ua}:${date}`).digest("hex").slice(0, 16);
}

/**
 * Express 미들웨어 — 페이지 방문 기록
 * - API, 관리자, 정적 파일, 업로드 경로는 제외
 * - 에러 발생 시 무시 (요청 처리를 차단하지 않음)
 */
module.exports = function analyticsMiddleware(req, res, next) {
  const path = req.path;

  // API, 관리자, 정적 파일, 업로드 경로는 기록하지 않음
  if (path.startsWith("/api/") || path.startsWith("/admin") || path.includes(".") || path.startsWith("/uploads")) {
    return next();
  }

  try {
    const ip = req.ip || req.connection?.remoteAddress || "";
    const ua = req.get("user-agent") || "";
    const referrer = req.get("referrer") || "";
    const sessionId = getSessionId(ip, ua);
    const page = getPageName(path);

    insertStmt.run(crypto.randomUUID(), page, path, referrer, ua, ip, sessionId);
  } catch (err) {
    // 분석 로깅 실패는 요청 처리를 차단하지 않음
  }

  next();
};
