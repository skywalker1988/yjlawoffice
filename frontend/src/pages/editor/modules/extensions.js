/**
 * TipTap 커스텀 확장 모듈
 * MS Word 스타일 에디터에 필요한 서식, 레이아웃, 구조 확장을 정의한다.
 *
 * 기존 확장: FontSize, LineSpacing, Indent, ParagraphSpacing
 * 추가 확장: PageBreak, SectionBreak, LetterSpacing, TextShadow,
 *           Bookmark, TextBorder, ParagraphBorder, DropCap,
 *           ColumnBreak, KeepWithNext, WidowOrphan, TextDirection
 */
import { Extension, Node, Mark } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

/* ═══════════════════════════════════════════════
 *  기존 확장 (Existing Extensions)
 * ═══════════════════════════════════════════════ */

/* ── FontSize Extension ── */
export const FontSize = Extension.create({
  name: "fontSize",

  addOptions() {
    return { types: ["textStyle"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => el.style.fontSize?.replace(/['"]+/g, "") || null,
            renderHTML: (attrs) => {
              if (!attrs.fontSize) return {};
              return { style: `font-size: ${attrs.fontSize}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run(),
    };
  },
});

/* ── LineSpacing Extension ── */
export const LineSpacing = Extension.create({
  name: "lineSpacing",

  addOptions() {
    return { types: ["paragraph", "heading"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          lineSpacing: {
            default: null,
            parseHTML: (el) => el.style.lineHeight || null,
            renderHTML: (attrs) => {
              if (!attrs.lineSpacing) return {};
              return { style: `line-height: ${attrs.lineSpacing}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineSpacing:
        (spacing) =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;
          let applied = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, lineSpacing: spacing });
              applied = true;
            }
          });
          if (applied && dispatch) dispatch(tr);
          return true;
        },
      unsetLineSpacing:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;
          let applied = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const newAttrs = { ...node.attrs };
              delete newAttrs.lineSpacing;
              tr.setNodeMarkup(pos, undefined, newAttrs);
              applied = true;
            }
          });
          if (applied && dispatch) dispatch(tr);
          return true;
        },
    };
  },
});

/* ── Indent Extension ── */
export const Indent = Extension.create({
  name: "indent",

  addOptions() {
    return {
      types: ["paragraph", "heading"],
      minLevel: 0,
      maxLevel: 10,
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (el) => {
              const ml = el.style.marginLeft;
              if (!ml) return 0;
              return Math.round(parseInt(ml) / 40) || 0;
            },
            renderHTML: (attrs) => {
              if (!attrs.indent || attrs.indent <= 0) return {};
              return { style: `margin-left: ${attrs.indent * 40}px` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      increaseIndent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;
          let changed = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              if (currentIndent < this.options.maxLevel) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: currentIndent + 1,
                });
                changed = true;
              }
            }
          });
          if (changed && dispatch) dispatch(tr);
          return changed;
        },
      decreaseIndent:
        () =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;
          let changed = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const currentIndent = node.attrs.indent || 0;
              if (currentIndent > this.options.minLevel) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  indent: currentIndent - 1,
                });
                changed = true;
              }
            }
          });
          if (changed && dispatch) dispatch(tr);
          return changed;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.increaseIndent(),
      "Shift-Tab": () => this.editor.commands.decreaseIndent(),
    };
  },
});

