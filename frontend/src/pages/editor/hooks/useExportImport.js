/**
 * 파일 내보내기/불러오기 훅
 * — EditorPage에서 분리된 docx/pdf/html/md/hwpx 내보내기 + docx 불러오기
 */
import { useCallback } from "react";
import { exportHtml, exportDocx, exportPdf, exportMarkdown, exportHwpx, importDocx } from "../modules/fileUtils";
import { showEditorAlert } from "../modules/editorToast";

export default function useExportImport({ editor, doc, setDoc, setSaveStatus, editorCanvasRef, layoutOptions }) {
  const handleExportDocx = useCallback(() => {
    if (editor) exportDocx(editor.getHTML(), doc.title || "문서");
  }, [editor, doc.title]);

  const handleExportPdf = useCallback(() => {
    const el = editor?.view?.dom || editorCanvasRef?.current?.querySelector(".ProseMirror");
    if (el) exportPdf(el, doc.title || "문서", layoutOptions);
    else showEditorAlert("에디터 요소를 찾을 수 없습니다.");
  }, [editor, doc.title, editorCanvasRef, layoutOptions]);

  const handleExportHtml = useCallback(() => {
    if (editor) exportHtml(editor.getHTML(), doc.title || "문서");
  }, [editor, doc.title]);

  const handleExportMarkdown = useCallback(() => {
    if (editor) exportMarkdown(editor.getHTML(), doc.title || "문서");
  }, [editor, doc.title]);

  const handleExportHwpx = useCallback(() => {
    if (editor) exportHwpx(editor.getHTML(), doc.title || "문서");
  }, [editor, doc.title]);

  const handleImportDocx = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".docx";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const html = await importDocx(file);
      if (html && editor) {
        editor.commands.setContent(html);
        setDoc(d => ({ ...d, title: file.name.replace(".docx", "") }));
        setSaveStatus("불러옴");
      }
    };
    input.click();
  }, [editor, setDoc, setSaveStatus]);

  return {
    handleExportDocx, handleExportPdf, handleExportHtml,
    handleExportMarkdown, handleExportHwpx, handleImportDocx,
  };
}
