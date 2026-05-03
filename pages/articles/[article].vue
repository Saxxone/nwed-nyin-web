<script setup lang="ts">
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast/use-toast";
import DOMPurify from "dompurify";
import { ArrowLeft, Edit3, History } from "lucide-vue-next";
import { marked } from "marked";
import SuggestedArticleSwipe from "~/components/article/SuggestedArticleSwipe.vue";
import { useArticleStore } from "~/store/articles";
import type { Article } from "~/types/article";
import app_routes from "~/utils/routes";

definePageMeta({
  layout: "generic",
});

const { toast } = useToast();
const route = useRoute();
const slug = ref(decodeURI(route.params.article as string));
const article = ref<Article>({
  content: "",
  title: "",
});
const markdown = ref();
const parsed_article = ref();
const articleStore = useArticleStore();
const is_loading = ref(true);
const article_title = computed(() => article.value?.title?.trim() || "Article");
const reading_time = computed(() => {
  const word_count = (markdown.value || "")
    .replace(/[#>*_`[\]()!-]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  if (!word_count) return "Quick read";

  return `${Math.max(1, Math.ceil(word_count / 200))} min read`;
});
async function getArticleMeta(slug: string) {
  try {
    article.value = await articleStore.fetchArticle(slug);
  } catch (error) {
    toast({
      title: "Error loading article",
      description: error as string,
    });
  }
}

async function getMarkdownFile(path: string) {
  try {
    markdown.value = await articleStore.fetchMarkdown(path);
  } catch (error) {
    toast({
      title: "Error loading article contents",
      description: error as string,
    });
  }
}

onMounted(async () => {
  is_loading.value = true;
  await Promise.all([
    getArticleMeta(slug.value),
    getMarkdownFile(slug.value + ".md"),
  ]);
  is_loading.value = false;
});

watch(
  () => markdown.value,
  async (new_content) => {
    parsed_article.value = DOMPurify.sanitize(
      await marked.parse(new_content, { breaks: true }),
      {
        ADD_TAGS: ["figure", "figcaption"],
        ADD_ATTR: ["class", "loading", "decoding"],
      },
    );
  },
);

useSeoMeta({
  title: () => article_title.value,
});

const article_hero = ref<HTMLElement | null>(null);
/** True while any part of the hero card is visible; floating back only after it scrolls fully off-screen. */
const hero_visible = ref(true);

useIntersectionObserver(
  article_hero,
  (entries) => {
    hero_visible.value = entries[0]?.isIntersecting ?? false;
  },
  { threshold: [0, 1] },
);

const show_floating_article_back = computed(() => !hero_visible.value);
</script>

<template>
  <main class="article-view w-full min-w-0">
    <SuggestedArticleSwipe
      source="article"
      :current-slug="slug"
      :back-to="app_routes.articles.list"
      :show-floating-back="show_floating_article_back"
    />

    <section
      ref="article_hero"
      class="relative isolate min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-base-white px-5 py-6 shadow-sm dark:border-gray-800 sm:px-8 lg:px-10"
    >
      <div
        class="pointer-events-none absolute -right-24 -top-24 -z-10 h-56 w-56 rounded-full bg-teal-100/70 blur-3xl dark:bg-teal-950/40"
      ></div>
      <div
        class="pointer-events-none absolute -bottom-24 -left-20 -z-10 h-48 w-48 rounded-full bg-amber-100/70 blur-3xl dark:bg-amber-950/30"
      ></div>

      <div class="mb-8 flex flex-wrap items-center justify-between gap-3">
        <NuxtLink
          :to="app_routes.articles.list"
          class="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-base-white px-4 py-2 text-sm font-medium text-sub shadow-sm transition hover:bg-base-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:border-gray-700 dark:focus-visible:ring-gray-100"
        >
          <ArrowLeft class="h-4 w-4" aria-hidden="true" />
          Articles
        </NuxtLink>

        <div class="flex flex-wrap items-center justify-end gap-2">
          <NuxtLink
            :to="app_routes.articles.edit(encodeURI(slug))"
            class="inline-flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 focus-visible:ring-offset-2 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white dark:focus-visible:ring-gray-100"
          >
            <Edit3 class="h-4 w-4" aria-hidden="true" />
            Edit
          </NuxtLink>
        </div>
      </div>

      <header class="mx-auto max-w-3xl text-center">
        <Skeleton
          v-if="is_loading"
          class="mx-auto h-12 w-4/5 max-w-xl rounded-full sm:h-14"
        />
        <h1
          v-else
          class="min-w-0 text-balance break-words text-4xl font-extrabold capitalize leading-tight tracking-tight text-main sm:text-5xl [overflow-wrap:anywhere]"
        >
          {{ article_title.toLowerCase() }}
        </h1>
        <Skeleton
          v-if="is_loading"
          class="mx-auto mt-4 h-4 w-24 rounded-full"
        />
        <p v-else class="mt-4 text-sm font-medium text-muted">
          {{ reading_time }}
        </p>
      </header>
    </section>

    <section
      class="mx-auto mt-6 min-w-0 max-w-full rounded-2xl border border-gray-200 bg-base-white p-4 shadow-sm dark:border-gray-800 lg:px-10 lg:py-7"
      aria-live="polite"
    >
      <div
        v-if="is_loading"
        class="article-content mx-auto min-w-0 max-w-3xl py-2"
        aria-label="Loading article"
        role="status"
      >
        <Skeleton class="mb-5 h-5 w-3/4 rounded-full" />
        <Skeleton class="mb-3 h-4 w-full rounded-full" />
        <Skeleton class="mb-3 h-4 w-11/12 rounded-full" />
        <Skeleton class="mb-8 h-4 w-5/6 rounded-full" />

        <Skeleton class="mb-5 h-7 w-1/2 rounded-full" />
        <Skeleton class="mb-3 h-4 w-full rounded-full" />
        <Skeleton class="mb-3 h-4 w-[92%] rounded-full" />
        <Skeleton class="mb-3 h-4 w-4/5 rounded-full" />
        <Skeleton class="mb-8 h-52 w-full rounded-xl" />

        <Skeleton class="mb-3 h-4 w-full rounded-full" />
        <Skeleton class="mb-3 h-4 w-10/12 rounded-full" />
        <Skeleton class="h-4 w-2/3 rounded-full" />
      </div>

      <div
        v-else-if="parsed_article"
        class="article-content prose w-full min-w-0 max-w-none break-words [overflow-wrap:anywhere] prose-headings:scroll-mt-24 prose-headings:font-bold prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2 prose-p:leading-8 prose-a:font-semibold prose-a:no-underline hover:prose-a:underline prose-blockquote:rounded-r-lg prose-blockquote:border-l-4 prose-blockquote:bg-base-light prose-blockquote:py-1 prose-blockquote:pr-4 dark:prose-invert dark:prose-h2:border-gray-800"
        v-html="parsed_article"
      ></div>

      <div v-else class="py-16 text-center">
        <p class="text-base font-semibold text-main">
          Article content is not available.
        </p>
        <p class="mt-2 text-sm text-muted">
          Please try again later or edit this article.
        </p>
      </div>
    </section>
  </main>
</template>

<style lang="postcss">
.article-view {
  @apply pb-10;
}

.article-content {
  overflow-wrap: anywhere;
  word-break: break-word;
}

.article-content :deep(pre) {
  @apply max-w-full overflow-x-auto;
}

.article-content :deep(video),
.article-content :deep(iframe),
.article-content :deep(svg) {
  @apply max-w-full;
}

.article-content :deep(table) {
  @apply block w-full overflow-x-auto rounded-lg border border-gray-200 text-sm dark:border-gray-800;
}

.article-content :deep(hr) {
  @apply my-10 border-gray-200 dark:border-gray-800;
}
</style>
