/**
 * 문서 로드/저장/생성 훅
 * — EditorPage에서 분리된 문서 CRUD 로직
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { marked } from "marked";
import { api } from "../../../utils/api";
import { EMPTY_DOC } from "../modules/constants";
import { isMarkdown, htmlToMarkdown, autoSaveToLocal } from "../modules/fileUtils";
import { AUTOSAVE_SERVER_DELAY_MS } from "../../../utils/timing";

/**
 * 문서 CRUD 상태 관리 훅 — 목록 조회, 로드, 저장, 생성, 자동저장을 처리한다.
 * @param {import("@tiptap/react").Editor|null} editor - TipTap 에디터 인스턴스
 * @returns {{ doc: object, setDoc: Function, docId: string|null, setDocId: Function, documents: Array, loading: boolean, saveStatus: string, loadDocument: Function, handleSave: Function, handleNew: Function, refreshList: Function, scheduleAutoSave: Function }}
 */
export default function useDocumentManager(editor) {
  const [doc, setDoc] = useState({ ...EMPTY_DOC });
  const [docId, setDocId] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const autoSaveTimer = useRef(null);
  const docRef = useRef(doc);
  useEffect(() => { docRef.current = doc; }, [doc]);

  /** 문서 목록 새로고침 */
  const refreshList = useCallback(() => {
    api.get("/documents?limit=200").then((j) => setDocuments(j.data || [])).catch(() => {});
  }, []);

  /** 문서 로드 */
  const loadDocument = useCallback(async (id) => {
    try {
      setLoading(true);
      const j = await api.get("/documents/" + id);
      const d = j.data;
      setDocId(id);
      setDoc({
        title: d.title || "",
        documentType: d.documentType || "article",
        subtitle: d.subtitle || "",
        author: d.author || "",
        source: d.source || "",
        publishedDate: d.publishedDate ? d.publishedDate.slice(0, 10) : "",
        contentMarkdown: d.contentMarkdown || "",
        summary: d.summary || "",
        status: d.status || "draft",
        importance: d.importance ?? 3,
      });
      if (editor) {
        let html = d.contentHtml || "";
        if (!html && d.contentMarkdown) {
          html = isMarkdown(d.contentMarkdown)
            ? marked(d.contentMarkdown)
            : "<p>" + d.contentMarkdown.replace(/\n/g, "</p><p>") + "</p>";
        }
        editor.commands.setContent(html || "");
      }
      setSaveStatus("저장됨");
    } catch {
      setSaveStatus("오류");
    } finally {
      setLoading(false);
    }
  }, [editor]);

  /** 문서 저장 (auto=true이면 자동저장) */
  const handleSave = useCallback(async (auto = false) => {
    if (!editor) return;
    setSaveStatus("저장 중...");
    const html = editor.getHTML();
    const md = doc.contentMarkdown || htmlToMarkdown(html);
    const payload = {
      title: doc.title || "제목 없음",
      documentType: doc.documentType,
      subtitle: doc.subtitle,
      author: doc.author,
      source: doc.source,
      publishedDate: doc.publishedDate || null,
      contentHtml: html,
      contentMarkdown: md,
      summary: doc.summary,
      status: doc.status,
      importance: doc.importance,
    };
    try {
      if (docId) {
        await api.patch("/documents/" + docId, payload);
      } else {
        const j = await api.post("/documents", payload);
        const newId = j.data?.id;
        if (newId) {
          setDocId(newId);
          refreshList();
        }
      }
      setSaveStatus("저장됨");
    } catch {
      setSaveStatus("오류");
    }
  }, [editor, doc, docId, refreshList]);

  /** 새 문서 */
  const handleNew = useCallback(() => {
    setDocId(null);
    setDoc({ ...EMPTY_DOC });
    if (editor) editor.commands.setContent("");
    setSaveStatus("");
  }, [editor]);

  /** 에디터 업데이트 시 자동저장 스케줄링 (docRef로 최신 doc 참조) */
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setSaveStatus("수정됨");
    autoSaveTimer.current = setTimeout(() => {
      if (editor && !editor.isDestroyed) {
        autoSaveToLocal(editor.getHTML(), docRef.current);
        setSaveStatus("로컬 저장됨");
      }
      setTimeout(() => handleSave(true), AUTOSAVE_SERVER_DELAY_MS);
    }, 1000);
  }, [editor, handleSave]);

  return {
    doc, setDoc, docId, setDocId,
    documents, setDocuments,
    loading, saveStatus, setSaveStatus,
    loadDocument, handleSave, handleNew, refreshList,
    scheduleAutoSave,
  };
}
