<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDebounceFn, useFileDialog } from "@vueuse/core";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useArticleStore } from "~/store/articles";
import type { Article } from "~/types/article";
import type { FormatAction } from "~/types/types";
import {
  createArticleFileMetadata,
  createArticleImageMarkup,
  formatMarkdownSelection,
  getArticleDraftKeys,
  insertMarkdownAtSelection,
  type TextSelectionRange,
  type UploadedArticleFileData,
} from "~/utils/article-editor";
import app_routes from "~/utils/routes";

definePageMeta({
  title: "Ñwed Nnyịn (Nwed Nyin) - Articles",
  layout: "editor",
});

const { toast } = useToast();
const is_scrolled = ref(false);
const route = useRoute();
const router = useRouter();
const is_loading = ref(false);
const editor = ref<HTMLTextAreaElement | null>(null);
const is_editor_focused = ref(false);
const editor_history = ref<string[]>([]);
const history_index = ref(-1);
const last_caret_position = ref<number>(0);
const is_first_call = ref(true);
const is_initializing_article = ref(true);
const show_file_upload_dialog = ref(false);
const raw_file = ref<File | null>(null);
const current_edit_slug = ref<string | null>(null);

const article = ref<Article>({
  content: "",
  title: "",
});

const parsed_article = ref({
  content: "",
});

const articleStore = useArticleStore();
const is_article_invalid = computed(
  () => !article.value.title.trim() || !article.value.content.trim(),
);

const actions: FormatAction[] = [
  {
    label: "Bold",
    icon: "bold",
    formatting: "font-bold",
    command: "bold",
    shortcut: "Ctrl+B",
    markdown: { prefix: "**", suffix: "**" },
  },
  {
    label: "Italic",
    icon: "italic",
    formatting: "font-italic",
    command: "italic",
    shortcut: "Ctrl+I",
    markdown: { prefix: "_", suffix: "_" },
  },
  {
    label: "Underline",
    icon: "underline",
    formatting: "font-underline",
    command: "underline",
    shortcut: "Ctrl+U",
    markdown: { prefix: "<u>", suffix: "</u>" },
  },
  {
    label: "Heading",
    icon: "heading",
    formatting: "font-heading",
    command: "heading",
    markdown: { prefix: "# " },
  },
  {
    label: "Link",
    icon: "link",
    formatting: "font-link",
    command: "link",
    shortcut: "Ctrl+K",
    markdown: { prefix: "[", suffix: "](url)" },
  },
  {
    label: "Quote",
    icon: "quote",
    formatting: "font-quote",
    command: "quote",
    markdown: { prefix: "> " },
  },
  {
    label: "List",
    icon: "list",
    formatting: "font-list",
    command: "list",
    markdown: { prefix: "- " },
  },
];

type NonFormattingAction = {
  label: string;
  command: () => void;
  icon: string;
  shortcut?: string;
};

const { open, reset, onCancel, onChange } = useFileDialog({
  accept: "image/*",
  multiple: false,
});

const non_formatting_actions: NonFormattingAction[] = [
  {
    label: "Upload media",
    command: () => open(),
    icon: "media",
    // shortcut: "Ctrl+O",
  },
  {
    label: "Undo",
    command: undo,
    icon: "undo",
    // shortcut: "Ctrl+Z",
  },
  {
    label: "Redo",
    command: redo,
    icon: "redo",
    // shortcut: "Ctrl+Shift+Z",
  },
];

onChange((files) => {
  if (!files) return;
  show_file_upload_dialog.value = true;
  raw_file.value = files[0];
});

onCancel(() => {
  raw_file.value = null;
  show_file_upload_dialog.value = false;
  reset();
});

function toggleIsScrolled() {
  is_scrolled.value = window.scrollY > 120;
}

function getEditorSelection(): TextSelectionRange {
  return {
    start: editor.value?.selectionStart ?? article.value.content.length,
    end: editor.value?.selectionEnd ?? article.value.content.length,
  };
}

function setCaretPosition(start: number, end = start) {
  if (!editor.value) return;

  const max = editor.value.value.length;
  const safe_start = Math.min(Math.max(start, 0), max);
  const safe_end = Math.min(Math.max(end, 0), max);
  editor.value.setSelectionRange(safe_start, safe_end);
}

