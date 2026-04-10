/**
 * 상담 신청 API 라우트 — 상담 CRUD (공개 생성 + 관리자 조회/수정/삭제)
 * - 비즈니스 로직은 services/consultation-service.js에 위임
 */
const { Router } = require("express");
const { adminAuth } = require("../lib/auth");
const consultationService = require("../services/consultation-service");

const router = Router();

/**
 * POST /api/sb/consultations — 상담 신청 생성 (공개)
 */
router.post("/", async (req, res) => {
  try {
    const inserted = await consultationService.createConsultation(req.body);
    res.json({ data: inserted, error: null, meta: null });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ data: null, error: e.message || "서버 내부 오류가 발생했습니다", meta: null });
  }
});

/**
 * GET /api/sb/consultations — 상담 목록 조회 (관리자)
 */
router.get("/", adminAuth, async (req, res) => {
  try {
    const result = await consultationService.listConsultations(req.query);
    res.json({ data: result.items, error: null, meta: result.meta });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ data: null, error: e.message || "서버 내부 오류가 발생했습니다", meta: null });
  }
});

/**
 * PATCH /api/sb/consultations/:id — 상담 상태/메모 수정 (관리자)
 */
router.patch("/:id", adminAuth, async (req, res) => {
  try {
    const updated = await consultationService.updateConsultation(req.params.id, req.body);
    res.json({ data: updated, error: null, meta: null });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ data: null, error: e.message || "서버 내부 오류가 발생했습니다", meta: null });
  }
});

/**
 * DELETE /api/sb/consultations/:id — 상담 삭제 (관리자)
 */
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    const result = await consultationService.deleteConsultation(req.params.id);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    console.error(e);
    res.status(e.status || 500).json({ data: null, error: e.message || "서버 내부 오류가 발생했습니다", meta: null });
  }
});

module.exports = router;
