/**
 * 고객 관리 API 라우트 — 고객 CRUD
 * - 비즈니스 로직은 services/client-service.js에 위임
 */
const { Router } = require("express");
const { adminAuth } = require("../lib/auth");
const clientService = require("../services/client-service");

const router = Router();

/**
 * GET /api/sb/clients — 고객 목록 조회
 */
router.get("/", adminAuth, async (req, res) => {
  try {
    const result = await clientService.listClients(req.query);
    res.json({ data: result.items, error: null, meta: result.meta });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ data: null, error: e.message || "서버 내부 오류가 발생했습니다", meta: null });
  }
});

/**
 * POST /api/sb/clients — 고객 등록
 */
router.post("/", adminAuth, async (req, res) => {
  try {
    const inserted = await clientService.createClient(req.body);
    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ data: null, error: e.message || "서버 내부 오류가 발생했습니다", meta: null });
  }
});

/**
 * PATCH /api/sb/clients/:id — 고객 정보 수정
 */
router.patch("/:id", adminAuth, async (req, res) => {
  try {
    const updated = await clientService.updateClient(req.params.id, req.body);
    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ data: null, error: e.message || "서버 내부 오류가 발생했습니다", meta: null });
  }
});

/**
 * DELETE /api/sb/clients/:id — 고객 삭제
 */
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const result = await clientService.deleteClient(req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ data: null, error: e.message || "서버 내부 오류가 발생했습니다", meta: null });
  }
});

module.exports = router;
