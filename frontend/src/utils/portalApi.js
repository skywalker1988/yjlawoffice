/** Portal API 통신 래퍼 -- x-portal-token + CSRF 토큰 헤더 자동 첨부 */

/** document.cookie에서 특정 쿠키 값을 읽는다 */
function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * 포털 API 요청을 보내는 범용 함수
 * @param {"GET"|"POST"|"PATCH"|"DELETE"} method - HTTP 메서드
 * @param {string} path - /api/sb/portal 뒤에 붙는 경로 (예: "/login")
 * @param {object} [body] - POST/PATCH 요청 시 전송할 JSON 바디
 * @returns {Promise<object>} 파싱된 JSON 응답
 */
export async function portalFetch(method, path, body) {
  const headers = {
    "Content-Type": "application/json",
    "x-portal-token": sessionStorage.getItem("portal_token") || "",
  };
  const csrf = getCookie("csrf-token");
  if (csrf) headers["x-csrf-token"] = csrf;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`/api/sb/portal${path}`, opts);
  } catch {
    throw new Error("네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.");
  }
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "요청 실패");
  return json;
}

/** 메서드별 단축 함수 */
export const portalApi = {
  get: (path) => portalFetch("GET", path),
  post: (path, body) => portalFetch("POST", path, body),
  patch: (path, body) => portalFetch("PATCH", path, body),
};
