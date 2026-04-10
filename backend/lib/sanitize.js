/**
 * 입력 값 sanitize 유틸리티
 */

/**
 * SQL LIKE 쿼리에 사용할 문자열에서 와일드카드 문자를 이스케이프
 * - `%` → `\%`, `_` → `\_`
 * @param {string} str - 사용자 입력 문자열
 * @returns {string} 이스케이프된 문자열
 */
function escapeLike(str) {
  if (!str) return str;
  return str.replace(/[%_\\]/g, "\\$&");
}

module.exports = { escapeLike };
