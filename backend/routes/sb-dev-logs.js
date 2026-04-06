/**
 * 개발 이력 API — dev-logs 디렉토리의 마크다운 파일 목록 조회
 * - 관리자 페이지에서 홈페이지 개발 역사를 확인할 수 있도록 제공
 */
const { Router } = require("express");
const fs = require("fs");
const path = require("path");

const router = Router();

const DEV_LOGS_DIR = path.join(__dirname, "..", "..", "dev-logs");

/** GET /api/sb/dev-logs — 개발 이력 목록 */
router.get("/", (req, res) => {
  try {
    if (!fs.existsSync(DEV_LOGS_DIR)) {
      return res.json({ data: [], error: null, meta: { total: 0 } });
    }

    const files = fs.readdirSync(DEV_LOGS_DIR)
      .filter((f) => f.endsWith(".md"))
      .sort()
      .reverse();

    const logs = files.map((filename) => {
      const content = fs.readFileSync(path.join(DEV_LOGS_DIR, filename), "utf-8");
      const firstLine = content.split("\n").find((l) => l.startsWith("# ")) || "";
      const title = firstLine.replace(/^#\s*/, "").trim();

      // 파일명에서 날짜/번호 추출: 2026-04-05_001_제목.md
      const match = filename.match(/^(\d{4}-\d{2}-\d{2})_(\d{3})_(.+)\.md$/);
      const date = match ? match[1] : "";
      const number = match ? match[2] : "";
      const slug = match ? match[3] : filename;

      return { filename, date, number, slug, title };
    });

    res.json({ data: logs, error: null, meta: { total: logs.length } });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

/** GET /api/sb/dev-logs/:filename — 개발 이력 상세 (마크다운 원문) */
router.get("/:filename", (req, res) => {
  try {
    const { filename } = req.params;
    // 경로 조작 방지
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return res.status(400).json({ data: null, error: "잘못된 파일명입니다", meta: null });
    }

    const filePath = path.join(DEV_LOGS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ data: null, error: "파일을 찾을 수 없습니다", meta: null });
    }

    const content = fs.readFileSync(filePath, "utf-8");
    res.json({ data: { filename, content }, error: null, meta: null });
  } catch (e) {
    res.status(500).json({ data: null, error: e.message, meta: null });
  }
});

module.exports = router;
