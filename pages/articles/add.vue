<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogScrollContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDebounceFn, useFileDialog } from "@vueuse/core";
import { History, Table } from "lucide-vue-next";
import { computed, nextTick, onMounted, ref, watch } from "vue";
import ArticleWysiwygEditor from "~/components/article/ArticleWysiwygEditor.vue";
import { useArticleStore } from "~/store/articles";
import type { Article, ArticleRevision } from "~/types/article";
import type { FormatAction } from "~/types/types";
import {
  createArticleFileMetadata,
  getArticleDraftKeys,
  type UploadedArticleFileData,
} from "~/utils/article-editor";
import {
  diffLinesMarkdown,
  type DiffLinePart,
} from "~/utils/article-revision-diff";
import app_routes from "~/utils/routes";

type RevisionViewMode = "snapshot" | "diff_draft" | "diff_previous";

definePageMeta({
  title: "Ñwed Nnyịn (Nwed Nyin) - Articles",
  layout: "editor",
});

const { toast } = useToast();
const is_scrolled = ref(false);
const route = useRoute();
const router = useRouter();
const is_loading = ref(false);
const body_editor = ref<InstanceType<typeof ArticleWysiwygEditor> | null>(null);
const is_first_call = ref(true);
const is_initializing_article = ref(true);
const show_file_upload_dialog = ref(false);
const raw_file = ref<File | null>(null);
const current_edit_slug = ref<string | null>(null);

const article = ref<Article>({
  content: "",
  title: "",
});

const articleStore = useArticleStore();
const is_article_invalid = computed(
  () => !article.value.title.trim() || !article.value.content.trim(),
);

const revisions_dialog_open = ref(false);
const revisions_loading = ref(false);
const article_revisions = ref<ArticleRevision[]>([]);
const selected_article_revision_id = ref<string | null>(null);
const revision_view_mode = ref<RevisionViewMode>("snapshot");

function abbreviatedContributor(ident: string) {
  const t = ident.trim();
  const at = t.indexOf("@");
  if (at <= 0 || at <= 2) return t;
  return `${t.slice(0, 2)}…${t.slice(at)}`;
}

function format_revision_date(iso: string) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function revision_snapshot_fields(rev: ArticleRevision | undefined) {
  const raw = rev?.content;
  if (!raw || typeof raw !== "object") {
    return { title: "", summary: "", markdown: "" };
  }
  const c = raw as Record<string, unknown>;
  return {
    title: typeof c.title === "string" ? c.title : "",
    summary: typeof c.summary === "string" ? c.summary : "",
    markdown: typeof c.markdown === "string" ? c.markdown : "",
  };
}

const selected_article_revision = computed(() =>
  article_revisions.value.find(
    (r) => r.id === selected_article_revision_id.value,
  ),
);

async function load_article_revisions() {
  if (!article.value.id) return;

  revisions_loading.value = true;
  try {
    const list = await articleStore.fetchArticleRevisions(article.value.id);
    article_revisions.value = list;
    selected_article_revision_id.value = list[0]?.id ?? null;
  } catch (error) {
    toast({
      title: "Could not load revisions",
      description: getErrorMessage(error),
    });
    article_revisions.value = [];
    selected_article_revision_id.value = null;
  } finally {
    revisions_loading.value = false;
  }
}

watch(revisions_dialog_open, (open) => {
  if (open && article.value.id) void load_article_revisions();
});

const revision_preview_snapshot = computed(() =>
  revision_snapshot_fields(selected_article_revision.value),
);

const revision_selected_index = computed(() =>
  article_revisions.value.findIndex(
    (r) => r.id === selected_article_revision_id.value,
  ),
);

const revision_older_than_selected = computed(() => {
  const i = revision_selected_index.value;
  if (i < 0 || i + 1 >= article_revisions.value.length) return undefined;
  return article_revisions.value[i + 1];
});

const revision_has_older_neighbor = computed(
  () => revision_older_than_selected.value !== undefined,
);

/** Selected revision snapshot as left side; additions = changes in newer / draft text. */
const revision_diff_vs_draft = computed<DiffLinePart[]>(() => {
  if (!selected_article_revision.value) return [];
  const left = revision_preview_snapshot.value.markdown;
  const right = article.value.content ?? "";
  return diffLinesMarkdown(
    `Revision v${selected_article_revision.value.version}`,
    "Current draft",
    left,
    right,
  );
});