/* ── ParagraphSpacing Extension ── */
export const ParagraphSpacing = Extension.create({
  name: "paragraphSpacing",

  addOptions() {
    return { types: ["paragraph", "heading"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          spacingBefore: {
            default: null,
            parseHTML: (el) => el.style.marginTop || null,
            renderHTML: (attrs) => {
              if (!attrs.spacingBefore) return {};
              return { style: `margin-top: ${attrs.spacingBefore}` };
            },
          },
          spacingAfter: {
            default: null,
            parseHTML: (el) => el.style.marginBottom || null,
            renderHTML: (attrs) => {
              if (!attrs.spacingAfter) return {};
              return { style: `margin-bottom: ${attrs.spacingAfter}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setSpacingBefore:
        (value) =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;
          let applied = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, spacingBefore: value });
              applied = true;
            }
          });
          if (applied && dispatch) dispatch(tr);
          return true;
        },
      setSpacingAfter:
        (value) =>
        ({ tr, state, dispatch }) => {
          const { selection } = state;
          const { from, to } = selection;
          let applied = false;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, spacingAfter: value });
              applied = true;
            }
          });
          if (applied && dispatch) dispatch(tr);
          return true;
        },
    };
  },
});

/* ═══════════════════════════════════════════════
 *  새 확장 - 페이지/섹션/열 구분 (Break Extensions)
 * ═══════════════════════════════════════════════ */

/**
 * 페이지 나누기 노드 확장
 * Ctrl+Enter로 페이지 구분선을 삽입한다.
 */
export const PageBreak = Node.create({
  name: "pageBreak",
  group: "block",
  atom: true,

  parseHTML() {
    return [{ tag: 'div[data-type="page-break"]' }];
  },

  renderHTML() {
    return ["div", { class: "page-break", "data-type": "page-break" }];
  },

  addCommands() {
    return {
      /** @returns {boolean} 체인 호환용 */
      setPageBreak:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name }),
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Enter": () => this.editor.commands.setPageBreak(),
    };
  },
});

/** 섹션 나누기에 사용할 수 있는 유형 */
const SECTION_BREAK_TYPES = ["next-page", "continuous", "even-page", "odd-page"];

/**
 * 섹션 나누기 노드 확장
 * 문서를 논리적 섹션으로 분리하며, 섹션별 레이아웃 설정이 가능하다.
 *
 * @param {string} sectionType - "next-page" | "continuous" | "even-page" | "odd-page"
 */
export const SectionBreak = Node.create({
  name: "sectionBreak",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      sectionType: {
        default: "next-page",
        parseHTML: (el) => el.getAttribute("data-section-type") || "next-page",
        renderHTML: (attrs) => ({ "data-section-type": attrs.sectionType }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="section-break"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      {
        class: "section-break",
        "data-type": "section-break",
        ...HTMLAttributes,
      },
    ];
  },

  addCommands() {
    return {
      /**
       * 섹션 나누기를 삽입한다.
       * @param {string} type - 섹션 나누기 유형 (기본값: "next-page")
       */
      setSectionBreak:
        (type = "next-page") =>
        ({ commands }) => {
          const sectionType = SECTION_BREAK_TYPES.includes(type) ? type : "next-page";
          return commands.insertContent({
            type: this.name,
            attrs: { sectionType },
          });
        },
    };
  },
});

/**
 * 열(컬럼) 나누기 노드 확장
 * 다단 레이아웃에서 다음 열로 콘텐츠를 이동시킨다.
 */
export const ColumnBreak = Node.create({
  name: "columnBreak",
  group: "block",
  atom: true,

  parseHTML() {
    return [{ tag: 'div[data-type="column-break"]' }];
  },

  renderHTML() {
    return ["div", { class: "column-break", "data-type": "column-break" }];
  },

  addCommands() {
    return {
      setColumnBreak:
        () =>
        ({ commands }) =>
          commands.insertContent({ type: this.name }),
    };
  },
});

/* ═══════════════════════════════════════════════
 *  새 확장 - 텍스트 스타일 속성 (TextStyle Attributes)
 * ═══════════════════════════════════════════════ */

/**
 * 자간(글자 간격) 확장
 * textStyle 마크에 letterSpacing 속성을 추가한다.
 *
 * @example editor.commands.setLetterSpacing("1px")
 */
export const LetterSpacing = Extension.create({
  name: "letterSpacing",

  addOptions() {
    return { types: ["textStyle"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          letterSpacing: {
            default: null,
            parseHTML: (el) => el.style.letterSpacing || null,
            renderHTML: (attrs) => {
              if (!attrs.letterSpacing) return {};
              return { style: `letter-spacing: ${attrs.letterSpacing}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      /** @param {string} value - CSS 자간 값 (예: "0.5px", "1px", "-0.5px") */
      setLetterSpacing:
        (value) =>
        ({ chain }) =>
          chain().setMark("textStyle", { letterSpacing: value }).run(),
      unsetLetterSpacing:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { letterSpacing: null }).removeEmptyTextStyle().run(),
    };
  },
});

/**
 * 텍스트 그림자 확장
 * textStyle 마크에 textShadow 속성을 추가한다.
 *
 * @example editor.commands.setTextShadow("2px 2px 4px rgba(0,0,0,0.3)")
 */
export const TextShadow = Extension.create({
  name: "textShadow",

  addOptions() {
    return { types: ["textStyle"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textShadow: {
            default: null,
            parseHTML: (el) => el.style.textShadow || null,
            renderHTML: (attrs) => {
              if (!attrs.textShadow) return {};
              return { style: `text-shadow: ${attrs.textShadow}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      /** @param {string} value - CSS text-shadow 값 */
      setTextShadow:
        (value) =>
        ({ chain }) =>
          chain().setMark("textStyle", { textShadow: value }).run(),
      unsetTextShadow:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { textShadow: null }).removeEmptyTextStyle().run(),
    };
  },
});

/**
 * 텍스트 테두리 확장
 * textStyle 마크에 테두리(border) 속성을 추가한다.
 * 글자 주위에 외곽선을 표시할 때 사용한다.
 *
 * @example editor.commands.setTextBorder("1px solid #000")
 */
export const TextBorder = Extension.create({
  name: "textBorder",

  addOptions() {
    return { types: ["textStyle"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          textBorder: {
            default: null,
            parseHTML: (el) => el.style.border || null,
            renderHTML: (attrs) => {
              if (!attrs.textBorder) return {};
              return { style: `border: ${attrs.textBorder}; padding: 1px 2px` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      /** @param {string} value - CSS border 값 (예: "1px solid #000") */
      setTextBorder:
        (value) =>
        ({ chain }) =>
          chain().setMark("textStyle", { textBorder: value }).run(),
      unsetTextBorder:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { textBorder: null }).removeEmptyTextStyle().run(),
    };
  },
});

/* ═══════════════════════════════════════════════
 *  새 확장 - 단락 속성 (Paragraph Attributes)
 * ═══════════════════════════════════════════════ */

/**
 * 선택된 단락 노드에 속성을 일괄 적용하는 헬퍼 함수
 * 여러 단락 확장에서 공통으로 사용한다.
 *
 * @param {string[]} types - 대상 노드 타입 목록
 * @param {Object} attrsToSet - 설정할 속성 객체
 * @returns {function} TipTap 커맨드 함수
 */
function applyToSelectedParagraphs(types, attrsToSet) {
  return ({ tr, state, dispatch }) => {
    const { from, to } = state.selection;
    let applied = false;
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (types.includes(node.type.name)) {
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrsToSet });
        applied = true;
      }
    });
    if (applied && dispatch) dispatch(tr);
    return true;
  };
}

/**
 * 단락 테두리 및 배경 음영 확장
 * 단락별로 상하좌우 테두리와 배경색을 설정할 수 있다.
 *
 * @example editor.commands.setParagraphBorder({ borderBottom: "1px solid #000" })
 * @example editor.commands.setParagraphShading("#f0f0f0")
 */
export const ParagraphBorder = Extension.create({
  name: "paragraphBorder",

  addOptions() {
    return { types: ["paragraph", "heading"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          borderTop: {
            default: null,
            parseHTML: (el) => el.style.borderTop || null,
            renderHTML: (attrs) => {
              if (!attrs.borderTop) return {};
              return { style: `border-top: ${attrs.borderTop}` };
            },
          },
          borderBottom: {
            default: null,
            parseHTML: (el) => el.style.borderBottom || null,
            renderHTML: (attrs) => {
              if (!attrs.borderBottom) return {};
              return { style: `border-bottom: ${attrs.borderBottom}` };
            },
          },
          borderLeft: {
            default: null,
            parseHTML: (el) => el.style.borderLeft || null,
            renderHTML: (attrs) => {
              if (!attrs.borderLeft) return {};
              return { style: `border-left: ${attrs.borderLeft}` };
            },
          },
          borderRight: {
            default: null,
            parseHTML: (el) => el.style.borderRight || null,
            renderHTML: (attrs) => {
              if (!attrs.borderRight) return {};
              return { style: `border-right: ${attrs.borderRight}` };
            },
          },
          borderColor: {
            default: null,
            parseHTML: (el) => el.style.borderColor || null,
            renderHTML: (attrs) => {
              if (!attrs.borderColor) return {};
              return { style: `border-color: ${attrs.borderColor}` };
            },
          },
          backgroundColor: {
            default: null,
            parseHTML: (el) => el.style.backgroundColor || null,
            renderHTML: (attrs) => {
              if (!attrs.backgroundColor) return {};
              return { style: `background-color: ${attrs.backgroundColor}` };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      /**
       * 단락 테두리를 설정한다.
       * @param {Object} sides - 테두리 속성 (borderTop, borderBottom, borderLeft, borderRight, borderColor)
       */
      setParagraphBorder:
        (sides) =>
        applyToSelectedParagraphs(this.options.types, sides),

      /**
       * 단락 배경 음영을 설정한다.
       * @param {string} color - CSS 색상 값
       */
      setParagraphShading:
        (color) =>
        applyToSelectedParagraphs(this.options.types, { backgroundColor: color }),

      /** 단락 테두리와 배경을 모두 제거한다 */
      unsetParagraphBorder:
        () =>
        applyToSelectedParagraphs(this.options.types, {
          borderTop: null,
          borderBottom: null,
          borderLeft: null,
          borderRight: null,
          borderColor: null,
          backgroundColor: null,
        }),
    };
  },
});

/**
 * 드롭 캡(첫글자 장식) 확장
 * 단락의 첫 글자를 크게 표시하는 Word의 드롭 캡 기능을 구현한다.
 *
 * @example editor.commands.setDropCap("dropped")
 */
export const DropCap = Extension.create({
  name: "dropCap",

  addOptions() {
    return { types: ["paragraph"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          dropCap: {
            default: "none",
            parseHTML: (el) => el.getAttribute("data-drop-cap") || "none",
            renderHTML: (attrs) => {
              if (!attrs.dropCap || attrs.dropCap === "none") return {};
              return { "data-drop-cap": attrs.dropCap };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      /**
       * 드롭 캡 유형을 설정한다.
       * @param {string} type - "none" | "dropped" | "in-margin"
       */
      setDropCap:
        (type) =>
        applyToSelectedParagraphs(this.options.types, { dropCap: type }),
      unsetDropCap:
        () =>
        applyToSelectedParagraphs(this.options.types, { dropCap: "none" }),
    };
  },
});

/**
 * 다음 단락과 함께 유지 확장
 * 페이지 나눔 시 현재 단락과 다음 단락이 분리되지 않도록 한다.
 * Word의 "다음 단락과 함께" 옵션에 해당한다.
 */
export const KeepWithNext = Extension.create({
  name: "keepWithNext",

  addOptions() {
    return { types: ["paragraph", "heading"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          keepWithNext: {
            default: false,
            parseHTML: (el) => el.getAttribute("data-keep-with-next") === "true",
            renderHTML: (attrs) => {
              if (!attrs.keepWithNext) return {};
              return { "data-keep-with-next": "true" };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      /** @param {boolean} value - 다음 단락과 함께 유지 여부 */
      setKeepWithNext:
        (value) =>
        applyToSelectedParagraphs(this.options.types, { keepWithNext: !!value }),
    };
  },
});

/**
 * 과부/고아 줄 방지 확장
 * 페이지 상단에 단락의 마지막 줄만 남거나(과부),
 * 페이지 하단에 단락의 첫 줄만 남는(고아) 것을 방지한다.
 * Word에서는 기본적으로 활성화되어 있다.
 */
export const WidowOrphan = Extension.create({
  name: "widowOrphan",

  addOptions() {
    return { types: ["paragraph", "heading"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          widowOrphan: {
            default: true,
            parseHTML: (el) => el.getAttribute("data-widow-orphan") !== "false",
            renderHTML: (attrs) => {
              // 기본값(true)이면 속성을 렌더링하지 않는다
              if (attrs.widowOrphan !== false) return {};
              return { "data-widow-orphan": "false" };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      /** @param {boolean} value - 과부/고아 줄 방지 활성화 여부 */
      setWidowOrphan:
        (value) =>
        applyToSelectedParagraphs(this.options.types, { widowOrphan: !!value }),
    };
  },
});

/**
 * 텍스트 방향(RTL/LTR) 확장
 * 단락의 텍스트 방향을 왼쪽→오른쪽 또는 오른쪽→왼쪽으로 설정한다.
 * 아랍어, 히브리어 등 RTL 언어 지원에 사용한다.
 */
export const TextDirection = Extension.create({
  name: "textDirection",

  addOptions() {
    return { types: ["paragraph", "heading"] };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          direction: {
            default: null,
            parseHTML: (el) => el.getAttribute("dir") || null,
            renderHTML: (attrs) => {
              if (!attrs.direction) return {};
              return { dir: attrs.direction };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      /** @param {string} value - "ltr" 또는 "rtl" */
      setTextDirection:
        (value) =>
        applyToSelectedParagraphs(this.options.types, { direction: value }),
    };
  },
});

/* ═══════════════════════════════════════════════
 *  새 확장 - 인라인 노드 (Inline Node)
 * ═══════════════════════════════════════════════ */

/**
 * 책갈피(Bookmark) 인라인 노드 확장
 * 문서 내 특정 위치에 이름 있는 앵커를 삽입하여, 하이퍼링크 대상으로 사용한다.
 * 너비가 0인 인라인 요소로 렌더링된다.
 */
export const Bookmark = Node.create({
  name: "bookmark",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-bookmark-id"),
        renderHTML: (attrs) => ({ "data-bookmark-id": attrs.id }),
      },
      name: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-bookmark-name"),
        renderHTML: (attrs) => ({ "data-bookmark-name": attrs.name }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span.bookmark-anchor" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", { class: "bookmark-anchor", ...HTMLAttributes }];
  },

  addCommands() {
    return {
      /**
       * 현재 커서 위치에 책갈피를 삽입한다.
       * @param {string} name - 책갈피 이름 (고유해야 함)
       */
      setBookmark:
        (name) =>
        ({ commands }) => {
          const bookmarkId = `bm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          return commands.insertContent({
            type: this.name,
            attrs: { id: bookmarkId, name },
          });
        },

      /**
       * 지정된 이름의 책갈피를 문서에서 제거한다.
       * @param {string} name - 제거할 책갈피 이름
       */
      removeBookmark:
        (name) =>
        ({ tr, state, dispatch }) => {
          let removed = false;
          state.doc.descendants((node, pos) => {
            if (node.type.name === this.name && node.attrs.name === name) {
              tr.delete(pos, pos + node.nodeSize);
              removed = true;
              // 첫 번째 매칭만 삭제하고 종료
              return false;
            }
          });
          if (removed && dispatch) dispatch(tr);
          return removed;
        },
    };
  },
});

/* ═══════════════════════════════════════════════
 *  변경 내용 추적 (Track Changes) 마크 확장
 * ═══════════════════════════════════════════════ */

/**
 * 삽입 추적 마크 - 추가된 텍스트를 표시한다
 * Word의 "변경 내용 추적" 기능 중 삽입에 해당한다.
 */
export const TrackInsert = Mark.create({
  name: "trackInsert",
  inclusive: true,
  excludes: "trackDelete",

  addAttributes() {
    return {
      author: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-author"),
        renderHTML: (attrs) => ({ "data-author": attrs.author }),
      },
      date: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-date"),
        renderHTML: (attrs) => ({ "data-date": attrs.date }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-track="insert"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", {
      ...HTMLAttributes,
      "data-track": "insert",
      class: "track-insert",
    }, 0];
  },

  addCommands() {
    return {
      setTrackInsert:
        (attrs) =>
        ({ commands }) =>
          commands.setMark(this.name, {
            author: attrs?.author || "사용자",
            date: attrs?.date || new Date().toISOString(),
          }),
      unsetTrackInsert:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});

/**
 * 삭제 추적 마크 - 삭제된 텍스트를 표시한다
 * Word의 "변경 내용 추적" 기능 중 삭제에 해당한다.
 */
export const TrackDelete = Mark.create({
  name: "trackDelete",
  inclusive: false,
  excludes: "trackInsert",

  addAttributes() {
    return {
      author: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-author"),
        renderHTML: (attrs) => ({ "data-author": attrs.author }),
      },
      date: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-date"),
        renderHTML: (attrs) => ({ "data-date": attrs.date }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-track="delete"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", {
      ...HTMLAttributes,
      "data-track": "delete",
      class: "track-delete",
    }, 0];
  },

  addCommands() {
    return {
      setTrackDelete:
        (attrs) =>
        ({ commands }) =>
          commands.setMark(this.name, {
            author: attrs?.author || "사용자",
            date: attrs?.date || new Date().toISOString(),
          }),
      unsetTrackDelete:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});

/**
 * 서식 변경 추적 마크 - 서식이 변경된 텍스트를 표시한다
 */
export const TrackFormat = Mark.create({
  name: "trackFormat",
  inclusive: false,

  addAttributes() {
    return {
      author: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-author"),
        renderHTML: (attrs) => ({ "data-author": attrs.author }),
      },
      date: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-date"),
        renderHTML: (attrs) => ({ "data-date": attrs.date }),
      },
      description: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-description"),
        renderHTML: (attrs) => ({ "data-description": attrs.description }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-track="format"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", {
      ...HTMLAttributes,
      "data-track": "format",
      class: "track-format",
    }, 0];
  },

  addCommands() {
    return {
      setTrackFormat:
        (attrs) =>
        ({ commands }) =>
          commands.setMark(this.name, {
            author: attrs?.author || "사용자",
            date: attrs?.date || new Date().toISOString(),
            description: attrs?.description || "",
          }),
      unsetTrackFormat:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    };
  },
});

/**
 * 변경 내용 추적 관리 확장
 * 추적 모드를 활성/비활성화하고, 변경 사항을 수락/거부하는 기능을 제공한다.
 */
const trackChangesPluginKey = new PluginKey("trackChanges");

export const TrackChangesManager = Extension.create({
  name: "trackChangesManager",

  addStorage() {
    return {
      enabled: false,
      author: "사용자",
    };
  },

  /* 입력 시 자동으로 삽입 추적 마크를 적용하는 ProseMirror 플러그인 */
  addProseMirrorPlugins() {
    const extension = this;
    return [
      new Plugin({
        key: trackChangesPluginKey,
        appendTransaction(transactions, oldState, newState) {
          if (!extension.storage.enabled) return null;
          const author = extension.storage.author;
          const date = new Date().toISOString();

          // 사용자 입력에 의한 변경인지 확인
          const isUserAction = transactions.some(tr => tr.docChanged && !tr.getMeta("trackChangesApplied"));
          if (!isUserAction) return null;

          // 새로 삽입된 텍스트에 trackInsert 마크를 적용
          const tr = newState.tr;
          let changed = false;
          const insertMarkType = newState.schema.marks.trackInsert;
          if (!insertMarkType) return null;

          transactions.forEach(transaction => {
            if (!transaction.docChanged) return;
            transaction.steps.forEach((step, stepIdx) => {
              const stepMap = step.getMap();
              stepMap.forEach((oldStart, oldEnd, newStart, newEnd) => {
                // 새로 삽입된 범위에만 마크 적용
                if (newEnd > newStart) {
                  const mark = insertMarkType.create({ author, date });
                  // 이미 trackInsert 마크가 있는지 확인
                  let needsMark = false;
                  newState.doc.nodesBetween(newStart, newEnd, (node) => {
                    if (node.isText && !node.marks.some(m => m.type.name === "trackInsert")) {
                      needsMark = true;
                    }
                  });
                  if (needsMark) {
                    tr.addMark(newStart, newEnd, mark);
                    changed = true;
                  }
                }
              });
            });
          });

          if (changed) {
            tr.setMeta("trackChangesApplied", true);
            return tr;
          }
          return null;
        },
      }),
    ];
  },

  addCommands() {
    return {
      /** 변경 추적 모드를 켜거나 끈다 */
      toggleTrackChanges:
        () =>
        ({ editor: ed }) => {
          ed.storage.trackChangesManager.enabled = !ed.storage.trackChangesManager.enabled;
          return true;
        },

      /** 변경 추적 활성 여부 확인 */
      isTrackChangesEnabled:
        () =>
        ({ editor: ed }) =>
          ed.storage.trackChangesManager.enabled,

      /** 추적 작성자를 설정한다 */
      setTrackAuthor:
        (author) =>
        ({ editor: ed }) => {
          ed.storage.trackChangesManager.author = author;
          return true;
        },

      /** 현재 선택 영역의 변경 사항을 수락한다 */
      acceptChange:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          let changed = false;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!node.isText) return;
            const marks = node.marks;

            // 삽입 추적 마크가 있으면 마크만 제거 (텍스트는 유지)
            const insertMark = marks.find(m => m.type.name === "trackInsert");
            if (insertMark) {
              tr.removeMark(pos, pos + node.nodeSize, insertMark.type);
              changed = true;
            }

            // 삭제 추적 마크가 있으면 텍스트와 마크 모두 제거
            const deleteMark = marks.find(m => m.type.name === "trackDelete");
            if (deleteMark) {
              tr.delete(pos, pos + node.nodeSize);
              changed = true;
            }

            // 서식 추적 마크가 있으면 마크만 제거
            const formatMark = marks.find(m => m.type.name === "trackFormat");
            if (formatMark) {
              tr.removeMark(pos, pos + node.nodeSize, formatMark.type);
              changed = true;
            }
          });

          if (changed && dispatch) dispatch(tr);
          return changed;
        },

      /** 현재 선택 영역의 변경 사항을 거부한다 */
      rejectChange:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          let changed = false;

          state.doc.nodesBetween(from, to, (node, pos) => {
            if (!node.isText) return;
            const marks = node.marks;

            // 삽입 추적 마크가 있으면 텍스트와 마크 모두 제거 (삽입을 되돌림)
            const insertMark = marks.find(m => m.type.name === "trackInsert");
            if (insertMark) {
              tr.delete(pos, pos + node.nodeSize);
              changed = true;
            }

            // 삭제 추적 마크가 있으면 마크만 제거 (텍스트 복원)
            const deleteMark = marks.find(m => m.type.name === "trackDelete");
            if (deleteMark) {
              tr.removeMark(pos, pos + node.nodeSize, deleteMark.type);
              changed = true;
            }

            // 서식 추적 마크가 있으면 마크만 제거
            const formatMark = marks.find(m => m.type.name === "trackFormat");
            if (formatMark) {
              tr.removeMark(pos, pos + node.nodeSize, formatMark.type);
              changed = true;
            }
          });

          if (changed && dispatch) dispatch(tr);
          return changed;
        },

      /** 문서의 모든 변경 사항을 수락한다 */
      acceptAllChanges:
        () =>
        ({ tr, state, dispatch }) => {
          let changed = false;
          const doc = state.doc;

          // 역순으로 처리하여 위치 오프셋 문제 방지
          const deletions = [];
          const removals = [];

          doc.descendants((node, pos) => {
            if (!node.isText) return;
            const marks = node.marks;
            const insertMark = marks.find(m => m.type.name === "trackInsert");
            if (insertMark) {
              removals.push({ from: pos, to: pos + node.nodeSize, type: insertMark.type });
            }
            const deleteMark = marks.find(m => m.type.name === "trackDelete");
            if (deleteMark) {
              deletions.push({ from: pos, to: pos + node.nodeSize });
            }
            const formatMark = marks.find(m => m.type.name === "trackFormat");
            if (formatMark) {
              removals.push({ from: pos, to: pos + node.nodeSize, type: formatMark.type });
            }
          });

          // 역순으로 삭제 (위치 안정성)
          deletions.sort((a, b) => b.from - a.from);
          for (const del of deletions) {
            tr.delete(del.from, del.to);
            changed = true;
          }
          for (const rem of removals) {
            tr.removeMark(rem.from, rem.to, rem.type);
            changed = true;
          }

          if (changed && dispatch) dispatch(tr);
          return changed;
        },

      /** 문서의 모든 변경 사항을 거부한다 */
      rejectAllChanges:
        () =>
        ({ tr, state, dispatch }) => {
          let changed = false;
          const doc = state.doc;
          const insertions = [];
          const removals = [];

          doc.descendants((node, pos) => {
            if (!node.isText) return;
            const marks = node.marks;
            const insertMark = marks.find(m => m.type.name === "trackInsert");
            if (insertMark) {
              insertions.push({ from: pos, to: pos + node.nodeSize });
            }
            const deleteMark = marks.find(m => m.type.name === "trackDelete");
            if (deleteMark) {
              removals.push({ from: pos, to: pos + node.nodeSize, type: deleteMark.type });
            }
            const formatMark = marks.find(m => m.type.name === "trackFormat");
            if (formatMark) {
              removals.push({ from: pos, to: pos + node.nodeSize, type: formatMark.type });
            }
          });

          insertions.sort((a, b) => b.from - a.from);
          for (const ins of insertions) {
            tr.delete(ins.from, ins.to);
            changed = true;
          }
          for (const rem of removals) {
            tr.removeMark(rem.from, rem.to, rem.type);
            changed = true;
          }

          if (changed && dispatch) dispatch(tr);
          return changed;
        },
    };
  },
});

/* ═══════════════════════════════════════════════
 *  페이지 번호 노드 확장
 * ═══════════════════════════════════════════════ */

/**
 * 페이지 번호 필드 노드
 * 문서 내에 동적 페이지 번호를 표시하는 인라인 노드이다.
 * Word의 {PAGE}, {NUMPAGES} 필드 코드에 해당한다.
 */
export const PageNumberField = Node.create({
  name: "pageNumberField",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      fieldType: {
        default: "page",
        parseHTML: (el) => el.getAttribute("data-field-type") || "page",
        renderHTML: (attrs) => ({ "data-field-type": attrs.fieldType }),
      },
      format: {
        default: "decimal",
        parseHTML: (el) => el.getAttribute("data-format") || "decimal",
        renderHTML: (attrs) => ({ "data-format": attrs.format }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span.page-number-field" }];
  },

  renderHTML({ HTMLAttributes }) {
    const fieldType = HTMLAttributes["data-field-type"] || "page";
    const displayText = fieldType === "page" ? "#" : "##";
    return ["span", {
      ...HTMLAttributes,
      class: "page-number-field",
      contenteditable: "false",
      style: "background:#e8f0fe;padding:1px 4px;border-radius:2px;font-size:inherit;color:#444;cursor:default;",
    }, displayText];
  },

  addCommands() {
    return {
      /** 현재 페이지 번호 필드를 삽입한다 */
      insertPageNumber:
        (format = "decimal") =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { fieldType: "page", format },
          }),

      /** 전체 페이지 수 필드를 삽입한다 */
      insertTotalPages:
        (format = "decimal") =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { fieldType: "totalPages", format },
          }),
    };
  },
});

