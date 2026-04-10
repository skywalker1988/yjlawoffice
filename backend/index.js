/**
 * Express 서버 진입점
 * - API 라우트 등록, 정적 파일 서빙, 글로벌 에러 핸들러
 */
require("dotenv").config();

// 환경변수 검증 — 필수 변수 누락 시 경고
function validateEnv() {
  const warnings = [];
  if (!process.env.ALLOWED_ORIGINS) warnings.push("ALLOWED_ORIGINS 미설정 — CORS 제한 없이 운영됩니다");
  if (!process.env.APPS_SCRIPT_WEBHOOK_URL) warnings.push("APPS_SCRIPT_WEBHOOK_URL 미설정 — 상담 알림이 발송되지 않습니다");
  warnings.forEach(w => console.warn(`[ENV WARNING] ${w}`));
}
validateEnv();

const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const compression = require("compression");

const app = express();
const PORT = process.env.PORT || 5000;

// 보안 헤더 설정 (CSP 활성화)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"], // SPA 인라인 스크립트 + Swagger UI CDN
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "blob:", "https:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
      connectSrc: ["'self'", "https://script.google.com"],
      mediaSrc: ["'self'", "blob:", "data:"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// API 요청 속도 제한
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 200, // IP당 최대 200요청
  standardHeaders: true,
  legacyHeaders: false,
  message: { data: null, error: "너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.", meta: null },
});
app.use("/api/", apiLimiter);

// 로그인 전용 속도 제한 (브루트포스 방지)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 10, // IP당 최대 10회 로그인 시도
  standardHeaders: true,
  legacyHeaders: false,
  message: { data: null, error: "로그인 시도 횟수를 초과했습니다. 15분 후 다시 시도해주세요.", meta: null },
});
app.use("/api/sb/admin-users/login", loginLimiter);
app.use("/api/sb/portal/login", loginLimiter);

// 상담 신청 전용 속도 제한 (더 엄격)
const consultationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 10, // IP당 최대 10요청
  message: { data: null, error: "상담 신청 횟수를 초과했습니다. 1시간 후 다시 시도해주세요.", meta: null },
});
app.use("/api/sb/consultations", consultationLimiter);

// 메시지 발송 전용 속도 제한
const messageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1시간
  max: 50, // 시간당 최대 50건 발송
  message: { data: null, error: "메시지 발송 횟수를 초과했습니다. 1시간 후 다시 시도해주세요.", meta: null },
});
app.use("/api/sb/messages/send", messageLimiter);

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(o => o.trim())
  : null;
if (!allowedOrigins && process.env.NODE_ENV === "production") {
  console.error("[보안 경고] ALLOWED_ORIGINS가 설정되지 않아 모든 출처의 요청이 허용됩니다. 프로덕션에서는 반드시 설정하세요.");
}
app.use(cors({
  origin: allowedOrigins || true,
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: "10mb" }));

// CSRF 보호 미들웨어 (더블 서브밋 쿠키 패턴)
app.use(require("./lib/csrf"));

// 업로드된 파일 정적 서빙 (STORAGE_PATH 환경변수로 외부 스토리지 지정 가능)
// HTML/SVG 파일은 Content-Disposition: attachment로 강제 다운로드하여 Stored XSS 방지
const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, "data");
const staticOptions = {
  setHeaders(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if ([".html", ".htm", ".svg", ".xml"].includes(ext)) {
      res.setHeader("Content-Disposition", "attachment");
      res.setHeader("Content-Type", "application/octet-stream");
    }
    // 모든 업로드 파일에 X-Content-Type-Options 적용
    res.setHeader("X-Content-Type-Options", "nosniff");
  },
};
app.use("/uploads", express.static(path.join(STORAGE_PATH, "uploads"), staticOptions));
app.use("/data/files", express.static(path.join(STORAGE_PATH, "files"), staticOptions));

// 페이지뷰 분석 미들웨어 (라우트 등록 전에 적용)
app.use(require("./lib/analytics-middleware"));

// ===== Second Brain API =====
app.use("/api/sb/documents", require("./routes/sb-documents"));
app.use("/api/sb/categories", require("./routes/sb-categories"));
app.use("/api/sb/collections", require("./routes/sb-collections"));
app.use("/api/sb/dashboard", require("./routes/sb-dashboard"));

app.use("/api/sb/hero-videos", require("./routes/sb-hero-videos"));
app.use("/api/sb/lawyers", require("./routes/sb-lawyers"));
app.use("/api/sb/consultations", require("./routes/sb-consultations"));
app.use("/api/sb/blog", require("./routes/sb-blog"));
app.use("/api/sb/cases", require("./routes/sb-cases"));
app.use("/api/sb/clients", require("./routes/sb-clients"));
app.use("/api/sb/messages", require("./routes/sb-messages"));
app.use("/api/sb/site-settings", require("./routes/sb-site-settings"));
app.use("/api/sb/announcements", require("./routes/sb-announcements"));
app.use("/api/sb/media", require("./routes/sb-media"));
app.use("/api/sb/admin-users", require("./routes/sb-admin-users"));
app.use("/api/sb/analytics", require("./routes/sb-analytics"));
app.use("/api/sb/dev-logs", require("./routes/sb-dev-logs"));

app.use("/api/sb/reviews", require("./routes/sb-reviews"));
app.use("/api/sb/newsletter", require("./routes/sb-newsletter"));
app.use("/api/sb/bookings", require("./routes/sb-bookings"));
app.use("/api/sb/chatbot", require("./routes/sb-chatbot"));
app.use("/api/sb/portal", require("./routes/sb-portal"));
app.use("/api/sb/sitemap", require("./routes/sb-sitemap"));
app.use("/sitemap.xml", (req, res) => res.redirect("/api/sb/sitemap"));

// API 문서 (Swagger UI + OpenAPI 스펙)
app.use("/api/docs", require("./routes/sb-docs"));

// 프론트엔드 정적 파일 서빙 (프로덕션)
const frontendDist = path.resolve(__dirname, "..", "frontend", "dist").replace(/\\/g, "/");
const fs = require("fs");
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // SPA 폴백 — API가 아닌 모든 GET 요청에 index.html 반환 (Express 5 호환)
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api/") || req.path.startsWith("/uploads/") || req.path.startsWith("/data/")) return next();
    // 정적 파일 요청이면 스킵 (확장자가 있는 경우)
    if (path.extname(req.path)) return next();
    res.sendFile(path.join(frontendDist, "index.html"));
  });
  console.log("[Static] 프론트엔드 정적 파일 서빙:", frontendDist);
}

// 글로벌 에러 핸들러 (클라이언트에 민감 정보 노출 방지)
app.use((err, req, res, next) => {
  console.error("[Error]", err.stack || err.message || err);
  const statusCode = err.status || 500;
  // 프로덕션에서는 500 에러의 상세 메시지를 숨김
  const clientMessage = statusCode >= 500
    ? "서버 내부 오류가 발생했습니다"
    : (err.message || "요청 처리 중 오류가 발생했습니다");
  res.status(statusCode).json({ data: null, error: clientMessage, meta: null });
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  require("./lib/scheduler").startScheduler();
});

// 그레이스풀 셧다운 — 진행 중인 요청 완료 후 종료
function gracefulShutdown(signal) {
  console.log(`[${signal}] 서버 종료 시작...`);
  server.close(() => {
    console.log("[Server] 정상 종료 완료");
    process.exit(0);
  });
  // 10초 내 종료되지 않으면 강제 종료
  setTimeout(() => {
    console.error("[Server] 강제 종료");
    process.exit(1);
  }, 10000);
}
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
