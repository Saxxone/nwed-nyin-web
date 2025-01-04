<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import type { Article } from "~/types/article";
import { useArchiveStore } from "~/store/archive";
import { Toaster } from "@/components/ui/toast";
import { useToast } from "@/components/ui/toast/use-toast";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import DOMPurify from "dompurify";
import { marked } from "marked";

// Types
interface FormatAction {
  label: string;
  icon: string;
  formatting: string;
  command: FormatCommand;
  shortcut?: string;
  markdown: {
    prefix: string;
    suffix?: string;
  };
}

type FormatCommand = "bold" | "italic" | "underline" | "strikethrough" | "heading" | "link" | "code" | "quote" | "list";

definePageMeta({
  title: "Ñwed Nnyịn (Nwed Nyin) - Archive",
  layout: "editor",
});

const { toast } = useToast();
const route = useRoute();
const editor = ref<HTMLElement | null>(null);
const isEditorFocused = ref(false);
const editorHistory = ref<string[]>([]);
const historyIndex = ref(-1);
const lastCaretPosition = ref<number>(0);

const article = ref<Article>({
  content: "",
  contributors: [],
});

const parsed_article = ref({
  content: "",
});

const archiveStore = useArchiveStore();

// Enhanced formatting actions with improved markdown handling
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
    markdown: { prefix: "_", suffix: "_" },
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

// Get current selection with safety checks
function getCurrentSelection(): { text: string; start: number; end: number } | null {
  if (!editor.value) return null;

  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return null;

  const range = selection.getRangeAt(0);
  if (!editor.value.contains(range.commonAncestorContainer)) return null;

  return {
    text: selection.toString(),
    start: getCaretPosition(true),
    end: getCaretPosition(false),
  };
}

// Get caret position
function getCaretPosition(isStart: boolean): number {
  const selection = window.getSelection();
  if (!selection || !selection.rangeCount) return 0;

  const range = selection.getRangeAt(0);
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(editor.value!);
  preCaretRange.setEnd(range[isStart ? "startContainer" : "endContainer"], range[isStart ? "startOffset" : "endOffset"]);
  return preCaretRange.toString().length;
}

// Set caret position
// Update the setCaretPosition function to handle both single caret and range selection
function setCaretPosition(start: number, end?: number) {
  const sel = window.getSelection();
  if (!sel || !editor.value) return;

  let charCount = 0;
  const walker = document.createTreeWalker(editor.value, NodeFilter.SHOW_TEXT, null);
  let startNode: Node | null = null;
  let endNode: Node | null = null;
  let startOffset = 0;
  let endOffset = 0;

  let node = walker.nextNode();
  while (node) {
    const nodeLength = node.nodeValue?.length || 0;

    // Find start position
    if (!startNode && charCount + nodeLength >= start) {
      startNode = node;
      startOffset = start - charCount;
    }

    // Find end position
    if (!endNode && charCount + nodeLength >= (end ?? start)) {
      endNode = node;
      endOffset = (end ?? start) - charCount;
      break;
    }

    charCount += nodeLength;
    node = walker.nextNode();
  }

  if (startNode) {
    const range = document.createRange();
    range.setStart(startNode, startOffset);

    if (end && endNode) {
      range.setEnd(endNode, endOffset);
    } else {
      range.collapse(true);
    }

    sel.removeAllRanges();
    sel.addRange(range);
  }
}

// Update the applyFormat function to maintain selection
function applyFormat(evt: Event, action: FormatAction) {
  evt.preventDefault();

  const selection = getCurrentSelection();
  if (!selection) return;

  const { text, start, end } = selection;
  const content = article.value.content;

  let newText = "";
  let newStart = start;
  let newEnd = end;

  switch (action.command) {
    case "link":
      const url = prompt("Enter URL:", "https://");
      if (url) {
        newText = content.substring(0, start) + `[${text}](${url})` + content.substring(end);
        newStart = start + 1; // Position after '['
        newEnd = start + text.length + 1; // Position before ']'
      }
      break;

    case "heading":
    case "quote":
    case "list":
      // Handle line-based formatting
      const lines = text.split("\n");
      const formattedLines = lines.map((line) => action.markdown.prefix + line);
      newText = content.substring(0, start) + formattedLines.join("\n") + content.substring(end);
      newStart = start + action.markdown.prefix.length;
      newEnd = end + formattedLines.length * action.markdown.prefix.length;
      break;

    default:
      // Handle inline formatting
      const prefix = action.markdown.prefix;
      const suffix = action.markdown.suffix || action.markdown.prefix;
      newText = content.substring(0, start) + prefix + text + suffix + content.substring(end);
      newStart = start + prefix.length;
      newEnd = end + prefix.length;
  }

  // Update content and history
  updateContent(newText);
  addToHistory(newText);

  // Restore focus and selection
  nextTick(() => {
    editor.value?.focus();
    setCaretPosition(newStart, newEnd);
  });
}

// Content update handler
function handleInput(event: Event) {
  const target = event.target as HTMLElement;
  const newContent = target.innerText;
  updateContent(newContent);
}

// Update content with proper sync
function updateContent(newContent: string) {
  article.value.content = newContent;
  lastCaretPosition.value = getCaretPosition(false);
}

// History management
function addToHistory(content: string) {
  historyIndex.value++;
  editorHistory.value = editorHistory.value.slice(0, historyIndex.value);
  editorHistory.value.push(content);
}