function applyFormat(evt: Event, action?: FormatAction) {
  evt.preventDefault();
  if (!action) return;

  const result = formatMarkdownSelection(
    article.value.content,
    getEditorSelection(),
    action,
    () => prompt("Enter URL:", "https://"),
  );
  if (!result) return;

  updateContent(result.content);
  nextTick(() => {
    editor.value?.focus();
    setCaretPosition(result.selection.start, result.selection.end);
  });
}

function handleEditorInput(event: Event) {
  const target = event.target as HTMLTextAreaElement;
  last_caret_position.value = target.selectionEnd;
  addToHistory(target.value);
}

function updateContent(new_content: string, record_history = true) {
  article.value.content = new_content;
  last_caret_position.value = getEditorSelection().end;
  if (record_history) addToHistory(new_content);
}

const debouncedAddToHistory = useDebounceFn((content: string) => {
  history_index.value++;
  editor_history.value = editor_history.value.slice(0, history_index.value);
  editor_history.value.push(content);
}, 1000);

// History management
function addToHistory(content: string) {
  debouncedAddToHistory(content);
}

function undo() {
  if (history_index.value > 0) {
    history_index.value--;
    const content = editor_history.value[history_index.value];
    updateContent(content, false);
    nextTick(() => {
      editor.value?.focus();
      setCaretPosition(last_caret_position.value);
    });
  }
}

function redo() {
  if (history_index.value < editor_history.value.length - 1) {
    history_index.value++;
    const content = editor_history.value[history_index.value];
    updateContent(content, false);
    nextTick(() => {
      editor.value?.focus();
      setCaretPosition(last_caret_position.value);
    });
  }
}

