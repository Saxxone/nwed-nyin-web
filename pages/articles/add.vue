<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDebounceFn, useTextSelection } from "@vueuse/core";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { nextTick, onMounted, ref, watch } from "vue";
import { useArticleStore } from "~/store/articles";
import type { Article } from "~/types/article";
import type { FormatAction } from "~/types/types";
import app_routes from "~/utils/routes";

definePageMeta({
  title: "Ñwed Nnyịn (Nwed Nyin) - Articles",
  layout: "editor",
});

const { toast } = useToast();
const is_scrolled = ref(false);
const selection = useTextSelection();
const route = useRoute();
const router = useRouter();
const is_loading = ref(false);
const editor = ref<HTMLElement | null>(null);
const is_editor_focused = ref(false);
const editor_history = ref<string[]>([]);
const history_index = ref(-1);
const last_caret_position = ref<number>(0);
const selections = ref<string[]>([]);
const is_first_call = ref(true);

const article = ref<Article>({
  content: "",
  title: "",
});

const parsed_article = ref({
  content: "",
});

const articleStore = useArticleStore();

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
  // {
  //   label: "Underline",
  //   icon: "underline",
  //   formatting: "font-underline",
  //   command: "underline",
  //   shortcut: "Ctrl+U",
  //   markdown: { prefix: "_", suffix: "_" },
  // },
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
  // {
  //   label: "List",
  //   icon: "list",
  //   formatting: "font-list",
  //   command: "list",
  //   markdown: { prefix: "- " },
  // },
];

const non_formatting_actions = [
  {
    label: "Undo",
    command: undo,
    icon: "undo",
    shortcut: "Ctrl+Z",
  },
  {
    label: "Redo",
    command: redo,
    icon: "redo",
    shortcut: "Ctrl+Shift+Z",
  },
];

function toggleIsScrolled() {
  is_scrolled.value = window.scrollY > 120;
}

// Get caret position
function getCaretPosition(is_start: boolean): number {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return 0;

  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(editor.value!);
  preCaretRange.setEnd(range[is_start ? "startContainer" : "endContainer"], range[is_start ? "startOffset" : "endOffset"]);
  return preCaretRange.toString().length;
}

// Set caret position
// Update the setCaretPosition function to handle both single caret and range selection
function setCaretPosition(start: number, end?: number) {
  const sel = window.getSelection();
  if (!sel || !editor.value) return;

  let charCount = 0;
  const walker = document.createTreeWalker(editor.value, NodeFilter.SHOW_TEXT, null);
  let start_node: Node | null = null;
  let end_node: Node | null = null;
  let start_offset = 0;
  let end_offset = 0;

  let node = walker.nextNode();
  while (node) {
    const node_length = node.nodeValue?.length || 0;

    // Find start position
    if (!start_node && charCount + node_length >= start) {
      start_node = node;
      start_offset = start - charCount;
    }

    // Find end position
    if (!end_node && charCount + node_length >= (end ?? start)) {
      end_node = node;
      end_offset = (end ?? start) - charCount;
      break;
    }

    charCount += node_length;
    node = walker.nextNode();
  }

  if (start_node) {
    const range = document.createRange();
    range.setStart(start_node, start_offset);

    if (end && end_node) {
      range.setEnd(end_node, end_offset);
    } else {
      range.collapse(true);
    }

    sel.removeAllRanges();
    sel.addRange(range);
  }
}