const revision_diff_vs_previous = computed<DiffLinePart[]>(() => {
  const older = revision_older_than_selected.value;
  const selected_rev = selected_article_revision.value;
  if (!older || !selected_rev) return [];
  const left = revision_snapshot_fields(older).markdown;
  const right = revision_preview_snapshot.value.markdown;
  return diffLinesMarkdown(
    `v${older.version}`,
    `v${selected_rev.version}`,
    left,
    right,
  );
});

const revision_diff_headline_previous = computed(() => {
  const older = revision_older_than_selected.value;
  const selected_rev = selected_article_revision.value;
  if (!older || !selected_rev) return "";
  return `Changes from revision v${older.version} → v${selected_rev.version}`;
});

watch(selected_article_revision_id, () => {
  revision_view_mode.value = "snapshot";
});

watch(
  [revision_view_mode, revision_has_older_neighbor],
  () => {
    if (
      revision_view_mode.value === "diff_previous" &&
      !revision_has_older_neighbor.value
    )
      revision_view_mode.value = "snapshot";
  },
  { flush: "post" },
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
    label: "Insert table",
    command: insertTable,
    icon: "table",
  },
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

function preserveSelectionOnToolbarPointerdown(evt: PointerEvent) {
  // Keep focus + text selection inside TipTap when using toolbar (click otherwise blurs editor).
  evt.preventDefault();
}

function applyFormat(evt: Event, action?: FormatAction) {
  evt.preventDefault();
  if (!action) return;
  const ed = body_editor.value?.getTiptap();
  if (!ed) return;

  switch (action.command) {
    case "bold":
      ed.chain().focus().toggleBold().run();
      break;
    case "italic":
      ed.chain().focus().toggleItalic().run();
      break;
    case "underline":
      ed.chain().focus().toggleUnderline().run();
      break;
    case "heading":
      // Matches previous markdown toolbar (`# `) — level-1 heading.
      ed.chain().focus().toggleHeading({ level: 1 }).run();
      break;
    case "link": {
      const url = prompt("Enter URL:", "https://");
      if (!url) break;
      const { empty } = ed.state.selection;
      if (empty) {
        ed.chain()
          .focus()
          .insertContent({
            type: "text",
            text: url,
            marks: [{ type: "link", attrs: { href: url } }],
          })
          .run();
      } else {
        ed.chain().focus().setLink({ href: url }).run();
      }
      break;
    }
    case "quote":
      ed.chain().focus().toggleBlockquote().run();
      break;
    case "list":
      ed.chain().focus().toggleBulletList().run();
      break;
  }
}

function undo() {
  body_editor.value?.getTiptap()?.chain().focus().undo().run();
}

function redo() {
  body_editor.value?.getTiptap()?.chain().focus().redo().run();
}

