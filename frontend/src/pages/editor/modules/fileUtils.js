/**
 * 파일 가져오기/내보내기 유틸리티
 * - .docx 내보내기 (서식 완전 보존)
 * - .docx 가져오기 (mammoth)
 * - .pdf 내보내기 (jsPDF + html2canvas, 페이지별 캡처)
 * - .html 내보내기
 * - .md 마크다운 내보내기 (turndown)
 * - .hwpx 한글 내보내기 (OWPML 형식)
 * - 자동저장 (localStorage)
 */

/* ══════════════════════════════════════════════
   HTML 내보내기
   ══════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════
   DOCX 내보내기 (서식 완전 보존)
   ══════════════════════════════════════════════ */

/** pt 단위를 twip(1/20pt)으로 변환 */
function ptToTwip(pt) { return Math.round(pt * 20); }

/** px 단위를 EMU(914400 EMU = 1 inch, 96px = 1 inch)로 변환 */
function pxToEmu(px) { return Math.round(px * 914400 / 96); }

/** CSS 색상 문자열을 6자리 hex로 변환 */
function colorToHex(color) {
  if (!color) return undefined;
  if (color.startsWith("#")) {
    const hex = color.replace("#", "");
    if (hex.length === 3) return hex.split("").map(c => c + c).join("");
    return hex.substring(0, 6);
  }
  if (color.startsWith("rgb")) {
    const m = color.match(/(\d+)/g);
    if (m && m.length >= 3) {
      return m.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, "0")).join("");
    }
  }
  return undefined;
}

/** fontSize 문자열에서 pt 숫자 추출 */
function parseFontSizePt(fontSize) {
  if (!fontSize) return 11;
  if (fontSize.endsWith("pt")) return parseFloat(fontSize);
  if (fontSize.endsWith("px")) return parseFloat(fontSize) * 0.75;
  return parseFloat(fontSize) || 11;
}