// Update the applyFormat function to maintain selection
function applyFormat(evt: Event, action: FormatAction) {
  if (!selections.value[selections.value.length - 1] || selections.value[selections.value.length - 1].length === 0) return;

  const text = selections.value[selections.value.length - 1] ?? selections.value[selections.value.length - 2];
  const content = article.value.content;

  let new_text = "";
  let new_start = 0;
  let new_end = 0;

  const start = getCaretPosition(true);
  const end = getCaretPosition(false);

  const lines = text.split("\n");
  const formatted_lines = lines.map((line) => action.markdown.prefix + line);
  const prefix = action.markdown.prefix;
  const suffix = action.markdown.suffix || action.markdown.prefix;

  switch (action.command) {
    case "link":
      const url = prompt("Enter URL:", "https://");
      if (url) {
        new_text = article.value.content.substring(0, start) + `[${text}](${url})` + article.value.content.substring(end);
        new_start = start + 1; // Position after '['
        new_end = start + text.length + 1; // Position before ']'
      }
      break;

    case "heading":
    case "quote":
    case "list":
      new_text = article.value.content.substring(0, start) + formatted_lines.join("\n") + article.value.content.substring(end);
      new_start = start + action.markdown.prefix.length;
      new_end = end + formatted_lines.length * action.markdown.prefix.length;
      break;

    default:
      // Handle inline formatting
      new_text = content.substring(0, start) + prefix + text + suffix + article.value.content.substring(end);
      new_start = start + prefix.length;
      new_end = end + prefix.length;

      break;
  }

  // Update content and history
  updateContent(new_text);

  // Restore focus and selection
  nextTick(() => {
    editor.value?.focus();
    setCaretPosition(new_start, new_end);
    selections.value = [];
  });
}

// Content update handler
function handleInput(event: Event) {
  const target = event.target as HTMLElement;
  const start = getCaretPosition(true);
  const end = getCaretPosition(false);
  const new_content = target.innerText;
  updateContent(new_content);
  nextTick(() => {
    // jump to next line if enter is pressed
    if (event instanceof InputEvent && !event.data) {
      setCaretPosition(start + 2, end + 2);
    }
  });
}

// Update content with proper sync
function updateContent(new_content: string) {
  article.value.content = new_content;
  last_caret_position.value = getCaretPosition(false);
  addToHistory(new_content);
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
    updateContent(content);
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
    updateContent(content);
    nextTick(() => {
      editor.value?.focus();
      setCaretPosition(last_caret_position.value);
    });
  }
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
        event.preventDefault();
        applyFormat(event, actions[0]); // Bold
        break;
      case "i":
        event.preventDefault();
        applyFormat(event, actions[1]); // Italic
        break;
      case "k":
        event.preventDefault();
        applyFormat(event, actions[3]); // Link
        break;
    }
  }
}

// Debounced auto-save
const autoSave = debounce(async () => {
  if (article.value.id && article.value.content.trim()) {
    try {
      await articleStore.updateArticle(article.value.id, article.value);
      toast({
        title: "Auto-saved",
        description: "Your changes have been saved",
      });
    } catch (error) {
      console.error("Auto-save failed:", error);
      toast({
        title: "Auto-save failed",
        description: error as string,
      });
    }
  }
}, 2000);

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
    if (res.slug) router.push(app_routes.articles.view(encodeURI(res.slug)));
  } catch (error) {
    toast({
      title: "Publish failed",
      description: error as string,
    });
  } finally {
    is_loading.value = false;
  }
}

function debounce(fn: Function, ms: number) {
  let timeout: number;
  return function (this: void, ...args: any[]): void {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => fn.apply(this, args), ms);
  };
}

async function getArticleMeta(slug: string) {
  try {
    const res = await articleStore.fetchArticle(slug);
    article.value = { ...article.value, ...res };
  } catch (error) {
    toast({
      title: "Error loading article",
      description: error as string,
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
      description: error as string,
    });
  }
}

onMounted(async () => {
  if (route.query.action === "edit" && route.query.article) {
    const slug = decodeURI(route.query.article as string);
    await getArticleMeta(slug);
    await getMarkdownFile(slug + ".md");
  }
});

watch(
  () => article.value.content,
  async (new_content) => {
    parsed_article.value.content = DOMPurify.sanitize(await marked.parse(new_content, { breaks: true }));
    if (is_first_call.value && route.query.action === "edit") {
      is_first_call.value = false;
      return;
    }
    autoSave();
  }
);

watch(
  () => selection.text.value,
  (new_selection) => {
    selections.value.push(new_selection);
  }
);

onMounted(() => {
  window.addEventListener("scroll", toggleIsScrolled);
});

onUnmounted(() => {
  window.removeEventListener("scroll", toggleIsScrolled);
});
</script>

