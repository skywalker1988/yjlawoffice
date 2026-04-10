/**
 * useDocDetailEditor — TipTap 에디터 초기화 훅
 * FontSize 커스텀 확장 포함, 문서 상세 전용 에디터 설정
 */
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Highlight } from "@tiptap/extension-highlight";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Link as TipTapLink } from "@tiptap/extension-link";
import { Image as TipTapImage } from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Subscript } from "@tiptap/extension-subscript";
import { Superscript } from "@tiptap/extension-superscript";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { CharacterCount } from "@tiptap/extension-character-count";
import { FontFamily } from "@tiptap/extension-font-family";
import { Extension } from "@tiptap/core";

/**
 * FontSize — TextStyle 속성 확장
 * setFontSize / unsetFontSize 커맨드를 제공
 */
const FontSize = Extension.create({
  name: "fontSize",
  addOptions() { return { types: ["textStyle"] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (el) => el.style.fontSize || null,
          renderHTML: (attrs) => {
            if (!attrs.fontSize) return {};
            return { style: `font-size: ${attrs.fontSize}` };
          },
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (fontSize) => ({ chain }) => {
        return chain().setMark("textStyle", { fontSize }).run();
      },
      unsetFontSize: () => ({ chain }) => {
        return chain().setMark("textStyle", { fontSize: null }).removeEmptyTextStyle().run();
      },
    };
  },
});

/**
 * 문서 상세 에디터 훅
 * @param {Function} onUpdate - 에디터 내용 변경 시 호출될 콜백 (HTML 문자열)
 * @returns {import("@tiptap/react").Editor | null}
 */
export function useDocDetailEditor(onUpdate) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right", "justify"],
        defaultAlignment: "left",
      }),
      Highlight.configure({ multicolor: true, HTMLAttributes: {} }),
      TextStyle,
      Color,
      FontFamily.configure({ types: ["textStyle"] }),
      FontSize,
      TipTapLink.configure({ openOnClick: false }),
      TipTapImage,
      Table.configure({ resizable: true }),
      TableRow, TableCell, TableHeader,
      Placeholder.configure({ placeholder: "여기에 내용을 입력하세요..." }),
      Subscript, Superscript,
      TaskList, TaskItem.configure({ nested: true }),
      CharacterCount,
    ],
    content: "",
    onUpdate: ({ editor: ed }) => {
      if (onUpdate) onUpdate(ed.getHTML());
    },
  });

  return editor;
}