/**
 * 날짜/시간 필드 노드
 * 현재 날짜를 자동으로 삽입하는 인라인 노드이다.
 */
export const DateField = Node.create({
  name: "dateField",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      format: {
        default: "korean",
        parseHTML: (el) => el.getAttribute("data-date-format") || "korean",
        renderHTML: (attrs) => ({ "data-date-format": attrs.format }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "span.date-field" }];
  },

  renderHTML({ HTMLAttributes }) {
    const now = new Date();
    const format = HTMLAttributes["data-date-format"] || "korean";
    let display;
    switch (format) {
      case "iso": display = now.toISOString().split("T")[0]; break;
      case "us": display = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`; break;
      default: display = `${now.getFullYear()}년 ${now.getMonth() + 1}월 ${now.getDate()}일`;
    }
    return ["span", {
      ...HTMLAttributes,
      class: "date-field",
      contenteditable: "false",
      style: "background:#e8f0fe;padding:1px 4px;border-radius:2px;font-size:inherit;color:#444;cursor:default;",
    }, display];
  },

  addCommands() {
    return {
      insertDateField:
        (format = "korean") =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: { format },
          }),
    };
  },
});

/* ═══════════════════════════════════════════════
 *  비공백 문자(Non-Breaking Space) 확장
 * ═══════════════════════════════════════════════ */

/**
 * 줄바꿈 없는 공백을 삽입하는 확장
 * Ctrl+Shift+Space로 삽입할 수 있다.
 */
export const NonBreakingSpace = Extension.create({
  name: "nonBreakingSpace",

  addCommands() {
    return {
      insertNonBreakingSpace:
        () =>
        ({ commands }) =>
          commands.insertContent("\u00A0"),
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-Shift-Space": () => this.editor.commands.insertNonBreakingSpace(),
    };
  },
});

/* ═══════════════════════════════════════════════
 *  줄 번호(Line Numbers) 단락 속성 확장
 * ═══════════════════════════════════════════════ */

/**
 * 줄 번호 표시 확장
 * 문서 전체 또는 구역별로 줄 번호를 표시할 수 있다.
 */
export const LineNumbers = Extension.create({
  name: "lineNumbers",

  addStorage() {
    return {
      enabled: false,
      startAt: 1,
      countBy: 1,
      restartEachPage: true,
    };
  },

  addCommands() {
    return {
      toggleLineNumbers:
        () =>
        ({ editor: ed }) => {
          ed.storage.lineNumbers.enabled = !ed.storage.lineNumbers.enabled;
          return true;
        },
      setLineNumberOptions:
        (opts) =>
        ({ editor: ed }) => {
          Object.assign(ed.storage.lineNumbers, opts);
          return true;
        },
    };
  },
});
