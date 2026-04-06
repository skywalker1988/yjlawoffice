/**
 * 인증 유틸리티 — 비밀번호 해싱, 세션 관리
 * - Node.js 내장 crypto 모듈 사용 (bcrypt 불필요)
 * - 인메모리 세션 스토어 (서버 재시작 시 초기화)
 */
const crypto = require("crypto");

/**
 * 평문 비밀번호를 salt:hash 형태로 해싱
 * @param {string} plain - 평문 비밀번호
 * @returns {string} "salt:hash" 형식 문자열
 */
function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(plain, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * 저장된 해시와 평문 비밀번호 비교
 * @param {string} plain - 평문 비밀번호
 * @param {string} stored - "salt:hash" 형식 저장값
 * @returns {boolean}
 */
function verifyPassword(plain, stored) {
  const [salt, hash] = stored.split(":");
  const verify = crypto.scryptSync(plain, salt, 64).toString("hex");
  return hash === verify;
}

/** 랜덤 토큰 생성 (32바이트 hex) */
function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

// 인메모리 세션 스토어 (서버 재시작 시 초기화)
const sessions = new Map();

/**
 * 세션 생성
 * @param {string} userId - 사용자 ID
 * @param {string} role - 사용자 역할
 * @returns {string} 세션 토큰
 */
function createSession(userId, role) {
  const token = generateToken();
  sessions.set(token, { userId, role, createdAt: Date.now() });
  return token;
}

/**
 * 세션 조회
 * @param {string} token - 세션 토큰
 * @returns {{ userId: string, role: string, createdAt: number } | null}
 */
function getSession(token) {
  return sessions.get(token) || null;
}

/** 세션 삭제 */
function deleteSession(token) {
  sessions.delete(token);
}

module.exports = { hashPassword, verifyPassword, generateToken, createSession, getSession, deleteSession };
