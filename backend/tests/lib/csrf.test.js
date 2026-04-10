/**
 * lib/csrf.js 단위 테스트
 * - CSRF 미들웨어 동작 검증 (mock req/res/next)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import csrfProtection from "../../lib/csrf.js";

/** Express req 모의 객체 생성 */
function mockReq(overrides = {}) {
  const headers = overrides.headers || {};
  return {
    method: overrides.method || "GET",
    path: overrides.path || "/",
    get: (name) => headers[name] || headers[name.toLowerCase()] || undefined,
    ...overrides,
  };
}

/** Express res 모의 객체 생성 */
function mockRes() {
  const res = {
    statusCode: 200,
    cookies: {},
    body: null,
    status: vi.fn((code) => { res.statusCode = code; return res; }),
    json: vi.fn((data) => { res.body = data; return res; }),
    cookie: vi.fn((name, value, opts) => { res.cookies[name] = { value, opts }; }),
  };
  return res;
}

describe("csrfProtection 미들웨어", () => {
  it("GET 요청 시 csrf-token 쿠키를 설정한다", () => {
    const req = mockReq({ method: "GET" });
    const res = mockRes();
    const next = vi.fn();

    csrfProtection(req, res, next);

    expect(res.cookie).toHaveBeenCalledWith(
      "csrf-token",
      expect.any(String),
      expect.objectContaining({ sameSite: "Strict", path: "/" })
    );
    expect(next).toHaveBeenCalled();
  });

  it("GET 요청 시 이미 csrf-token 쿠키가 있으면 새로 설정하지 않는다", () => {
    const req = mockReq({
      method: "GET",
      headers: { Cookie: "csrf-token=existing-token-value" },
    });
    const res = mockRes();
    const next = vi.fn();

    csrfProtection(req, res, next);

    expect(res.cookie).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
  });

  it("보호된 경로에 토큰 없이 POST하면 403을 반환한다", () => {
    const req = mockReq({
      method: "POST",
      path: "/api/sb/documents",
      headers: {},
    });
    const res = mockRes();
    const next = vi.fn();

    csrfProtection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body.error).toBe("CSRF 토큰이 유효하지 않습니다");
    expect(next).not.toHaveBeenCalled();
  });

  it("보호된 경로에 올바른 토큰을 보내면 통과한다", () => {
    const token = "valid-csrf-token-12345";
    const req = mockReq({
      method: "POST",
      path: "/api/sb/documents",
      headers: {
        Cookie: `csrf-token=${token}`,
        "x-csrf-token": token,
      },
    });
    const res = mockRes();
    const next = vi.fn();

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("쿠키 토큰과 헤더 토큰이 불일치하면 403을 반환한다", () => {
    const req = mockReq({
      method: "POST",
      path: "/api/sb/documents",
      headers: {
        Cookie: "csrf-token=cookie-token",
        "x-csrf-token": "different-header-token",
      },
    });
    const res = mockRes();
    const next = vi.fn();

    csrfProtection(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it("면제 경로(로그인)는 토큰 없이도 통과한다", () => {
    const req = mockReq({
      method: "POST",
      path: "/api/sb/admin-users/login",
      headers: {},
    });
    const res = mockRes();
    const next = vi.fn();

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("면제 경로(상담 신청)는 토큰 없이도 통과한다", () => {
    const req = mockReq({
      method: "POST",
      path: "/api/sb/consultations",
      headers: {},
    });
    const res = mockRes();
    const next = vi.fn();

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("/api/sb/ 이외의 경로는 CSRF 검증을 건너뛴다", () => {
    const req = mockReq({
      method: "POST",
      path: "/other/endpoint",
      headers: {},
    });
    const res = mockRes();
    const next = vi.fn();

    csrfProtection(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
