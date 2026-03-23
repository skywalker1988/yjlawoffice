/**
 * Footnote Extension for Tiptap
 *
 * FootnoteReference: 본문 내 위첨자 번호 (인라인 atomic 노드)
 * 각주 내용은 별도 React state로 관리 (ProseMirror 밖)
 *
 * 번호는 문서 순서 기반 자동 계산
 * 삭제 시 나머지 각주 번호 자동 재계산
 */
import { Node, mergeAttributes } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

const footnotePluginKey = new PluginKey("footnote");

export const FootnoteReference = Node.create({
  name: "footnoteReference",
  group: "inline",
  inline: true,
  atom: true, // 편집 불가, 단일 단위
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      footnoteId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-footnote-id"),
        renderHTML: (attrs) => ({ "data-footnote-id": attrs.footnoteId }),
      },
      number: {
        default: 1,
        parseHTML: (el) => parseInt(el.getAttribute("data-footnote-number")) || 1,
        renderHTML: (attrs) => ({ "data-footnote-number": attrs.number }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'sup[data-footnote-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "sup",
      mergeAttributes(HTMLAttributes, {
        class: "footnote-ref",
        style: "color: #0563C1; cursor: pointer; font-size: 0.75em; vertical-align: super; font-weight: 600;",
      }),
      String(HTMLAttributes["data-footnote-number"] || "?"),
    ];
  },

  addNodeView() {
    return ({ node, getPos, editor }) => {
      const dom = document.createElement("sup");
      dom.className = "footnote-ref";
      dom.textContent = String(node.attrs.number);
      dom.setAttribute("data-footnote-id", node.attrs.footnoteId || "");
      dom.setAttribute("data-footnote-number", node.attrs.number);
      dom.style.cssText = "color: #0563C1; cursor: pointer; font-size: 0.75em; vertical-align: super; font-weight: 600; padding: 0 1px; transition: background 0.1s;";

      // Click → scroll to footnote area
      dom.addEventListener("click", (e) => {
        e.stopPropagation();
        const fnId = node.attrs.footnoteId;
        const fnEl = document.querySelector(`[data-footnote-item-id="${fnId}"]`);
        if (fnEl) {
          fnEl.scrollIntoView({ behavior: "smooth", block: "center" });
          fnEl.style.background = "#fff3cd";
          setTimeout(() => { fnEl.style.background = ""; }, 2000);
        }
      });

      // Hover → show tooltip
      dom.addEventListener("mouseenter", () => {
        dom.style.background = "#dbeafe";
        dom.style.borderRadius = "2px";
        // Show tooltip with footnote content
        const fnId = node.attrs.footnoteId;
        const existing = document.querySelector(".footnote-tooltip");
        if (existing) existing.remove();

        // Get footnote content from the footnote area
        const fnEl = document.querySelector(`[data-footnote-item-id="${fnId}"]`);
        if (fnEl) {
          const tooltip = document.createElement("div");
          tooltip.className = "footnote-tooltip";
          const content = fnEl.querySelector(".footnote-item-content");
          tooltip.textContent = content?.textContent || "(각주 내용 없음)";
          tooltip.style.cssText = `
            position: fixed; z-index: 9999;
            background: #333; color: #fff; padding: 6px 10px;
            border-radius: 4px; font-size: 11px; max-width: 300px;
            pointer-events: none; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          `;
          const rect = dom.getBoundingClientRect();
          tooltip.style.left = rect.left + "px";
          tooltip.style.top = (rect.bottom + 4) + "px";
          document.body.appendChild(tooltip);
        }
      });

      dom.addEventListener("mouseleave", () => {
        dom.style.background = "";
        const tooltip = document.querySelector(".footnote-tooltip");
        if (tooltip) tooltip.remove();
      });

      return {
        dom,
        update(updatedNode) {
          if (updatedNode.type.name !== "footnoteReference") return false;
          dom.textContent = String(updatedNode.attrs.number);
          dom.setAttribute("data-footnote-id", updatedNode.attrs.footnoteId || "");
          dom.setAttribute("data-footnote-number", updatedNode.attrs.number);
          return true;
        },
        destroy() {
          const tooltip = document.querySelector(".footnote-tooltip");
          if (tooltip) tooltip.remove();
        },
      };
    };
  },

  addCommands() {
    return {
      insertFootnote:
        (footnoteId) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: "footnoteReference",
              attrs: { footnoteId, number: 0 }, // number will be recalculated
            })
            .run();
        },
      removeFootnote:
        (footnoteId) =>
        ({ tr, state, dispatch }) => {
          let found = false;
          state.doc.descendants((node, pos) => {
            if (node.type.name === "footnoteReference" && node.attrs.footnoteId === footnoteId) {
              tr.delete(pos, pos + node.nodeSize);
              found = true;
              return false; // stop
            }
          });
          if (found && dispatch) dispatch(tr);
          return found;
        },
      renumberFootnotes:
        () =>
        ({ tr, state, dispatch }) => {
          let counter = 1;
          let changed = false;
          state.doc.descendants((node, pos) => {
            if (node.type.name === "footnoteReference") {
              if (node.attrs.number !== counter) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  number: counter,
                });
                changed = true;
              }
              counter++;
            }
          });
          if (changed && dispatch) dispatch(tr);
          return true;
        },
      getFootnoteIds:
        () =>
        ({ state }) => {
          const ids = [];
          state.doc.descendants((node) => {
            if (node.type.name === "footnoteReference") {
              ids.push(node.attrs.footnoteId);
            }
          });
          return ids;
        },
    };
  },

  // Plugin to auto-renumber on every transaction
  addProseMirrorPlugins() {
    const extension = this;
    return [
      new Plugin({
        key: footnotePluginKey,
        appendTransaction(transactions, oldState, newState) {
          // Check if any footnote references changed
          let hasFootnoteChange = false;
          for (const tr of transactions) {
            if (tr.docChanged) {
              hasFootnoteChange = true;
              break;
            }
          }
          if (!hasFootnoteChange) return null;

          // Renumber all footnote references
          const tr = newState.tr;
          let counter = 1;
          let changed = false;
          newState.doc.descendants((node, pos) => {
            if (node.type.name === "footnoteReference") {
              if (node.attrs.number !== counter) {
                tr.setNodeMarkup(pos, undefined, {
                  ...node.attrs,
                  number: counter,
                });
                changed = true;
              }
              counter++;
            }
          });
          return changed ? tr : null;
        },
      }),
    ];
  },
});

/**
 * Helper: Generate unique footnote ID
 */
export function generateFootnoteId() {
  return "fn-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7);
}

/**
 * Helper: Get all footnote reference IDs from editor state
 */
export function getFootnoteIdsFromDoc(doc) {
  const ids = [];
  doc.descendants((node) => {
    if (node.type.name === "footnoteReference") {
      ids.push({ id: node.attrs.footnoteId, number: node.attrs.number });
    }
  });
  return ids;
}
