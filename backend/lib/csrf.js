/**
 * CSRF 보호 미들웨어 — HMAC 서명 기반 더블 서브밋 쿠키 패턴
 * - GET 요청: HMAC 서명된 csrf-token 쿠키를 설정
 * - POST/PATCH/DELETE 요청: x-csrf-token 헤더의 서명을 서버 시크릿으로 검증
 * - 공개 엔드포인트(로그인, 회원가입, 상담 신청 등)는 검증 제외
 */
const crypto = require("crypto");

/** CSRF 서명용 서버 시크릿 (서버 재시작 시 갱신 — 기존 토큰 무효화됨) */
const CSRF_SECRET = process.env.CSRF_SECRET || crypto.randomBytes(32).toString("hex");

/** CSRF 검증을 건너뛸 공개 엔드포인트 목록 (method + path) */
const CSRF_EXEMPT_ROUTES = [
  { method: "POST", path: "/api/sb/admin-users/login" },
  { method: "POST", path: "/api/sb/portal/login" },
  { method: "POST", path: "/api/sb/portal/register" },
  { method: "POST", path: "/api/sb/consultations" },
  { method: "POST", path: "/api/sb/newsletter/subscribe" },
  { method: "POST", path: "/api/sb/bookings" },
  { method: "POST", path: "/api/sb/reviews" },
];

/**
 * 요청이 CSRF 검증 면제 대상인지 확인
 * @param {string} method - HTTP 메서드
 * @param {string} reqPath - 요청 경로
 * @returns {boolean}
 */
function isExempt(method, reqPath) {
  return CSRF_EXEMPT_ROUTES.some(
    (route) => route.method === method && reqPath === route.path
  );
}

/**
 * 쿠키 헤더에서 특정 쿠키 값을 파싱
 * @param {string} cookieHeader - Cookie 헤더 문자열
 * @param {string} name - 쿠키 이름
 * @returns {string|null}
 */
function parseCookie(cookieHeader, name) {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * HMAC 서명된 CSRF 토큰 생성
 * 형식: nonce.signature (nonce = 32바이트 hex, signature = HMAC-SHA256)
 * @returns {string}
 */
function createCsrfToken() {
  const nonce = crypto.randomBytes(32).toString("hex");
  const signature = crypto.createHmac("sha256", CSRF_SECRET).update(nonce).digest("hex");
  return `${nonce}.${signature}`;
}

/**
 * CSRF 토큰의 HMAC 서명을 검증 (타이밍 공격 방지)
 * @param {string} token - "nonce.signature" 형식
 * @returns {boolean}
 */
function verifyCsrfToken(token) {
  if (!token || !token.includes(".")) return false;
  const [nonce, signature] = token.split(".");
  if (!nonce || !signature) return false;
  const expected = crypto.createHmac("sha256", CSRF_SECRET).update(nonce).digest("hex");
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
}

/**
 * CSRF 보호 미들웨어
 * Express 미들웨어로 사용: app.use(csrfProtection)
 */
function csrfProtection(req, res, next) {
  // GET/HEAD/OPTIONS 요청: HMAC 서명된 csrf-token 쿠키 설정
  if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
    const existing = parseCookie(req.get("Cookie"), "csrf-token");
    // 기존 토큰이 없거나 서명이 유효하지 않으면 새로 발급
    if (!existing || !verifyCsrfToken(existing)) {
      res.cookie("csrf-token", createCsrfToken(), {
        httpOnly: false, // 프론트엔드 JS에서 읽어야 하므로 httpOnly 비활성화
        sameSite: "Strict",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }
    return next();
  }

  // POST/PATCH/DELETE 등 상태 변경 요청: /api/sb/ 경로만 검증
  if (!req.path.startsWith("/api/sb/")) {
    return next();
  }

  // 공개 엔드포인트는 CSRF 검증 면제
  if (isExempt(req.method, req.path)) {
    return next();
  }

  const headerToken = req.get("x-csrf-token");

  if (!headerToken || !verifyCsrfToken(headerToken)) {
    return res.status(403).json({
      data: null,
      error: "CSRF 토큰이 유효하지 않습니다",
      meta: null,
    });
  }

  next();
}

module.exports = csrfProtection;