<template>
  <main>
    <div class="grid card grid-cols-12 gap-4 rounded-lg border p-4">
      <div class="rounded-lg lg:col-span-6 col-span-12">
        <div class="bg-base-light rounded-lg p-3 mb-3 flex items-center gap-x-2 flex-wrap">
          <Input v-model="article.title" placeholder="Title" required :disabled="is_loading" />
        </div>
        <!-- Toolbar -->
        <div
          class="rounded-lg p-3 mb-3 flex items-center gap-x-2 flex-wrap transition-colors duration-300 ease-in-out"
          :class="{
            'mx-4 border backdrop-blur-md shadow-sm dark:shadow-lg fixed top-0 left-0 right-0 z-50 bg-base-white': is_scrolled,
            'w-full bg-base-light': !is_scrolled,
          }">
          <TooltipProvider>
            <Tooltip v-for="action in actions" :key="action.label">
              <TooltipTrigger as-child>
                <div
                  class="rounded p-1 lg:p-2 cursor-pointer select-none transition-colors duration-300 ease-in-out"
                  :class="{
                    'bg-base-light': is_scrolled,
                    'bg-base-white': !is_scrolled,
                  }"
                  @click="applyFormat($event, action)">
                  <IconsBoldIcon v-if="action.icon === 'bold'" width="20" />
                  <IconsItalicsIcon v-if="action.icon === 'italic'"  width="20" />
                  <IconsUnderlineIcon v-if="action.icon === 'underline'" width="20" />
                  <IconsStrikethroughIcon v-if="action.icon === 'strikethrough'" width="20" />
                  <div v-if="action.icon === 'heading'">H</div>
                  <IconsLinkIcon v-if="action.icon === 'link'" width="20" />
                  <IconsQuoteIcon v-if="action.icon === 'quote'" width="20" />
                  <IconsListIcon v-if="action.icon === 'list'" width="20" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div>
                  <span>{{ action.label }}</span>
                  <span v-if="action.shortcut" class="ml-2 text-xs">{{ action.shortcut }}</span>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div class="ml-auto flex items-center gap-x-2">
            <TooltipProvider>
              <Tooltip v-for="action in non_formatting_actions" :key="action.label">
                <TooltipTrigger as-child>
                  <div
                    class="bg-base-white rounded p-1 lg:p-2 cursor-pointer select-none transition-colors duration-300 ease-in-out"
                    :class="{
                      'bg-base-light': is_scrolled,
                      'bg-base-white': !is_scrolled,
                    }"
                    @click="action.command">
                    <IconsUndoIcon v-if="action.icon === 'undo'" width="20" />
                    <IconsRedoIcon v-if="action.icon === 'redo'" width="20" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div>
                    <span>{{ action.label }}</span>
                    <span v-if="action.shortcut" class="ml-2 text-xs">{{ action.shortcut }}</span>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <!-- Editor -->
        <div
          ref="editor"
          :aria-disabled="is_loading"
          :disabled="is_loading"
          :contenteditable="!is_loading"
          spellcheck="true"
          class="h-fit min-h-96 bg-base-light text-wrap rounded-lg p-3 outline-none font-mono whitespace-pre-wrap break-words"
          @input="handleInput"
          @keydown="handleKeyboard"
          @focus="is_editor_focused = true"
          @blur="is_editor_focused = false">
          {{ article.content }}
        </div>
      </div>

      <!-- Preview -->
      <div class="lg:col-span-6 col-span-12">
        <div class="flex items-center gap-x-2 mb-10 justify-end">
          <Button @click="publish" :disabled="is_loading">
            <IconsUploadingIcon class="text-base-dark" v-if="is_loading" />
            Publish</Button
          >
        </div>
        <div>
          <h1 class="mb-4">{{ article.title }}</h1>
          <div class="min-h-96 bg-base-light rounded-lg col-span-12 p-4 prose prose-sm max-w-none dark:prose-invert" v-html="parsed_article.content"></div>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped lang="postcss">
.tooltip-left::before {
  content: attr(data-tooltip);
  @apply absolute right-full mr-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 transition-opacity invisible;
}

.tooltip-left:hover::before {
  @apply opacity-100 visible;
}
</style>