function undo() {
  if (historyIndex.value > 0) {
    historyIndex.value--;
    const content = editorHistory.value[historyIndex.value];
    updateContent(content);
    nextTick(() => {
      editor.value?.focus();
      setCaretPosition(lastCaretPosition.value);
    });
  }
}

function redo() {
  if (historyIndex.value < editorHistory.value.length - 1) {
    historyIndex.value++;
    const content = editorHistory.value[historyIndex.value];
    updateContent(content);
    nextTick(() => {
      editor.value?.focus();
      setCaretPosition(lastCaretPosition.value);
    });
  }
}

function handleKeyboard(event: KeyboardEvent) {
  const isMac = navigator.userAgent.toUpperCase().indexOf("MAC") >= 0;
  const modifier = isMac ? event.metaKey : event.ctrlKey;

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
      case "u":
        event.preventDefault();
        applyFormat(event, actions[2]); // Underline
        break;
      case "k":
        event.preventDefault();
        applyFormat(event, actions[4]); // Link
        break;
    }
  }
}

// Debounced auto-save
const autoSave = debounce(async () => {
  if (article.value.id && article.value.content.trim()) {
    try {
      await archiveStore.updateArticle(article.value.id, article.value);
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

function debounce(fn: Function, ms: number) {
  let timeout: number;
  return function (this: undefined, ...args: any[]): void {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => fn.apply(this, args), ms);
  };
}

// Lifecycle hooks and watchers
onMounted(async () => {
  if (route.query.action === "edit" && route.query.article) {
    try {
      article.value = await archiveStore.fetchArticle(decodeURI(route.query.article as string));
      addToHistory(article.value.content);
      nextTick(() => {
        editor.value?.focus();
      });
    } catch (error) {
      toast({
        title: "Error loading article",
        description: error as string,
      });
    }
  }
});

watch(
  () => article.value.content,
  async (newContent) => {
    parsed_article.value.content = DOMPurify.sanitize(await marked.parse(newContent, { breaks: true }));
    autoSave();
  }
);
</script>

<template>
  <main>
    <Toaster />
    <div class="grid card grid-cols-12 gap-4 rounded-lg border p-4">
      <div class="rounded-lg lg:col-span-6 col-span-12">
        <!-- Toolbar -->
        <div class="bg-base-light rounded-lg p-3 mb-3 flex items-center gap-x-2 flex-wrap">
          <TooltipProvider>
            <Tooltip v-for="action in actions" :key="action.label">
              <TooltipTrigger as-child>
                <div variant="outline" class="bg-base-white rounded p-2 cursor-pointer" @click="applyFormat($event, action)">
                  <IconsBoldIcon v-if="action.icon === 'bold'" />
                  <IconsItalicsIcon v-if="action.icon === 'italic'" />
                  <IconsUnderlineIcon v-if="action.icon === 'underline'" />
                  <IconsStrikethroughIcon v-if="action.icon === 'strikethrough'" />
                  <div v-if="action.icon === 'heading'">H</div>
                  <IconsLinkIcon v-if="action.icon === 'link'" />
                  <IconsQuoteIcon v-if="action.icon === 'quote'" />
                  <IconsListIcon v-if="action.icon === 'list'" />
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
            <Button variant="ghost" size="sm" @click="undo" :disabled="historyIndex <= 0" class="tooltip-left" data-tooltip="Undo (Ctrl+Z)">
              <i class="icon-undo"></i>
            </Button>
            <Button variant="ghost" size="sm" @click="redo" :disabled="historyIndex >= editorHistory.length - 1" class="tooltip-left" data-tooltip="Redo (Ctrl+Shift+Z)">
              <i class="icon-redo"></i>
            </Button>
          </div>
        </div>

        <!-- Editor -->
        <div
          ref="editor"
          contenteditable="true"
          spellcheck="true"
          class="h-fit min-h-96 bg-base-light rounded-lg p-3 outline-none font-mono whitespace-pre-wrap break-words"
          @input="handleInput"
          @keydown="handleKeyboard"
          @focus="isEditorFocused = true"
          @blur="isEditorFocused = false"
          v-text="article.content"></div>
      </div>

      <!-- Preview -->
      <div class="lg:col-span-6 col-span-12">
        <div class="flex items-center gap-x-2 mb-10 justify-end">
          <Button>Publish</Button>
        </div>
        <div class="min-h-96 bg-base-light rounded-lg col-span-12 p-4 prose prose-sm max-w-none dark:prose-invert" v-html="parsed_article.content"></div>
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

.prose :deep(h1) {
  @apply text-2xl font-bold mb-4;
}
.prose :deep(h2) {
  @apply text-xl font-bold mb-3;
}
.prose :deep(h3) {
  @apply text-lg font-bold mb-2;
}
.prose :deep(p) {
  @apply mb-4;
}
.prose :deep(code) {
  @apply bg-gray-100 rounded px-1 py-0.5 text-sm font-mono;
}
.prose :deep(pre) {
  @apply bg-gray-100 rounded p-3 my-4 overflow-x-auto;
}
.prose :deep(blockquote) {
  @apply border-l-4 border-gray-300 pl-4 italic my-4;
}
.prose :deep(ul) {
  @apply list-disc list-inside mb-4 pl-4;
}
.prose :deep(ol) {
  @apply list-decimal list-inside mb-4 pl-4;
}
.prose :deep(a) {
  @apply text-blue-600 hover:underline;
}
</style>
