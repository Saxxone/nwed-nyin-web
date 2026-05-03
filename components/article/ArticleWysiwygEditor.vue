<script setup lang="ts">
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import type { Editor } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/vue-3";
import { ArticleImageFigure } from "~/extensions/article-image-figure";
import { HeadingAtxTightInput } from "~/extensions/heading-atx-tight-input";
import { MarkdownPaste } from "~/extensions/markdown-paste";
import type { ArticleImagePosition } from "~/utils/article-editor";
import { normalizeArticleImagePosition } from "~/utils/article-editor";
import {
  editorHtmlToMarkdown,
  markdownToEditorHtml,
} from "~/utils/article-markdown-bridge";
import { ref, watch } from "vue";

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
      link: {
        openOnClick: false,
        autolink: true,
      },
    }),
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
    <EditorContent v-if="editor" :editor="editor" />
  </div>
</template>