function insertTable() {
  body_editor.value
    ?.getTiptap()
    ?.chain()
    .focus()
    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
    .run();
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
  body_editor.value?.insertArticleFigure?.({
    src: data.url,
    alt: data.description.trim() || data.name.trim(),
    caption: data.name.trim(),
    position: data.position,
    width: data.width,
    height: data.height,
  });
  article.value.file = [
    ...(article.value.file ?? []),
    createArticleFileMetadata(data),
  ];
  show_file_upload_dialog.value = false;
  raw_file.value = null;
  reset();
  nextTick(() => {
    body_editor.value?.focus?.();
  });
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
    await nextTick();
    requestAnimationFrame(() => {
      body_editor.value?.focus();
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
  window.addEventListener("scroll", toggleIsScrolled);
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
    if (
      route.query.revisions === "1" &&
      route.query.action === "edit" &&
      article.value.id
    ) {
      revisions_dialog_open.value = true;
    }
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
  (new_content) => {
    if (!is_initializing_article.value) {
      const keys = getCurrentDraftKeys();
      localStorage.setItem(keys.content, new_content);
    }
    if (is_first_call.value && route.query.action === "edit") {
      is_first_call.value = false;
      return;
    }
    autoSave();
  },
);

onUnmounted(() => {
  window.removeEventListener("scroll", toggleIsScrolled);
});
</script>

<template>
  <main class="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 lg:px-6">
    <div
      class="card grid grid-cols-1 gap-6 rounded-lg border-0 p-0 sm:border sm:p-4"
    >
      <div class="min-w-0 rounded-lg">
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
          class="mb-3 flex flex-wrap items-center gap-x-2 gap-y-2 rounded-lg p-2 transition-colors duration-300 ease-in-out sm:p-3"
          :class="{
            'sticky top-2 z-40 border border-gray-200 bg-base-white shadow-sm backdrop-blur-md dark:border-gray-700 dark:shadow-lg':
              is_scrolled,
            'w-full bg-base-light': !is_scrolled,
          }"
        >
          <div class="flex min-w-0 shrink-0 items-center gap-1 overflow-x-auto">
            <TooltipProvider>
              <Tooltip v-for="action in actions" :key="action.label">
                <TooltipTrigger as-child>
                  <button
                    type="button"
                    class="inline-flex shrink-0 cursor-pointer select-none rounded border-0 p-2 transition-colors duration-300 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    :class="{
                      'bg-base-light': is_scrolled,
                      'bg-base-white': !is_scrolled,
                    }"
                    @pointerdown="preserveSelectionOnToolbarPointerdown"
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
                    <span v-if="action.icon === 'heading'">H</span>
                    <IconsLinkIcon v-if="action.icon === 'link'" width="20" />
                    <IconsQuoteIcon v-if="action.icon === 'quote'" width="20" />
                    <IconsListIcon v-if="action.icon === 'list'" width="20" />
                  </button>
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

          <div
            class="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:ml-auto sm:w-auto sm:flex-nowrap"
          >
            <TooltipProvider>
              <Tooltip
                v-for="action in non_formatting_actions"
                :key="action.label"
              >
                <TooltipTrigger as-child>
                  <button
                    type="button"
                    class="inline-flex shrink-0 cursor-pointer select-none rounded border-0 bg-base-white p-2 transition-colors duration-300 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    :class="{
                      'bg-base-light': is_scrolled,
                      'bg-base-white': !is_scrolled,
                    }"
                    @pointerdown="preserveSelectionOnToolbarPointerdown"
                    @click="action.command()"
                  >
                    <IconsUndoIcon v-if="action.icon === 'undo'" width="20" />
                    <IconsRedoIcon v-if="action.icon === 'redo'" width="20" />
                    <IconsMediaIcon v-if="action.icon === 'media'" width="20" />
                    <Table
                      v-if="action.icon === 'table'"
                      class="h-5 w-5"
                      aria-hidden="true"
                    />
                  </button>
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
              <Tooltip v-if="article.id">
                <TooltipTrigger as-child>
                  <button
                    type="button"
                    class="inline-flex shrink-0 cursor-pointer select-none rounded border-0 bg-base-white p-2 transition-colors duration-300 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    :class="{
                      'bg-base-light': is_scrolled,
                      'bg-base-white': !is_scrolled,
                    }"
                    aria-label="Revision history"
                    @click="revisions_dialog_open = true"
                  >
                    <IconsHistoryIcon aria-hidden="true" width="20" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">Revision history</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              v-if="!article.id"
              type="button"
              :disabled="is_loading || is_article_invalid"
              class="w-full sm:w-auto"
              @click="publish"
            >
              <IconsUploadingIcon v-if="is_loading" class="text-base-dark" />
              Publish
            </Button>
            <Button
              v-else
              type="button"
              :disabled="is_loading || is_article_invalid"
              class="w-full sm:w-auto"
              @click="update"
            >
              <IconsUploadingIcon v-if="is_loading" class="text-base-dark" />
              Update
            </Button>
          </div>
        </div>

        <ClientOnly>
          <ArticleWysiwygEditor
            id="editor"
            ref="body_editor"
            v-model="article.content"
            :disabled="is_loading"
          />
          <template #fallback>
            <div
              class="bg-base-light min-h-[55vh] animate-pulse rounded-lg sm:min-h-96"
              aria-hidden="true"
            />
          </template>
        </ClientOnly>

        <ArticleFileUploadDialog
          v-if="show_file_upload_dialog && raw_file"
          :file="raw_file"
          @close="discardFile"
          @uploaded="fileSaved"
        />
      </div>
    </div>

    <Dialog v-model:open="revisions_dialog_open">
      <DialogScrollContent
        class="max-h-[90vh] max-w-[min(100vw-2rem,62rem)] gap-6"
      >
        <DialogHeader>
          <DialogTitle>Revision history</DialogTitle>
          <DialogDescription>
            Saved snapshots from the server (read-only). Compare with your draft
            before a major edit if needed—restoring a version still requires
            copying markdown into the article body.
          </DialogDescription>
        </DialogHeader>

        <div class="grid min-h-[50vh] gap-6 md:grid-cols-[12rem,minmax(0,1fr)]">
          <div class="min-w-0">
            <p v-if="revisions_loading" class="text-muted-foreground text-sm">
              Loading revisions…
            </p>
            <p
              v-else-if="!article_revisions.length"
              class="text-muted-foreground text-sm"
            >
              No revisions recorded yet—save markdown once to capture the first
              snapshot.
            </p>
            <ul v-else class="space-y-1 text-sm">
              <li v-for="rev in article_revisions" :key="rev.id">
                <button
                  type="button"
                  class="hover:bg-accent w-full rounded-md border px-2 py-2 text-left transition-colors"
                  :class="{
                    'border-primary bg-accent':
                      rev.id === selected_article_revision_id,
                    'border-border': rev.id !== selected_article_revision_id,
                  }"
                  @click="selected_article_revision_id = rev.id"
                >
                  <span class="font-medium">v{{ rev.version }}</span>
                  <span class="block text-xs opacity-80">{{
                    format_revision_date(rev.created_at)
                  }}</span>
                  <span class="text-muted-foreground block text-xs">{{
                    abbreviatedContributor(rev.created_by)
                  }}</span>
                </button>
              </li>
            </ul>
          </div>

          <div
            class="border-border flex min-h-0 min-w-0 flex-col gap-2 border-t pt-4 md:border-t-0 md:border-l md:pl-4 md:pt-0"
          >
            <template v-if="selected_article_revision">
              <div
                v-if="revision_preview_snapshot.title"
                class="text-base font-semibold leading-tight break-words"
              >
                {{ revision_preview_snapshot.title }}
              </div>
              <p
                v-if="revision_preview_snapshot.summary"
                class="text-muted-foreground text-xs break-words"
              >
                {{ revision_preview_snapshot.summary }}
              </p>

              <div
                role="tablist"
                aria-label="Revision markdown view mode"
                class="border-input bg-muted/30 mb-2 flex flex-wrap gap-1 rounded-lg border p-1"
              >
                <button
                  type="button"
                  role="tab"
                  class="ring-offset-background hover:bg-accent/80 rounded-md px-3 py-1.5 text-xs font-medium outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 md:text-sm"
                  :aria-selected="revision_view_mode === 'snapshot'"
                  :class="
                    revision_view_mode === 'snapshot'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground'
                  "
                  @click="revision_view_mode = 'snapshot'"
                >
                  Snapshot
                </button>
                <button
                  type="button"
                  role="tab"
                  class="ring-offset-background hover:bg-accent/80 rounded-md px-3 py-1.5 text-xs font-medium outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 md:text-sm"
                  :aria-selected="revision_view_mode === 'diff_draft'"
                  :class="
                    revision_view_mode === 'diff_draft'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground'
                  "
                  @click="revision_view_mode = 'diff_draft'"
                >
                  Vs editor draft
                </button>

                <Tooltip v-if="!revision_has_older_neighbor">
                  <TooltipTrigger as-child>
                    <span class="inline-flex">
                      <button
                        type="button"
                        role="tab"
                        disabled
                        class="text-muted-foreground cursor-not-allowed rounded-md px-3 py-1.5 text-xs font-medium opacity-60 md:text-sm"
                        aria-selected="false"
                      >
                        Vs older revision
                      </button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom"
                    >This is the earliest stored revision.</TooltipContent
                  >
                </Tooltip>
                <button
                  v-else
                  type="button"
                  role="tab"
                  class="ring-offset-background hover:bg-accent/80 rounded-md px-3 py-1.5 text-xs font-medium outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 md:text-sm"
                  :aria-selected="revision_view_mode === 'diff_previous'"
                  :class="
                    revision_view_mode === 'diff_previous'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground'
                  "
                  @click="revision_view_mode = 'diff_previous'"
                >
                  Vs older revision
                </button>
              </div>

              <textarea
                v-if="revision_view_mode === 'snapshot'"
                readonly
                class="bg-muted/40 shrink min-h-[40vh] w-full resize-y rounded-md border px-3 py-2 font-mono text-xs leading-relaxed whitespace-pre-wrap outline-none sm:text-sm md:min-h-[50vh]"
                :value="revision_preview_snapshot.markdown"
                aria-label="Revision markdown preview"
              />
              <ArticleRevisionDiffView
                v-else-if="revision_view_mode === 'diff_draft'"
                :parts="revision_diff_vs_draft"
                headline="Snapshot vs editor draft · added / removed vs selected revision lines"
              />
              <ArticleRevisionDiffView
                v-else
                :parts="revision_diff_vs_previous"
                :headline="revision_diff_headline_previous"
              />
            </template>
            <p
              v-else-if="!revisions_loading"
              class="text-muted-foreground text-sm"
            >
              Select a revision to preview its markdown.
            </p>
          </div>
        </div>
      </DialogScrollContent>
    </Dialog>
  </main>
</template>
