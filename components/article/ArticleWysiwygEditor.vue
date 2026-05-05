<script setup lang="ts">
import Placeholder from "@tiptap/extension-placeholder";
import {
  Table,
  TableRow,
} from "@tiptap/extension-table";
import StarterKit from "@tiptap/starter-kit";
import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import ArticleTableBubbleMenu from "~/components/article/ArticleTableBubbleMenu.vue";
import { ArticleImageFigure } from "~/extensions/article-image-figure";
import { HeadingAtxTightInput } from "~/extensions/heading-atx-tight-input";
import { MarkdownPaste } from "~/extensions/markdown-paste";
import type { ArticleImagePosition } from "~/utils/article-editor";
import { normalizeArticleImagePosition } from "~/utils/article-editor";
import {
  editorHtmlToMarkdown,
  markdownToEditorHtml,
  normalizePastedHtmlProseForEditor,
} from "~/utils/article-markdown-bridge";
import { ref, watch } from "vue";
import {
  ArticleTableCell,
  ArticleTableHeader,
} from "~/extensions/article-table-cells";

async function setEditorHtmlFromMarkdown(
  ed: Editor,
  md: string,
): Promise<void> {
  const html = await markdownToEditorHtml(md);
  ed.commands.setContent(html, { emitUpdate: false });
}

const props = withDefaults(
  defineProps<{
    modelValue: string;
    disabled?: boolean;
  }>(),
  { disabled: false },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const lastEmittedMd = ref(props.modelValue);

const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
      link: {
        openOnClick: false,
        autolink: true,
      },
    }),
    Table.configure({
      resizable: true,
      renderWrapper: true,
      cellMinWidth: 72,
      handleWidth: 6,
      lastColumnResizable: true,
    }),
    ArticleTableCell,
    ArticleTableHeader,
    TableRow,
    Placeholder.configure({
      placeholder: "Start writing…",
    }),
    ArticleImageFigure,
    HeadingAtxTightInput,
    MarkdownPaste,
  ],
  editorProps: {
    attributes: {
      class:
        "article-content prose prose-sm max-w-none min-h-[55vh] cursor-text rounded-lg bg-base-light p-3 dark:prose-invert focus:outline-none sm:min-h-96 sm:p-4 sm:text-base",
    },
    transformPastedHTML(html) {
      return normalizePastedHtmlProseForEditor(html);
    },
  },
  editable: !props.disabled,
  onUpdate: ({ editor: ed }) => {
    const md = editorHtmlToMarkdown(ed.getHTML());
    if (md === lastEmittedMd.value) return;
    lastEmittedMd.value = md;
    emit("update:modelValue", md);
  },
});

watch(
  () => props.disabled,
  (d) => {
    editor.value?.setEditable(!d);
  },
);

watch(
  () => editor.value,
  async (ed) => {
    if (!ed) return;
    await setEditorHtmlFromMarkdown(ed, props.modelValue);
    lastEmittedMd.value = props.modelValue;
  },
  { flush: "post" },
);

watch(
  () => props.modelValue,
  async (md) => {
    const ed = editor.value;
    if (!ed) return;
    if (md === lastEmittedMd.value) return;
    await setEditorHtmlFromMarkdown(ed, md);
    lastEmittedMd.value = md;
  },
);

defineExpose({
  focus: () => {
    editor.value?.chain().focus().run();
  },
  getTiptap: (): Editor | undefined => editor.value,
  insertArticleFigure(payload: {
    src: string;
    alt: string;
    caption: string;
    position?: ArticleImagePosition;
    width?: number | null;
    height?: number | null;
  }) {
    const ed = editor.value;
    if (!ed) return;
    const position = normalizeArticleImagePosition(payload.position);
    const width =
      typeof payload.width === "number" &&
      payload.width > 0 &&
      Number.isFinite(payload.width)
        ? payload.width
        : null;
    const height =
      typeof payload.height === "number" &&
      payload.height > 0 &&
      Number.isFinite(payload.height)
        ? payload.height
        : null;
    ed.chain()
      .focus()
      .insertContent({
        type: "articleImageFigure",
        attrs: {
          src: payload.src,
          alt: payload.alt,
          caption: payload.caption,
          position,
          width,
          height,
        },
      })
      .run();
  },
});
</script>

<template>
  <div class="min-h-[55vh] sm:min-h-96">
    <ArticleTableBubbleMenu :editor="editor ?? undefined" />
    <EditorContent v-if="editor" :editor="editor" />
  </div>
</template>

<style scoped>
/* TipTap tables: visible grid while editing (matches public article table treatment). */
:deep(.article-content table) {
  border-collapse: collapse;
}
:deep(.article-content th),
:deep(.article-content td) {
  border-width: 1px;
  border-style: solid;
  border-color: rgb(229 231 235);
  padding: 0.375rem 0.5rem;
  vertical-align: top;
}
:global(.dark) :deep(.article-content th),
:global(.dark) :deep(.article-content td) {
  border-color: rgb(31 41 55);
}
/* ProseMirror column resize (from @tiptap/pm tables) */
:deep(.column-resize-handle) {
  bottom: -1px;
  top: 0;
  right: -3px;
  position: absolute;
  width: 6px;
  z-index: 20;
  background-color: rgb(45 212 191 / 0.55);
  pointer-events: auto;
  cursor: col-resize;
}

:deep(.article-content.resize-cursor),
:deep(.resize-cursor) {
  cursor: col-resize;
}

:deep(.tableWrapper) {
  overflow-x: auto;
  padding: 2px 0;
}
</style>
