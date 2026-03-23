/**
 * 공통 포맷팅 유틸리티 함수
 * - 저자명 파싱, 날짜 포맷 등 여러 페이지에서 공통으로 사용하는 변환 로직
 */

/**
 * 다양한 형태의 저자 데이터를 문자열로 변환한다.
 * 백엔드에서 저자가 문자열, 배열, 또는 JSON 문자열로 올 수 있기 때문에 통일 처리가 필요하다.
 * @param {string|string[]|null} author - 저자 데이터
 * @returns {string} 포맷된 저자명
 */
export function parseAuthor(author) {
  if (!author) return "";
  if (typeof author === "string") return author;
  if (Array.isArray(author)) return author.join(", ");
  return String(author);
}