export async function exportDocx(html, title = "문서", options = {}) {
  try {
    const docx = await import("docx");
    const {
      Document, Packer, Paragraph, TextRun, HeadingLevel,
      AlignmentType, TabStopType, TabStopPosition,
      Table: DocxTable, TableRow: DocxTableRow, TableCell: DocxTableCell,
      WidthType, BorderStyle, ImageRun, LevelFormat,
      convertInchesToTwip, ExternalHyperlink,
      NumberFormat, PageNumber, ShadingType,
    } = docx;

    const parser = new DOMParser();
    const parsedDoc = parser.parseFromString(html, "text/html");
    const children = [];

    /* 인라인 서식을 보존하며 TextRun 배열 생성 */
    function buildRuns(element) {
      const runs = [];

      function walk(node, inheritedStyle = {}) {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent;
          if (!text) return;

          const parent = node.parentElement;
          const computed = parent ? window.getComputedStyle(parent) : {};
          const inlineStyle = parent?.style || {};

          /* 상위 태그에서 서식 상속 확인 */
          const isBold = inheritedStyle.bold || parent?.closest("strong, b") !== null;
          const isItalic = inheritedStyle.italic || parent?.closest("em, i") !== null;
          const isUnderline = inheritedStyle.underline || parent?.closest("u") !== null;
          const isStrike = inheritedStyle.strike || parent?.closest("s, del, strike") !== null;
          const isSub = parent?.closest("sub") !== null;
          const isSup = parent?.closest("sup") !== null;

          /* 인라인 스타일에서 폰트 정보 추출 */
          const fontFamily = inlineStyle.fontFamily || inheritedStyle.fontFamily;
          const fontSize = inlineStyle.fontSize || inheritedStyle.fontSize;
          const color = inlineStyle.color || inheritedStyle.color;
          const bgColor = inlineStyle.backgroundColor || inheritedStyle.backgroundColor;

          const runOpts = {
            text,
            bold: isBold || undefined,
            italics: isItalic || undefined,
            underline: isUnderline ? {} : undefined,
            strike: isStrike || undefined,
            subScript: isSub || undefined,
            superScript: isSup || undefined,
          };

          if (fontFamily) {
            const clean = fontFamily.replace(/['"]/g, "").split(",")[0].trim();
            runOpts.font = clean;
          }
          if (fontSize) {
            runOpts.size = ptToTwip(parseFontSizePt(fontSize));
          }
          const hex = colorToHex(color);
          if (hex && hex !== "000000" && hex !== "1a1a1a") {
            runOpts.color = hex;
          }
          if (bgColor && bgColor !== "transparent" && bgColor !== "rgba(0, 0, 0, 0)") {
            const bgHex = colorToHex(bgColor);
            if (bgHex) {
              runOpts.shading = { type: ShadingType.SOLID, color: bgHex, fill: bgHex };
            }
          }

          runs.push(new TextRun(runOpts));
          return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const el = node;
        const tag = el.tagName;

        /* BR → 줄바꿈 */
        if (tag === "BR") {
          runs.push(new TextRun({ break: 1 }));
          return;
        }

        /* 이미지 건너뛰기 (별도 처리) */
        if (tag === "IMG") return;

        /* 자식 노드 재귀 처리 */
        const style = { ...inheritedStyle };
        if (tag === "STRONG" || tag === "B") style.bold = true;
        if (tag === "EM" || tag === "I") style.italic = true;
        if (tag === "U") style.underline = true;
        if (tag === "S" || tag === "DEL" || tag === "STRIKE") style.strike = true;

        /* span 등의 인라인 스타일 상속 */
        if (el.style.fontFamily) style.fontFamily = el.style.fontFamily;
        if (el.style.fontSize) style.fontSize = el.style.fontSize;
        if (el.style.color) style.color = el.style.color;
        if (el.style.backgroundColor) style.backgroundColor = el.style.backgroundColor;

        for (const child of el.childNodes) {
          walk(child, style);
        }
      }

      walk(element);
      if (runs.length === 0) {
        runs.push(new TextRun({ text: element.textContent || "" }));
      }
      return runs;
    }

    /* 텍스트 정렬 추출 */
    function getAlignment(el) {
      const ta = el.style?.textAlign || el.getAttribute("align");
      if (ta === "center") return AlignmentType.CENTER;
      if (ta === "right") return AlignmentType.RIGHT;
      if (ta === "justify") return AlignmentType.JUSTIFIED;
      return undefined;
    }

    /* 줄간격 추출 */
    function getSpacing(el) {
      const spacing = {};
      const ls = el.getAttribute("data-line-spacing") || el.style?.lineHeight;
      if (ls) {
        const num = parseFloat(ls);
        if (!isNaN(num) && num > 0) {
          /* 줄간격을 240 twip 기준으로 계산 (1.0 = 240) */
          spacing.line = Math.round(num * 240);
        }
      }
      const mb = el.style?.marginBottom;
      if (mb) {
        const px = parseFloat(mb);
        if (!isNaN(px)) spacing.after = ptToTwip(px * 0.75);
      }
      const mt = el.style?.marginTop;
      if (mt) {
        const px = parseFloat(mt);
        if (!isNaN(px)) spacing.before = ptToTwip(px * 0.75);
      }
      return Object.keys(spacing).length > 0 ? spacing : undefined;
    }

    /* 들여쓰기 추출 */
    function getIndent(el) {
      const indent = {};
      const pl = el.style?.paddingLeft || el.style?.marginLeft;
      if (pl) {
        const px = parseFloat(pl);
        if (!isNaN(px) && px > 0) indent.left = ptToTwip(px * 0.75);
      }
      const ti = el.style?.textIndent;
      if (ti) {
        const px = parseFloat(ti);
        if (!isNaN(px) && px !== 0) indent.firstLine = ptToTwip(Math.abs(px) * 0.75);
      }
      return Object.keys(indent).length > 0 ? indent : undefined;
    }

    /* 테이블 변환 */
    function convertTable(tableEl) {
      const rows = [];
      for (const trEl of tableEl.querySelectorAll("tr")) {
        const cells = [];
        for (const tdEl of trEl.querySelectorAll("td, th")) {
          const cellParagraphs = [];
          /* 셀 내부의 블록요소를 각각 Paragraph로 변환 */
          if (tdEl.children.length > 0) {
            for (const child of tdEl.children) {
              cellParagraphs.push(new Paragraph({
                children: buildRuns(child),
                alignment: getAlignment(child),
              }));
            }
          }
          if (cellParagraphs.length === 0) {
            cellParagraphs.push(new Paragraph({
              children: buildRuns(tdEl),
            }));
          }
          const isHeader = tdEl.tagName === "TH";
          cells.push(new DocxTableCell({
            children: cellParagraphs,
            shading: isHeader ? { type: ShadingType.SOLID, color: "f1f5f9", fill: "f1f5f9" } : undefined,
          }));
        }
        if (cells.length > 0) {
          rows.push(new DocxTableRow({ children: cells }));
        }
      }
      if (rows.length > 0) {
        return new DocxTable({
          rows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        });
      }
      return null;
    }

    /* 리스트 변환 */
    function convertList(listEl, level = 0) {
      const isOrdered = listEl.tagName === "OL";
      for (const li of listEl.children) {
        if (li.tagName !== "LI") continue;
        /* li 내부에 중첩 리스트가 있는 경우 처리 */
        const nestedList = li.querySelector("ul, ol");
        const textContent = [];
        for (const node of li.childNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && (node.tagName === "UL" || node.tagName === "OL")) continue;
          if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent?.trim();
            if (text) textContent.push(new TextRun({ text }));
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            textContent.push(...buildRuns(node));
          }
        }
        if (textContent.length > 0) {
          const bullet = isOrdered ? `${Array.from(listEl.children).indexOf(li) + 1}. ` : "• ";
          children.push(new Paragraph({
            children: [new TextRun({ text: bullet }), ...textContent],
            indent: { left: ptToTwip((level + 1) * 18) },
          }));
        }
        if (nestedList) {
          convertList(nestedList, level + 1);
        }
      }
    }

    /* 최상위 요소 순회 */
    for (const el of parsedDoc.body.children) {
      const tag = el.tagName;

      /* 페이지 구분선 */
      if (el.getAttribute("data-type") === "page-break") {
        children.push(new Paragraph({ children: [], pageBreakBefore: true }));
        continue;
      }

      /* 제목 */
      if (/^H[1-4]$/.test(tag)) {
        const level = parseInt(tag[1]);
        const headingMap = {
          1: HeadingLevel.HEADING_1,
          2: HeadingLevel.HEADING_2,
          3: HeadingLevel.HEADING_3,
          4: HeadingLevel.HEADING_4,
        };
        children.push(new Paragraph({
          children: buildRuns(el),
          heading: headingMap[level],
          alignment: getAlignment(el),
          spacing: getSpacing(el),
        }));
        continue;
      }

      /* 테이블 */
      if (tag === "TABLE") {
        const table = convertTable(el);
        if (table) children.push(table);
        continue;
      }

      /* 리스트 */
      if (tag === "UL" || tag === "OL") {
        convertList(el);
        continue;
      }

      /* 인용 */
      if (tag === "BLOCKQUOTE") {
        children.push(new Paragraph({
          children: buildRuns(el),
          indent: { left: 720 },
          border: {
            left: { style: BorderStyle.SINGLE, size: 6, color: "3b82f6" },
          },
        }));
        continue;
      }

      /* 수평선 */
      if (tag === "HR") {
        children.push(new Paragraph({
          children: [],
          border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" } },
        }));
        continue;
      }

      /* 코드블록 */
      if (tag === "PRE") {
        const codeText = el.textContent || "";
        const lines = codeText.split("\n");
        for (const line of lines) {
          children.push(new Paragraph({
            children: [new TextRun({ text: line, font: "Consolas", size: ptToTwip(9) })],
            shading: { type: ShadingType.SOLID, color: "f5f5f5", fill: "f5f5f5" },
          }));
        }
        continue;
      }

      /* 빈 요소 → 빈 줄 */
      if (!el.textContent?.trim() && !el.querySelector("img")) {
        children.push(new Paragraph({ children: [] }));
        continue;
      }

      /* 일반 단락 (p, div 등) */
      children.push(new Paragraph({
        children: buildRuns(el),
        alignment: getAlignment(el),
        spacing: getSpacing(el),
        indent: getIndent(el),
      }));
    }

    /* 빈 문서 방지 */
    if (children.length === 0) {
      children.push(new Paragraph({ children: [new TextRun({ text: "" })] }));
    }

    const docxDoc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "맑은 고딕",
              size: ptToTwip(11),
            },
            paragraph: {
              spacing: { line: 360 },
            },
          },
        },
      },
      sections: [{
        properties: {
          page: {
            size: {
              width: convertInchesToTwip(8.27),
              height: convertInchesToTwip(11.69),
            },
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.25),
              right: convertInchesToTwip(1.25),
            },
          },
        },
        children,
      }],
    });

    const blob = await Packer.toBlob(docxDoc);
    downloadBlob(blob, `${title}.docx`);
  } catch (err) {
    console.error("DOCX export error:", err);
    alert("DOCX 내보내기 중 오류가 발생했습니다: " + err.message);
  }
}

