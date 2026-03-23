/**
 * Express 서버 진입점
 * - API 라우트 등록, 정적 파일 서빙, 글로벌 에러 핸들러
 */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// 업로드된 파일 정적 서빙 (STORAGE_PATH 환경변수로 외부 스토리지 지정 가능)
const STORAGE_PATH = process.env.STORAGE_PATH || path.join(__dirname, "data");
app.use("/uploads", express.static(path.join(STORAGE_PATH, "uploads")));
app.use("/data/files", express.static(path.join(STORAGE_PATH, "files")));

// ===== Second Brain API =====
app.use("/api/sb/documents", require("./routes/sb-documents"));
app.use("/api/sb/tags", require("./routes/sb-tags"));
app.use("/api/sb/categories", require("./routes/sb-categories"));
app.use("/api/sb/collections", require("./routes/sb-collections"));
app.use("/api/sb/dashboard", require("./routes/sb-dashboard"));
app.use("/api/sb/history", require("./routes/sb-history"));

// 글로벌 에러 핸들러
app.use((err, req, res, next) => {
  console.error("[Error]", err.message || err);
  res.status(err.status || 500).json({ data: null, error: err.message || "Internal Server Error", meta: null });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
