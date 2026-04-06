/**
 * Express 서버 진입점
 * - API 라우트 등록, 정적 파일 서빙, 글로벌 에러 핸들러
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const compression = require("compression");

const app = express();
const PORT = process.env.PORT || 5000;

// 보안 헤더 설정
app.use(helmet({
  contentSecurityPolicy: false, // SPA에서 인라인 스크립트 허용
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

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : undefined,
}));
app.use(compression());
app.use(express.json({ limit: "10mb" }));

// 업로드된 파일 정적 서빙 (STORAGE_PATH 환경변수로 외부 스토리지 지정 가능)
const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, "data");
app.use("/uploads", express.static(path.join(STORAGE_PATH, "uploads")));
app.use("/data/files", express.static(path.join(STORAGE_PATH, "files")));

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

// 글로벌 에러 핸들러
app.use((err, req, res, next) => {
  console.error("[Error]", err.message || err);
  res.status(err.status || 500).json({ data: null, error: err.message || "Internal Server Error", meta: null });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  require("./lib/scheduler").startScheduler();
});
