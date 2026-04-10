/**
 * lib/auth.js 단위 테스트
 * - 비밀번호 해싱/검증 라운드트립
 * - 세션 생성/조회/삭제/만료
 */
import { describe, it, expect, vi } from "vitest";

// auth.js가 require("../db") 시 인메모리 DB를 사용하도록 모킹
vi.mock("../../db", async () => {
  const Database = (await import("better-sqlite3")).default;
  const db = new Database(":memory:");
  return { sqlite: db };
});

// auth 모듈을 동적 임포트 (모듈 로드 시 sessions 테이블 생성됨)
const {
  hashPassword,
  verifyPassword,
  createSession,
  getSession,
  deleteSession,
  SESSION_TTL_MS,
} = await import("../../lib/auth.js");

describe("hashPassword + verifyPassword", () => {
  it("해싱된 비밀번호를 올바르게 검증한다", () => {
    const hashed = hashPassword("myPassword123");
    expect(verifyPassword("myPassword123", hashed)).toBe(true);
  });

  it("잘못된 비밀번호는 검증 실패한다", () => {
    const hashed = hashPassword("myPassword123");
    expect(verifyPassword("wrongPassword", hashed)).toBe(false);
  });

  it("같은 비밀번호라도 매번 다른 해시를 생성한다 (salt 랜덤)", () => {
    const hash1 = hashPassword("same");
    const hash2 = hashPassword("same");
    expect(hash1).not.toBe(hash2);
  });

  it("해시 형식이 salt:hash 구조이다", () => {
    const hashed = hashPassword("test");
    const parts = hashed.split(":");
    expect(parts).toHaveLength(2);
    expect(parts[0].length).toBe(32);
    expect(parts[1].length).toBe(128);
  });
});

describe("createSession + getSession", () => {
  it("세션을 생성하고 조회할 수 있다", () => {
    const token = createSession("user-1", "admin");
    const session = getSession(token);

    expect(session).not.toBeNull();
    expect(session.userId).toBe("user-1");
    expect(session.role).toBe("admin");
    expect(session.createdAt).toBeDefined();
  });

  it("존재하지 않는 토큰은 null을 반환한다", () => {
    const session = getSession("nonexistent-token");
    expect(session).toBeNull();
  });
});

describe("getSession — 만료 처리", () => {
  it("만료된 세션은 null을 반환한다", () => {
    // 세션 생성 후, Date.now를 미래로 이동시켜 만료를 시뮬레이션
    const token = createSession("user-expired", "admin");

    // 세션이 정상적으로 존재하는지 확인
    expect(getSession(token)).not.toBeNull();

    // Date.now를 TTL 이후로 이동
    const realDateNow = Date.now;
    Date.now = () => realDateNow() + SESSION_TTL_MS + 1000;

    const session = getSession(token);
    expect(session).toBeNull();

    // Date.now 복원
    Date.now = realDateNow;
  });
});

describe("deleteSession", () => {
  it("삭제된 세션은 null을 반환한다", () => {
    const token = createSession("user-2", "admin");
    expect(getSession(token)).not.toBeNull();

    deleteSession(token);
    expect(getSession(token)).toBeNull();
  });
});
