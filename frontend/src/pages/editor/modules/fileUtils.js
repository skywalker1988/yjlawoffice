/**
 * File import/export utilities
 * - .docx export (using docx library)
 * - .docx import (using mammoth)
 * - .pdf export (using jsPDF + html2canvas)
 * - .html export
 * - auto-save (localStorage)
 */

/* ── HTML Export ── */
export function exportHtml(html, title = "문서") {
  const fullHtml = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  body {
    font-family: '맑은 고딕', 'Malgun Gothic', 'Noto Sans KR', sans-serif;
    font-size: 11pt;
    line-height: 1.75;
    color: #1a1a1a;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 60px;
  }
  h1 { font-size: 24pt; font-weight: 700; margin: 24px 0 12px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
  h2 { font-size: 18pt; font-weight: 600; margin: 20px 0 10px; }
  h3 { font-size: 14pt; font-weight: 600; margin: 16px 0 8px; }
  h4 { font-size: 12pt; font-weight: 600; margin: 14px 0 6px; }
  p { margin: 6px 0; }
  ul, ol { padding-left: 24px; margin: 8px 0; }
  blockquote { border-left: 3px solid #3b82f6; margin: 12px 0; padding: 8px 16px; background: #fafaf6; color: #555; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; }
  th, td { border: 1px solid #ccc; padding: 6px 10px; }
  th { background: #f1f5f9; font-weight: 600; }
  code { background: #f0f0ee; padding: 1px 4px; border-radius: 2px; }
  pre { background: #2d2d2d; color: #ccc; padding: 12px 16px; border-radius: 4px; overflow-x: auto; }
  a { color: #3b82f6; }
  img { max-width: 100%; }
</style>
</head>
<body>
${html}
</body>
</html>`;

  const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
  downloadBlob(blob, `${title}.html`);
}

/* ── DOCX Export ── */
export async function exportDocx(html, title = "문서") {
  try {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import("docx");

    // Simple HTML to docx conversion
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const elements = doc.body.children;
    const children = [];

    for (const el of elements) {
      const text = el.textContent || "";
      if (!text.trim()) continue;

      if (el.tagName === "H1") {
        children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_1 }));
      } else if (el.tagName === "H2") {
        children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_2 }));
      } else if (el.tagName === "H3") {
        children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_3 }));
      } else if (el.tagName === "H4") {
        children.push(new Paragraph({ text, heading: HeadingLevel.HEADING_4 }));
      } else if (el.tagName === "BLOCKQUOTE") {
        children.push(new Paragraph({
          children: [new TextRun({ text, italics: true, color: "555555" })],
          indent: { left: 720 },
        }));
      } else {
        // Parse inline formatting
        const runs = parseInlineFormatting(el, TextRun);
        const alignment = el.style?.textAlign === "center" ? AlignmentType.CENTER
          : el.style?.textAlign === "right" ? AlignmentType.RIGHT
          : el.style?.textAlign === "justify" ? AlignmentType.JUSTIFIED
          : AlignmentType.LEFT;
        children.push(new Paragraph({ children: runs, alignment }));
      }
    }

    const docxDoc = new Document({
      sections: [{ children }],
    });

    const blob = await Packer.toBlob(docxDoc);
    downloadBlob(blob, `${title}.docx`);
  } catch (err) {
    console.error("DOCX export error:", err);
    alert("DOCX 내보내기 중 오류가 발생했습니다: " + err.message);
  }
}

function parseInlineFormatting(el, TextRun) {
  const runs = [];

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (!text) return;

      const parent = node.parentElement;
      const isBold = parent?.closest("strong, b") !== null;
      const isItalic = parent?.closest("em, i") !== null;
      const isUnderline = parent?.closest("u") !== null;
      const isStrike = parent?.closest("s, del, strike") !== null;

      runs.push(new TextRun({
        text,
        bold: isBold,
        italics: isItalic,
        underline: isUnderline ? {} : undefined,
        strike: isStrike,
      }));
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      for (const child of node.childNodes) {
        walk(child);
      }
    }
  }

  walk(el);
  if (runs.length === 0) {
    runs.push(new TextRun({ text: el.textContent || "" }));
  }
  return runs;
}

/* ── PDF Export ── */
export async function exportPdf(editorElement, title = "문서") {
  if (!editorElement) {
    alert("PDF 내보내기: 에디터 요소를 찾을 수 없습니다.");
    return;
  }
  try {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    // Ensure element is visible and fully rendered
    await new Promise(r => setTimeout(r, 100));

    const canvas = await html2canvas(editorElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: editorElement.scrollWidth,
      windowHeight: editorElement.scrollHeight,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }

    pdf.save(`${title}.pdf`);
  } catch (err) {
    console.error("PDF export error:", err);
    alert("PDF 내보내기 중 오류가 발생했습니다: " + err.message);
  }
}

/* ── DOCX Import ── */
export async function importDocx(file) {
  try {
    const mammoth = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return result.value;
  } catch (err) {
    console.error("DOCX import error:", err);
    alert("DOCX 불러오기 중 오류가 발생했습니다: " + err.message);
    return null;
  }
}

/* ── Auto-save to localStorage ── */
const AUTOSAVE_KEY = "word-editor-autosave";

export function autoSaveToLocal(html, doc) {
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({
      html,
      doc,
      timestamp: Date.now(),
    }));
  } catch (e) {
    // localStorage full or unavailable
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

/* ── Helpers ── */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ── Markdown helpers (from original) ── */
export function isMarkdown(text) {
  if (!text) return false;
  return /^#{1,6}\s/.test(text) || /\*\*/.test(text) || /^[-*]\s/.test(text.split("\n").find((l) => l.trim()) || "");
}

export function htmlToMarkdown(html) {
  if (!html) return "";
  let md = html;
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n");
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n");
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n");
  md = md.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<b>(.*?)<\/b>/gi, "**$1**");
  md = md.replace(/<em>(.*?)<\/em>/gi, "*$1*");
  md = md.replace(/<i>(.*?)<\/i>/gi, "*$1*");
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");
  md = md.replace(/<br\s*\/?>/gi, "\n");
  md = md.replace(/<[^>]+>/g, "");
  md = md.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
  return md.trim();
}
