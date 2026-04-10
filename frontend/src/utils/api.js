/** API 통신 래퍼 — fetch 기반 REST 클라이언트 (GET/POST/PATCH/DELETE/upload) */
const API_BASE = "/api/sb";

/**
 * document.cookie에서 특정 쿠키 값을 읽는다.
 * @param {string} name - 쿠키 이름
 * @returns {string|null} 쿠키 값 또는 null
 */
function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * API 요청을 보내고 JSON 응답을 반환한다. 인증/CSRF 헤더 자동 포함.
 * @param {"GET"|"POST"|"PATCH"|"PUT"|"DELETE"} method - HTTP 메서드
 * @param {string} path - API_BASE 뒤에 붙는 경로 (예: "/documents")
 * @param {object} [body] - POST/PATCH/PUT 시 전송할 JSON 바디
 * @returns {Promise<object>} 파싱된 JSON 응답
 * @throws {Error} 네트워크 오류 또는 HTTP 오류 시
 */
async function request(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };

  // 관리자 토큰이 있으면 Authorization 헤더 추가
  const token = sessionStorage.getItem("admin_token");
  if (token) opts.headers["Authorization"] = `Bearer ${token}`;

  // CSRF 토큰 (상태 변경 요청에만 필요하지만 항상 포함해도 무해)
  const csrf = getCookie("csrf-token");
  if (csrf) opts.headers["x-csrf-token"] = csrf;

  if (body) opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, opts);
  } catch (err) {
    // 네트워크 에러 (서버 미실행, 오프라인 등)
    throw new Error("서버에 연결할 수 없습니다");
  }

  let json;
  try {
    json = await res.json();
  } catch {
    // JSON 파싱 실패
    throw new Error(res.ok ? "응답 파싱 실패" : `HTTP ${res.status}`);
  }

  if (!res.ok) throw new Error(json.error || "Request failed");
  return json;
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  patch: (path, body) => request("PATCH", path, body),
  put: (path, body) => request("PUT", path, body),
  del: (path) => request("DELETE", path),
  delete: (path) => request("DELETE", path),
  upload: async (path, file) => {
    const form = new FormData();
    form.append("file", file);
    const headers = {};
    const token = sessionStorage.getItem("admin_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const csrf = getCookie("csrf-token");
    if (csrf) headers["x-csrf-token"] = csrf;
    let res;
    try {
      res = await fetch(`${API_BASE}${path}`, { method: "POST", body: form, headers });
    } catch {
      throw new Error("서버에 연결할 수 없습니다");
    }
    let json;
    try { json = await res.json(); } catch { throw new Error("Upload response parse failed"); }
    if (!res.ok) throw new Error(json.error || "Upload failed");
    return json;
  },
};