/* ══════════════════════════════════════════════
   PDF 내보내기 (페이지별 정밀 캡처)
   ══════════════════════════════════════════════ */
export async function exportPdf(editorElement, title = "문서", pageInfo = {}) {
  if (!editorElement) {
    alert("PDF 내보내기: 에디터 요소를 찾을 수 없습니다.");
    return;
  }
  try {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    await new Promise(r => setTimeout(r, 200));

    /* 페이지 영역 전체를 캡처 */
    const pageArea = editorElement.closest(".editor-page-area") || editorElement;

    const canvas = await html2canvas(pageArea, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: pageArea.scrollWidth,
      windowHeight: pageArea.scrollHeight,
      /* 페이지 갭 오버레이 등 UI 요소 제거 */
      ignoreElements: (el) => {
        return el.hasAttribute?.("data-page-overlay") ||
               el.classList?.contains("page-break-overlay");
      },
    });

    const imgData = canvas.toDataURL("image/png");
    const pdfOrientation = (pageInfo.orientation === "landscape") ? "l" : "p";
    const pdfSize = pageInfo.pageSize || "a4";
    const pdf = new jsPDF(pdfOrientation, "mm", pdfSize);

    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = pdf.internal.pageSize.getHeight();
    const imgW = pdfW;
    const imgH = (canvas.height * pdfW) / canvas.width;

    let yOffset = 0;
    let page = 0;

    while (yOffset < imgH) {
      if (page > 0) pdf.addPage();

      /* 현재 페이지에 해당하는 영역만 그리기 */
      pdf.addImage(imgData, "PNG", 0, -yOffset, imgW, imgH);

      yOffset += pdfH;
      page++;

      /* 안전장치: 최대 100페이지 */
      if (page > 100) break;
    }

    pdf.save(`${title}.pdf`);
  } catch (err) {
    console.error("PDF export error:", err);
    alert("PDF 내보내기 중 오류가 발생했습니다: " + err.message);
  }
}

