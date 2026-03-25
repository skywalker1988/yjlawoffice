/** API 통신 래퍼 — fetch 기반 REST 클라이언트 (GET/POST/PATCH/DELETE/upload) */
const API_BASE = "/api/sb";

async function request(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  const json = await res.json();
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
    const res = await fetch(`${API_BASE}${path}`, { method: "POST", body: form });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Upload failed");
    return json;
  },
};
