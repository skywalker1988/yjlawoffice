/**
 * DOCX 가져오기 - mammoth.js로 .docx 파일을 HTML로 변환
 */
import { showEditorAlert } from "./editorToast";

export async function importDocx(file) {
  try {
    const mammoth = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value;
  } catch (err) {
    showEditorAlert("DOCX 불러오기 중 오류가 발생했습니다: " + err.message);
    return null;
  }
}