/* ══════════════════════════════════════════════
   마크다운 내보내기 (turndown 사용)
   ══════════════════════════════════════════════ */
export async function exportMarkdown(html, title = "문서") {
  try {
    const TurndownService = (await import("turndown")).default;
    const td = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
      emDelimiter: "*",
      strongDelimiter: "**",
    });

    /* 취소선 지원 */
    td.addRule("strikethrough", {
      filter: ["del", "s", "strike"],
      replacement: (content) => `~~${content}~~`,
    });

    /* 밑줄 → HTML 유지 (마크다운에 밑줄 문법 없음) */
    td.addRule("underline", {
      filter: ["u"],
      replacement: (content) => `<u>${content}</u>`,
    });

    /* 하이라이트 */
    td.addRule("highlight", {
      filter: (node) => node.nodeName === "MARK",
      replacement: (content) => `==${content}==`,
    });

    /* 작업 목록 */
    td.addRule("taskList", {
      filter: (node) => {
        return node.nodeName === "LI" && node.getAttribute("data-type") === "taskItem";
      },
      replacement: (content, node) => {
        const checked = node.getAttribute("data-checked") === "true";
        return `${checked ? "- [x]" : "- [ ]"} ${content.trim()}\n`;
      },
    });

    /* 페이지 구분선 → --- */
    td.addRule("pageBreak", {
      filter: (node) => node.getAttribute?.("data-type") === "page-break",
      replacement: () => "\n---\n\n",
    });

    const markdown = td.turndown(html);

    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    downloadBlob(blob, `${title}.md`);
  } catch (err) {
    console.error("Markdown export error:", err);
    alert("마크다운 내보내기 중 오류가 발생했습니다: " + err.message);
  }
}

