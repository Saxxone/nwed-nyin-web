import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import {
  clipboardHtmlLooksStructured,
  looksLikeMarkdown,
  markdownToEditorHtmlSync,
} from "~/utils/article-markdown-bridge";

const markdownPasteKey = new PluginKey("nwedMarkdownPaste");

/**
 * When users paste markdown (from an editor, GitHub, etc.), parse it to HTML so
 * TipTap applies headings, lists, and links instead of inserting literal # / ## characters.
 *
 * Implemented as a ProseMirror plugin because TipTap v3 extensions do not support
 * `addEditorProps` — that hook never ran, so paste was never intercepted.
 */
export const MarkdownPaste = Extension.create({
  name: "markdownPaste",
  priority: 1000,

  addProseMirrorPlugins() {
    const editor = this.editor;

    return [
      new Plugin({
        key: markdownPasteKey,
        props: {
          handlePaste(_view, event) {
            const cd = event.clipboardData;
            if (!cd) return false;

            const plain = cd.getData("text/plain");
            if (!plain?.trim()) return false;

            if (!looksLikeMarkdown(plain)) return false;

            const html = cd.getData("text/html") ?? "";
            if (html.trim() && clipboardHtmlLooksStructured(html)) return false;

            event.preventDefault();

            const fragment = markdownToEditorHtmlSync(plain);
            editor.chain().focus().insertContent(fragment).run();

            return true;
          },
        },
      }),
    ];
  },
});
