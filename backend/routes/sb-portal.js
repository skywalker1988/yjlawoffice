/**
 * 의뢰인 포털 API 라우트 — 회원가입/로그인(공개) + 사건 조회/메시지(인증) + 사건 관리(관리자)
 * 비즈니스 로직은 services/portal-service.js에 위임한다.
 */
const { Router } = require("express");
const { portalAuth, adminAuth } = require("../lib/auth");
const portalService = require("../services/portal-service");

const router = Router();

/**
 * 서비스 에러를 HTTP 응답으로 변환하는 헬퍼
 * - ServiceError: e.status 코드로 응답
 * - 그 외: 500 내부 오류
 */
function handleError(res, e) {
  if (e.name === "ServiceError") {
    return res.status(e.status).json({ data: null, error: e.message, meta: null });
  }
  console.error(e);
  res.status(500).json({ data: null, error: "서버 내부 오류가 발생했습니다", meta: null });
}

// =============================================
// 공개 엔드포인트 (인증 불필요)
// =============================================

/** POST /api/sb/portal/register — 포털 회원가입 */
router.post("/register", async (req, res) => {
  try {
    const result = await portalService.registerUser(req.body);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /api/sb/portal/login — 포털 로그인 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await portalService.loginUser(email, password);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /api/sb/portal/logout — 로그아웃 (인증된 사용자만) */
router.post("/logout", portalAuth, (req, res) => {
  portalService.logoutUser(req.headers["x-portal-token"]);
  res.json({ data: { message: "로그아웃 되었습니다" }, error: null, meta: null });
});

// =============================================
// 인증 필요 엔드포인트 (portalAuth 미들웨어)
// =============================================

/** GET /api/sb/portal/me — 현재 사용자 정보 */
router.get("/me", portalAuth, async (req, res) => {
  try {
    const { userId, clientId } = req.portalUser;
    const result = await portalService.getUserProfile(userId, clientId);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** GET /api/sb/portal/cases — 내 사건 목록 */
router.get("/cases", portalAuth, async (req, res) => {
  try {
    const rows = await portalService.getUserCases(req.portalUser.clientId);
    res.json({ data: rows, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** GET /api/sb/portal/cases/:id — 사건 상세 (문서 + 최근 메시지) */
router.get("/cases/:id", portalAuth, async (req, res) => {
  try {
    const result = await portalService.getCaseDetail(req.params.id, req.portalUser.clientId);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** GET /api/sb/portal/cases/:id/messages — 사건 메시지 목록 (페이지네이션) */
router.get("/cases/:id/messages", portalAuth, async (req, res) => {
  try {
    const { data, meta } = await portalService.getCaseMessages(
      req.params.id,
      req.portalUser.clientId,
      req.query,
    );
    res.json({ data, error: null, meta });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /api/sb/portal/cases/:id/messages — 의뢰인 메시지 전송 */
router.post("/cases/:id/messages", portalAuth, async (req, res) => {
  try {
    const { clientId, userId } = req.portalUser;
    const result = await portalService.sendClientMessage(
      req.params.id,
      clientId,
      userId,
      req.body.content,
    );
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

// =============================================
// 관리자 엔드포인트
// =============================================

/** GET /api/sb/portal/admin/cases — 전체 사건 목록 (관리자) */
router.get("/admin/cases", adminAuth, async (req, res) => {
  try {
    const { data, meta } = await portalService.listAdminCases(req.query);
    res.json({ data, error: null, meta });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /api/sb/portal/admin/cases — 사건 생성 (관리자) */
router.post("/admin/cases", adminAuth, async (req, res) => {
  try {
    const result = await portalService.createAdminCase(req.body);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** PATCH /api/sb/portal/admin/cases/:id — 사건 수정 (관리자) */
router.patch("/admin/cases/:id", adminAuth, async (req, res) => {
  try {
    const result = await portalService.updateAdminCase(req.params.id, req.body);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

/** POST /api/sb/portal/admin/cases/:id/messages — 변호사 메시지 전송 (관리자) */
router.post("/admin/cases/:id/messages", adminAuth, async (req, res) => {
  try {
    const result = await portalService.sendLawyerMessage(req.params.id, req.body.content);
    res.json({ data: result, error: null, meta: null });
  } catch (e) {
    handleError(res, e);
  }
});

module.exports = router;