function discardFile() {
  show_file_upload_dialog.value = false;
  raw_file.value = null;
  reset();
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

function getCurrentDraftKeys() {
  return getArticleDraftKeys(current_edit_slug.value);
}

function clearCurrentDraft() {
  const keys = getCurrentDraftKeys();
  localStorage.removeItem(keys.title);
  localStorage.removeItem(keys.content);
  localStorage.removeItem("article_title");
  localStorage.removeItem("article_content");
}

function fileSaved(data: UploadedArticleFileData) {
  const inject_content = createArticleImageMarkup(data);
  const result = insertMarkdownAtSelection(
    article.value.content,
    getEditorSelection(),
    inject_content,
  );
  updateContent(result.content);
  article.value.file = [
    ...(article.value.file ?? []),
    createArticleFileMetadata(data),
  ];
  show_file_upload_dialog.value = false;
  raw_file.value = null;
  reset();
  nextTick(() => {
    editor.value?.focus();
    setCaretPosition(result.selection.start, result.selection.end);
  });
}

function handleKeyboard(event: KeyboardEvent) {
  const is_mac = navigator.userAgent.toUpperCase().indexOf("MAC") >= 0;
  const modifier = is_mac ? event.metaKey : event.ctrlKey;

  if (modifier) {
    switch (event.key.toLowerCase()) {
      case "z":
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
        break;
      case "b":
        applyFormat(
          event,
          actions.find((action) => action.command === "bold"),
        );
        break;
      case "i":
        applyFormat(
          event,
          actions.find((action) => action.command === "italic"),
        );
        break;
      case "k":
        applyFormat(
          event,
          actions.find((action) => action.command === "link"),
        );
        break;
      case "u":
        applyFormat(
          event,
          actions.find((action) => action.command === "underline"),
        );
        break;
    }
  }
}

async function update(_evt?: Event, label: string = "Updated") {
  if (!article.value.id || is_article_invalid.value) {
    toast({
      title: "Article content or title cannot be empty",
      description: "Create a proper article before trying to update",
    });
    return;
  }

  try {
    is_loading.value = true;
    const res = await articleStore.updateArticle(
      article.value.id,
      article.value,
    );
    toast({
      title: label,
      description: "Your changes have been saved",
    });
    clearCurrentDraft();
    if (res.slug && label.toLowerCase() === "updated")
      await router.push(app_routes.articles.view(encodeURI(res.slug)));
  } catch (error) {
    toast({
      title: `${label} failed`,
      description: getErrorMessage(error),
    });
  } finally {
    is_loading.value = false;
  }
}

// Debounced auto-save
const autoSave = useDebounceFn(async () => {
  //Temporarily disable autosave to reign in resource usage
  // await update({}, "Auto-saved");
}, 60000);

async function publish() {
  if (!article.value.content.trim() || !article.value.title.trim()) {
    toast({
      title: "Article content or title cannot be empty",
      description: "Create a proper article before trying to publish",
    });
    return;
  }
  try {
    is_loading.value = true;
    const res = await articleStore.publishArticle(article.value);
    toast({
      title: "Published",
      description: "Your changes have been saved",
    });
    clearCurrentDraft();
    if (res.slug)
      await router.push(app_routes.articles.view(encodeURI(res.slug)));
  } catch (error) {
    toast({
      title: "Publish failed",
      description: getErrorMessage(error),
    });
  } finally {
    is_loading.value = false;
  }
}

async function getArticleMeta(slug: string) {
  try {
    const res = await articleStore.fetchArticle(slug);
    article.value = { ...article.value, ...res };
  } catch (error) {
    toast({
      title: "Error loading article",
      description: getErrorMessage(error),
    });
  }
}

async function getMarkdownFile(path: string) {
  try {
    article.value.content = await articleStore.fetchMarkdown(path);
    addToHistory(article.value.content);
    nextTick(() => {
      editor.value?.focus();
    });
  } catch (error) {
    toast({
      title: "Error loading article contents",
      description: getErrorMessage(error),
    });
  }
}

function retrieveContentFromStorage() {
  const keys = getCurrentDraftKeys();
  const content = localStorage.getItem(keys.content);
  const heading = localStorage.getItem(keys.title);
  if (heading) article.value.title = heading;
  if (content) article.value.content = content;
}

onMounted(async () => {
  try {
    if (route.query.action === "edit" && route.query.article) {
      const slug = decodeURI(route.query.article as string);
      current_edit_slug.value = slug;
      await getArticleMeta(slug);
      await getMarkdownFile(slug + ".md");
    }
    retrieveContentFromStorage();
  } finally {
    is_initializing_article.value = false;
  }
});

watch(
  () => article.value.title,
  () => {
    if (is_initializing_article.value) return;

    const keys = getCurrentDraftKeys();
    localStorage.setItem(keys.title, article.value.title);
  },
);

watch(
  () => article.value.content,
  async (new_content) => {
    if (!is_initializing_article.value) {
      const keys = getCurrentDraftKeys();
      localStorage.setItem(keys.content, new_content);
    }
    parsed_article.value.content = DOMPurify.sanitize(
      await marked.parse(new_content, { breaks: true }),
      {
        ADD_TAGS: ["figure", "figcaption"],
        ADD_ATTR: ["class", "loading", "decoding"],
      },
    );
    if (is_first_call.value && route.query.action === "edit") {
      is_first_call.value = false;
      return;
    }
    autoSave();
  },
);

onMounted(() => {
  window.addEventListener("scroll", toggleIsScrolled);
});

onUnmounted(() => {
  window.removeEventListener("scroll", toggleIsScrolled);
});
</script>

<template>
  <main class="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 lg:px-6">
    <div
      class="card grid grid-cols-1 gap-4 rounded-lg border-0 p-0 sm:border sm:p-4 lg:grid-cols-12 lg:gap-6"
    >
      <div class="min-w-0 rounded-lg lg:col-span-6">
        <div
          class="bg-base-light mb-3 flex items-center gap-x-2 rounded-lg p-3"
        >
          <Input
            v-model="article.title"
            placeholder="Title"
            required
            :disabled="is_loading"
          />
        </div>
        <!-- Toolbar -->
        <div
          class="mb-3 flex items-center gap-2 overflow-x-auto rounded-lg p-2 transition-colors duration-300 ease-in-out sm:p-3"
          :class="{
            'sticky top-2 z-40 border border-gray-200 bg-base-white shadow-sm backdrop-blur-md dark:border-gray-700 dark:shadow-lg':
              is_scrolled,
            'w-full bg-base-light': !is_scrolled,
          }"
        >
          <TooltipProvider>
            <Tooltip v-for="action in actions" :key="action.label">
              <TooltipTrigger as-child>
                <div
                  class="shrink-0 cursor-pointer select-none rounded p-2 transition-colors duration-300 ease-in-out"
                  :class="{
                    'bg-base-light': is_scrolled,
                    'bg-base-white': !is_scrolled,
                  }"
                  @click="applyFormat($event, action)"
                >
                  <IconsBoldIcon v-if="action.icon === 'bold'" width="20" />
                  <IconsItalicsIcon
                    v-if="action.icon === 'italic'"
                    width="20"
                  />
                  <IconsUnderlineIcon
                    v-if="action.icon === 'underline'"
                    width="20"
                  />
                  <IconsStrikethroughIcon
                    v-if="action.icon === 'strikethrough'"
                    width="20"
                  />
                  <div v-if="action.icon === 'heading'">H</div>
                  <IconsLinkIcon v-if="action.icon === 'link'" width="20" />
                  <IconsQuoteIcon v-if="action.icon === 'quote'" width="20" />
                  <IconsListIcon v-if="action.icon === 'list'" width="20" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <div>
                  <span>{{ action.label }}</span>
                  <span v-if="action.shortcut" class="ml-2 text-xs">{{
                    action.shortcut
                  }}</span>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div class="ml-auto flex shrink-0 items-center gap-x-2">
            <TooltipProvider>
              <Tooltip
                v-for="action in non_formatting_actions"
                :key="action.label"
              >
                <TooltipTrigger as-child>
                  <div
                    class="bg-base-white shrink-0 cursor-pointer select-none rounded p-2 transition-colors duration-300 ease-in-out"
                    :class="{
                      'bg-base-light': is_scrolled,
                      'bg-base-white': !is_scrolled,
                    }"
                    @click="action.command()"
                  >
                    <IconsUndoIcon v-if="action.icon === 'undo'" width="20" />
                    <IconsRedoIcon v-if="action.icon === 'redo'" width="20" />
                    <IconsMediaIcon v-if="action.icon === 'media'" width="20" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div>
                    <span>{{ action.label }}</span>
                    <span v-if="action.shortcut" class="ml-2 text-xs">{{
                      action.shortcut
                    }}</span>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <!-- Editor -->
        <textarea
          ref="editor"
          :aria-disabled="is_loading"
          :disabled="is_loading"
          spellcheck="true"
          v-model="article.content"
          class="bg-base-light min-h-[55vh] w-full resize-y text-wrap rounded-lg p-3 font-mono text-sm outline-none whitespace-pre-wrap break-words sm:min-h-96 sm:text-base lg:min-h-[32rem]"
          @input="handleEditorInput"
          @keydown="handleKeyboard"
          @focus="is_editor_focused = true"
          @blur="is_editor_focused = false"
        ></textarea>

        <ArticleFileUploadDialog
          v-if="show_file_upload_dialog && raw_file"
          @close="discardFile"
          @uploaded="fileSaved"
          :file="raw_file"
        />
      </div>

      <!-- Preview -->
      <div class="min-w-0 lg:col-span-6">
        <div
          class="bg-base-white/95 sticky bottom-2 z-30 mb-4 flex items-center justify-stretch gap-x-2 rounded-lg p-2 shadow-sm backdrop-blur sm:static sm:mb-10 sm:justify-end sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none"
        >
          <Button
            v-if="!article.id"
            @click="publish"
            :disabled="is_loading || is_article_invalid"
            class="w-full sm:w-auto"
          >
            <IconsUploadingIcon class="text-base-dark" v-if="is_loading" />
            Publish
          </Button>
          <Button
            v-else
            @click="update"
            :disabled="is_loading || is_article_invalid"
            class="w-full sm:w-auto"
          >
            <IconsUploadingIcon class="text-base-dark" v-if="is_loading" />
            Update
          </Button>
        </div>
        <div class="rounded-lg sm:rounded-none">
          <h1 class="mb-4 text-lg capitalize sm:text-xl">
            {{ article.title.toLowerCase() }}
          </h1>
          <div
            class="article-content bg-base-light prose prose-sm col-span-12 min-h-80 max-w-none overflow-x-auto rounded-lg p-3 dark:prose-invert sm:min-h-96 sm:p-4"
            v-html="parsed_article.content"
          ></div>
        </div>
      </div>
    </div>
  </main>
</template>
