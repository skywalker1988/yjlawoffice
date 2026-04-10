/**
 * 파일 가져오기/내보내기 유틸리티 — 배럴 모듈
 * 각 내보내기/가져오기 기능을 개별 모듈에서 재내보내기한다.
 * 기존 import 경로와의 호환성을 유지한다.
 */

/* 내보내기 */
export { exportDocx } from "./docxExport";
export { exportPdf } from "./pdfExport";
export { exportHtml, exportMarkdown, exportHwpx } from "./otherExports";

/* 가져오기 */
export { importDocx } from "./docxImport";

/* 공통 헬퍼 */
export { isMarkdown, htmlToMarkdown } from "./fileHelpers";

/* ══════════════════════════════════════════════
   자동저장 (localStorage)
   ══════════════════════════════════════════════ */
const AUTOSAVE_KEY = "word-editor-autosave";

export function autoSaveToLocal(html, doc) {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
      html,
      doc,
      timestamp: Date.now(),
    }));
  } catch (e) {
    // QuotaExceededError 발생 시 조용히 실패 (자동저장이므로 사용자 방해 불필요)
  }
}

export function loadAutoSave() {
  try {
    const data = localStorage.getItem(AUTOSAVE_KEY);
    if (!data) return null;
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

export function clearAutoSave() {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch (e) {}
}
