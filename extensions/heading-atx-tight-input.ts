import { Extension, InputRule } from "@tiptap/core";

/**
 * ATX headings without a space after the hashes (`#Also`) — CommonMark allows this.
 * TipTap's default heading input rules only match `#␠` (hash + space) before more text.
 *
 * Triggers when the user presses Space after the heading text (`#Also␠`) or Enter at end of line.
 */
export const HeadingAtxTightInput = Extension.create({
  name: "headingAtxTightInput",
  priority: 55,

  addInputRules() {
    return [
      new InputRule({
        find: /^(#{1,6})(\S+)\s$/,
        handler: ({ range, match, chain }) => {
          const level = match[1].length;
          if (level > 6) return null;
          const title = match[2];
          if (!title) return null;

          return chain()
            .deleteRange({ from: range.from, to: range.to })
            .insertContentAt(range.from, {
              type: "heading",
              attrs: { level },
              content: [{ type: "text", text: title }],
            })
            .setTextSelection(range.from + title.length)
            .run();
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => {
        const { state } = this.editor;
        const { selection } = state;
        const { $from } = selection;
        if (!$from.parent.isTextblock || $from.parent.type.name === "heading")
          return false;
        if (!selection.empty) return false;

        const text = $from.parent.textContent;
        const m = text.match(/^(#{1,6})(\S+)$/);
        if (!m) return false;

        const level = m[1].length;
        const title = m[2];
        const start = $from.start();
        const end = $from.end();

        return this.editor
          .chain()
          .focus()
          .deleteRange({ from: start, to: end })
          .insertContentAt(start, {
            type: "heading",
            attrs: { level },
            content: [{ type: "text", text: title }],
          })
          .setTextSelection(start + title.length)
          .run();
      },
    };
  },
});