/* ══════════════════════════════════════════════
   HWPX 내보내기 (한글 호환 OWPML 형식)
   ══════════════════════════════════════════════ */
export async function exportHwpx(html, title = "문서") {
  try {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    /* HTML 파싱 */
    const parser = new DOMParser();
    const parsedDoc = parser.parseFromString(html, "text/html");

    /* mimetype (압축하지 않음) */
    zip.file("mimetype", "application/hwp+zip", { compression: "STORE" });

    /* META-INF/manifest.xml */
    zip.file("META-INF/manifest.xml", `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0">
  <manifest:file-entry manifest:media-type="application/hwp+zip" manifest:full-path="/"/>
  <manifest:file-entry manifest:media-type="application/xml" manifest:full-path="Contents/content.hpf"/>
  <manifest:file-entry manifest:media-type="application/xml" manifest:full-path="Contents/header.xml"/>
  <manifest:file-entry manifest:media-type="application/xml" manifest:full-path="Contents/section0.xml"/>
</manifest:manifest>`);

    /* Contents/content.hpf (패키지 파일) */
    zip.file("Contents/content.hpf", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<opf:package xmlns:opf="http://www.idpf.org/2007/opf" version="1.0">
  <opf:metadata>
    <opf:title>${escapeXml(title)}</opf:title>
    <opf:language>ko</opf:language>
    <opf:meta name="creator" content="윤정 법률사무소 에디터"/>
    <opf:meta name="date" content="${new Date().toISOString()}"/>
  </opf:metadata>
  <opf:manifest>
    <opf:item id="header" href="header.xml" media-type="application/xml"/>
    <opf:item id="section0" href="section0.xml" media-type="application/xml"/>
  </opf:manifest>
  <opf:spine>
    <opf:itemref idref="section0"/>
  </opf:spine>
</opf:package>`);

    /* Contents/header.xml (문서 설정) */
    zip.file("Contents/header.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<ha:HWPDocumentHeaderType xmlns:ha="http://www.hancom.co.kr/hwpml/2011/head"
  version="1.1" secCnt="1">
  <ha:beginNum page="1" footnote="1" endnote="1"/>
  <ha:refList>
    <ha:fontfaces>
      <ha:fontface lang="HANGUL">
        <ha:font id="0" face="맑은 고딕" type="TTF"/>
      </ha:fontface>
      <ha:fontface lang="LATIN">
        <ha:font id="0" face="맑은 고딕" type="TTF"/>
      </ha:fontface>
    </ha:fontfaces>
    <ha:charProperties>
      <ha:charPr id="0" height="1100" bold="false" italic="false" underline="false" color="0">
        <ha:fontRef hangul="0" latin="0"/>
      </ha:charPr>
      <ha:charPr id="1" height="1600" bold="true" italic="false" underline="false" color="0">
        <ha:fontRef hangul="0" latin="0"/>
      </ha:charPr>
      <ha:charPr id="2" height="1400" bold="true" italic="false" underline="false" color="0">
        <ha:fontRef hangul="0" latin="0"/>
      </ha:charPr>
      <ha:charPr id="3" height="1200" bold="true" italic="false" underline="false" color="0">
        <ha:fontRef hangul="0" latin="0"/>
      </ha:charPr>
    </ha:charProperties>
    <ha:paraProperties>
      <ha:paraPr id="0" align="JUSTIFY">
        <ha:spacing line="160" lineType="PERCENT"/>
        <ha:margin indent="0" left="0" right="0"/>
      </ha:paraPr>
    </ha:paraProperties>
  </ha:refList>
  <ha:compatibleDocument targetProgram="HWP201X"/>
</ha:HWPDocumentHeaderType>`);

    /* Contents/section0.xml (본문) */
    const sectionXml = buildHwpxSection(parsedDoc.body);
    zip.file("Contents/section0.xml", sectionXml);

    const blob = await zip.generateAsync({
      type: "blob",
      mimeType: "application/hwp+zip",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    downloadBlob(blob, `${title}.hwpx`);
  } catch (err) {
    console.error("HWPX export error:", err);
    alert("한글(HWPX) 내보내기 중 오류가 발생했습니다: " + err.message);
  }
}

/** XML 특수문자 이스케이프 */
function escapeXml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/** HTML body → HWPX section XML 생성 */
function buildHwpxSection(body) {
  const paragraphs = [];

  function getCharPrId(el) {
    const tag = el?.tagName;
    if (tag === "H1") return "1";
    if (tag === "H2") return "2";
    if (tag === "H3" || tag === "H4") return "3";
    return "0";
  }

  function extractText(node) {
    let texts = [];
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const t = child.textContent;
        if (t) texts.push(escapeXml(t));
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        if (child.tagName === "BR") {
          texts.push("\n");
        } else {
          texts.push(...extractText(child));
        }
      }
    }
    return texts;
  }

  for (const el of body.children) {
    const tag = el.tagName;

    /* 페이지 구분 */
    if (el.getAttribute("data-type") === "page-break") {
      paragraphs.push(`    <hp:p><hp:run><hp:ctrl><hp:colPr type="SECTION" breakType="PAGE"/></hp:ctrl></hp:run></hp:p>`);
      continue;
    }

    const charPrId = getCharPrId(el);
    const texts = extractText(el);
    const textStr = texts.join("");

    if (!textStr.trim() && tag !== "HR") {
      paragraphs.push(`    <hp:p paraPrIDRef="0"><hp:run charPrIDRef="${charPrId}"><hp:t></hp:t></hp:run></hp:p>`);
      continue;
    }

    /* 리스트 처리 */
    if (tag === "UL" || tag === "OL") {
      const items = el.querySelectorAll("li");
      items.forEach((li, idx) => {
        const prefix = tag === "OL" ? `${idx + 1}. ` : "• ";
        const liText = escapeXml(li.textContent || "");
        paragraphs.push(`    <hp:p paraPrIDRef="0"><hp:run charPrIDRef="0"><hp:t>${prefix}${liText}</hp:t></hp:run></hp:p>`);
      });
      continue;
    }

    /* 테이블은 단순 텍스트로 변환 (HWPX 테이블은 매우 복잡) */
    if (tag === "TABLE") {
      const rows = el.querySelectorAll("tr");
      for (const row of rows) {
        const cells = row.querySelectorAll("td, th");
        const cellTexts = Array.from(cells).map(c => escapeXml(c.textContent || "")).join("\t");
        paragraphs.push(`    <hp:p paraPrIDRef="0"><hp:run charPrIDRef="0"><hp:t>${cellTexts}</hp:t></hp:run></hp:p>`);
      }
      continue;
    }

    paragraphs.push(`    <hp:p paraPrIDRef="0"><hp:run charPrIDRef="${charPrId}"><hp:t>${escapeXml(textStr)}</hp:t></hp:run></hp:p>`);
  }

  if (paragraphs.length === 0) {
    paragraphs.push(`    <hp:p paraPrIDRef="0"><hp:run charPrIDRef="0"><hp:t></hp:t></hp:run></hp:p>`);
  }

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<hp:sec xmlns:hp="http://www.hancom.co.kr/hwpml/2011/paragraph"
  xmlns:hs="http://www.hancom.co.kr/hwpml/2011/section">
  <hp:subList>
${paragraphs.join("\n")}
  </hp:subList>
</hp:sec>`;
}


/* ══════════════════════════════════════════════
   DOCX 가져오기
   ══════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════
   공통 헬퍼
   ══════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════
   마크다운 헬퍼 (기존 호환)
   ══════════════════════════════════════════════ */
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
