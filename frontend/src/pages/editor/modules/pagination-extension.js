/**
 * 시각적 페이지네이션 확장 (Visual Pagination Extension)
 * 에디터 콘텐츠에 페이지 나누기 위치 정보를 전달하는 ProseMirror 플러그인.
 * EditorPage에서 계산한 pageBreak 정보를 트랜잭션 메타로 받아 데코레이션을 적용한다.
 */
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

/** 플러그인 키 — 외부에서 setMeta로 breaks 정보를 전달할 때 사용 */
export const visualPaginationKey = new PluginKey("visualPagination");

/**
 * VisualPagination TipTap 확장
 * - 페이지 나누기 위치를 받아 에디터 상태에 저장한다.
 * - EditorPage의 applyPageBreaks에서 계산된 breaks 배열을
 *   트랜잭션 메타로 전달하면, 플러그인이 이를 상태로 보관한다.
 */
export const VisualPagination = Extension.create({
  name: "visualPagination",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: visualPaginationKey,

        state: {
          init() {
            return { breaks: [] };
          },
          apply(tr, prev) {
            const meta = tr.getMeta(visualPaginationKey);
            if (meta) return meta;
            return prev;
          },
        },
      }),
    ];
  },
});
