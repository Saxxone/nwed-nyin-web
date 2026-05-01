<script setup lang="ts">
import { useToast } from "@/components/ui/toast/use-toast";
import DOMPurify from "dompurify";
import { ChevronDown, ChevronUp, Search, X } from "lucide-vue-next";
import { marked } from "marked";
import type { ComponentPublicInstance } from "vue";
import { useArticleStore } from "~/store/articles";
import type { Article } from "~/types/article";
import app_routes from "~/utils/routes";

definePageMeta({
  layout: "generic",
});

const { toast } = useToast();
const is_loading = ref(false);
const is_loading_more = ref(false);
const has_more_articles = ref(true);
const page_size = 10;
const auto_scroll_delay = 10000;
const api_url = import.meta.env.VITE_API_BASE_URL;
const articleStore = useArticleStore();
const search_query = ref("");
const is_mobile_search_open = ref(false);
const sanitized_content = ref<Article[]>([]);
const article_image_urls = ref<Record<string, string | null>>({});
const feed = ref<HTMLElement | null>(null);
const article_items = ref<HTMLElement[]>([]);
const auto_scroll_timer = ref<ReturnType<typeof setTimeout> | null>(null);
const scroll_settle_timer = ref<ReturnType<typeof setTimeout> | null>(null);
const search_timer = ref<ReturnType<typeof setTimeout> | null>(null);
const is_searching = computed(() => search_query.value.trim().length > 0);
const show_search_results = computed(
  () => is_searching.value && !is_loading.value,
);
const show_mobile_search = computed(
  () => is_mobile_search_open.value || is_searching.value,
);

async function sanitizeContent(content: string) {
  return DOMPurify.sanitize(
    await marked.parse(`${content || ""} ...`, { breaks: true }),
  );
}

async function sanitizeArticles(items: Article[]) {
  return Promise.all(
    items.map(async (item) => ({
      ...item,
      summary: await sanitizeContent(item.summary as string),
    })),
  );
}

function getArticleImages(article: Article) {
  return (
    article.file?.filter((file) => {
      const type = file.type?.toUpperCase();
      return type === "IMAGE" || file.mimetype?.startsWith("image/");
    }) ?? []
  );
}

function resolveArticleImageUrl(image_path?: string) {
  if (!image_path) return null;
  if (/^https?:\/\//i.test(image_path)) return image_path;

  const normalized_path = image_path.replace(/^\/+/, "");
  const static_path = normalized_path.startsWith("articles/")
    ? normalized_path
    : `articles/${normalized_path}`;

  return `${api_url}/${static_path}`;
}

function selectArticleImageUrl(article: Article) {
  const article_key = article.id || article.slug || article.title;

  if (article_key in article_image_urls.value) {
    return article_image_urls.value[article_key];
  }

  const images = getArticleImages(article);
  const image = images[Math.floor(Math.random() * images.length)];
  const image_url = resolveArticleImageUrl(image?.url || image?.path);

  article_image_urls.value = {
    ...article_image_urls.value,
    [article_key]: image_url,
  };

  return image_url;
}

function getArticleImageUrl(article: Article) {
  return selectArticleImageUrl(article);
}

function getArticleCardStyle(article: Article) {
  const image_url = getArticleImageUrl(article);

  if (!image_url) return undefined;

  return {
    backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.76)), url("${image_url}")`,
  };
}

async function getArticles({ append = false } = {}) {
  if (
    (append && is_loading_more.value) ||
    (!append && is_loading.value) ||
    !has_more_articles.value
  )
    return;

  try {
    if (append) is_loading_more.value = true;
    else is_loading.value = true;

    const skip = append ? sanitized_content.value.length : 0;
    const items = is_searching.value
      ? await articleStore.searchArticles(search_query.value.trim(), {
          skip,
          take: page_size,
        })
      : await articleStore.fetchArticles({
          cursor: "1",
          skip,
          take: page_size,
        });
    const sanitized_items = await sanitizeArticles(items);

    sanitized_content.value = append
      ? [...sanitized_content.value, ...sanitized_items]
      : sanitized_items;
    has_more_articles.value = items.length === page_size;
  } catch (error) {
    toast({
      title: "Error loading article",
      description: error as string,
    });
  } finally {
    is_loading.value = false;
    is_loading_more.value = false;
  }
}

async function loadMoreArticles() {
  await getArticles({ append: true });
}

function clearAutoScrollTimer() {
  if (!auto_scroll_timer.value) return;
  clearTimeout(auto_scroll_timer.value);
  auto_scroll_timer.value = null;
}

function getCurrentArticleIndex() {
  if (!feed.value || article_items.value.length === 0) return 0;

  const current_scroll = feed.value.scrollTop;

  return article_items.value.reduce((closest_index, item, index) => {
    const current_distance = Math.abs(item.offsetTop - current_scroll);
    const closest_distance = Math.abs(
      article_items.value[closest_index].offsetTop - current_scroll,
    );
    return current_distance < closest_distance ? index : closest_index;
  }, 0);
}

async function scrollToNextArticle() {
  const current_index = getCurrentArticleIndex();
  let next_article = article_items.value[current_index + 1];

  if (!next_article && has_more_articles.value) {
    await loadMoreArticles();
    await nextTick();
    next_article = article_items.value[current_index + 1];
  }

  next_article?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function scrollToPreviousArticle() {
  const current_index = getCurrentArticleIndex();
  const previous_article = article_items.value[current_index - 1];

  previous_article?.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function goToNextArticle() {
  await scrollToNextArticle();
  scheduleAutoScroll();
}

function goToPreviousArticle() {
  scrollToPreviousArticle();
  scheduleAutoScroll();
}

function scheduleAutoScroll() {
  clearAutoScrollTimer();

  if (sanitized_content.value.length < 2) return;
  if (
    getCurrentArticleIndex() >= sanitized_content.value.length - 1 &&
    !has_more_articles.value
  )
    return;

  auto_scroll_timer.value = setTimeout(async () => {
    await scrollToNextArticle();
    scheduleAutoScroll();
  }, auto_scroll_delay);
}

function handleFeedScroll() {
  clearAutoScrollTimer();

  if (scroll_settle_timer.value) clearTimeout(scroll_settle_timer.value);

  scroll_settle_timer.value = setTimeout(() => {
    scheduleAutoScroll();
  }, 250);
}

function handleFeedInteraction() {
  scheduleAutoScroll();
}

function resetFeedPosition() {
  feed.value?.scrollTo({ top: 0, behavior: "instant" });
}

async function refreshArticles() {
  has_more_articles.value = true;
  sanitized_content.value = [];
  article_items.value = [];
  resetFeedPosition();
  clearAutoScrollTimer();
  await getArticles();
  await nextTick();
  scheduleAutoScroll();
}

async function openMobileSearch() {
  is_mobile_search_open.value = true;
  await nextTick();
  document.querySelector<HTMLInputElement>("#mobile-article-search")?.focus();
}

function closeMobileSearch() {
  search_query.value = "";
  is_mobile_search_open.value = false;
}

function setArticleItem(
  element: Element | ComponentPublicInstance | null,
  index: number,
) {
  if (element instanceof HTMLElement) {
    article_items.value[index] = element;
    return;
  }

  const root = element?.$el;
  if (root instanceof HTMLElement) article_items.value[index] = root;
}

onBeforeUpdate(() => {
  article_items.value = [];
});

onMounted(async () => {
  await getArticles();
  scheduleAutoScroll();
});

watch(search_query, () => {
  if (search_timer.value) clearTimeout(search_timer.value);

  search_timer.value = setTimeout(async () => {
    await refreshArticles();
  }, 300);
});

onBeforeUnmount(() => {
  clearAutoScrollTimer();
  if (scroll_settle_timer.value) clearTimeout(scroll_settle_timer.value);
  if (search_timer.value) clearTimeout(search_timer.value);
});
</script>

<template>
  <main class="articles-page">
    <div class="mb-4 flex items-center justify-between gap-3">
      <h1 class="text-4xl font-extrabold tracking-tight lg:text-2xl">
        Articles
      </h1>

      <div class="relative ml-auto hidden w-full max-w-sm md:block">
        <Input
          v-model="search_query"
          class="input !mb-0 w-full"
          type="search"
          placeholder="Search articles..."
          aria-label="Search articles"
          aria-controls="article-search-results"
          :aria-expanded="show_search_results"
        />

        <div
          v-if="show_search_results"
          id="article-search-results"
          class="absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-y-auto scroll-bar-none rounded-lg border border-gray-200 bg-base-white shadow-lg dark:border-gray-700"
          role="listbox"
        >
          <NuxtLink
            v-for="article in sanitized_content"
            :key="`${article.id}-search-result`"
            :to="app_routes.articles.view(encodeURI(article.slug as string))"
            class="block border-b border-gray-100 px-4 py-3 outline-none transition-colors last:border-b-0 hover:bg-base-light focus-visible:bg-base-light dark:border-gray-800"
            role="option"
          >
            <p class="text-sm font-semibold capitalize text-main">
              {{ article.title.toLowerCase() }}
            </p>
            <div
              class="prose prose-sm mt-1 max-h-12 max-w-none overflow-hidden text-xs text-muted dark:prose-invert"
              v-html="article.summary"
            ></div>
          </NuxtLink>

          <div
            v-if="sanitized_content.length === 0"
            class="px-4 py-6 text-center text-sm text-muted"
          >
            No articles found.
          </div>
        </div>
      </div>

      <button
        v-if="!show_mobile_search"
        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-base-white shadow-sm transition-colors hover:bg-base-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:border-gray-700 dark:focus-visible:ring-gray-100 md:hidden"
        type="button"
        aria-label="Search articles"
        @click="openMobileSearch"
      >
        <Search class="h-5 w-5" aria-hidden="true" />
      </button>

      <NuxtLink :to="app_routes.articles.add" class="hidden shrink-0 md:block">
        Contribute
      </NuxtLink>

      <NuxtLink
        v-if="!show_mobile_search"
        :to="app_routes.articles.add"
        class="shrink-0 md:hidden"
      >
        Contribute
      </NuxtLink>
    </div>

    <div v-if="show_mobile_search" class="relative mb-4 md:hidden">
      <div
        class="flex items-center gap-2 rounded-lg border border-gray-200 bg-base-white p-2 shadow-sm dark:border-gray-700"
      >
        <Input
          id="mobile-article-search"
          v-model="search_query"
          class="input !mb-0 w-full"
          type="search"
          placeholder="Search articles..."
          aria-label="Search articles"
          aria-controls="mobile-article-search-results"
          :aria-expanded="show_search_results"
        />
        <button
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-base-white transition-colors hover:bg-base-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:border-gray-700 dark:focus-visible:ring-gray-100"
          type="button"
          aria-label="Close search"
          @click="closeMobileSearch"
        >
          <X class="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div
        v-if="show_search_results"
        id="mobile-article-search-results"
        class="absolute left-0 right-0 top-full z-30 mt-2 max-h-80 overflow-y-auto scroll-bar-none rounded-lg border border-gray-200 bg-base-white shadow-lg dark:border-gray-700"
        role="listbox"
      >
        <NuxtLink
          v-for="article in sanitized_content"
          :key="`${article.id}-mobile-search-result`"
          :to="app_routes.articles.view(encodeURI(article.slug as string))"
          class="block border-b border-gray-100 px-4 py-3 outline-none transition-colors last:border-b-0 hover:bg-base-light focus-visible:bg-base-light dark:border-gray-800"
          role="option"
        >
          <p class="text-sm font-semibold capitalize text-main">
            {{ article.title.toLowerCase() }}
          </p>
          <div
            class="prose prose-sm mt-1 max-h-12 max-w-none overflow-hidden text-xs text-muted dark:prose-invert"
            v-html="article.summary"
          ></div>
        </NuxtLink>

        <div
          v-if="sanitized_content.length === 0"
          class="px-4 py-6 text-center text-sm text-muted"
        >
          No articles found.
        </div>
      </div>
    </div>

    <div
      v-if="is_loading && sanitized_content.length === 0"
      class="flex items-center justify-center py-6"
    >
      <div class="w-10 h-10 mx-auto shadow-lg bg-base-light rounded-full p-2">
        <IconsLoadingIcon />
      </div>
    </div>

    <section
      v-else
      ref="feed"
      class="relative h-[calc(100dvh-13rem)] overflow-y-auto snap-y snap-mandatory scroll-smooth scroll-bar-none rounded-lg bg-base-white lg:h-[calc(100dvh-14rem)]"
      aria-label="Articles feed"
      tabindex="0"
      @scroll="handleFeedScroll"
      @wheel="handleFeedInteraction"
      @touchstart="handleFeedInteraction"
      @pointerdown="handleFeedInteraction"
      @keydown="handleFeedInteraction"
    >
      <div
        class="pointer-events-none sticky right-4 top-1/2 z-10 ml-auto hidden w-fit -translate-y-1/2 flex-col gap-3 pr-4 lg:flex"
        aria-hidden="false"
      >
        <button
          class="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-base-white shadow-sm transition-colors hover:bg-base-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:border-gray-700 dark:focus-visible:ring-gray-100"
          type="button"
          aria-label="Previous article"
          @click="goToPreviousArticle"
        >
          <ChevronUp class="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          class="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-base-white shadow-sm transition-colors hover:bg-base-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:border-gray-700 dark:focus-visible:ring-gray-100"
          type="button"
          aria-label="Next article"
          @click="goToNextArticle"
        >
          <ChevronDown class="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <NuxtLink
        :to="app_routes.articles.view(encodeURI(article.slug as string))"
        v-for="(article, index) in sanitized_content"
        :key="article.id"
        :ref="(element) => setArticleItem(element, index)"
        :style="getArticleCardStyle(article)"
        class="flex min-h-full snap-start snap-always flex-col justify-end bg-cover bg-center px-5 py-8 text-sm break-words outline-none transition-colors hover:bg-base-light focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-gray-100 sm:px-8 lg:justify-center lg:px-12 border-gray-400 dark:border-gray-600 mb-4 lg-mb-6"
      >
        <article class="mx-auto flex w-full max-w-3xl flex-col gap-5">
          <h2
            class="text-4xl font-extrabold capitalize leading-tight lg:text-5xl"
            :class="getArticleImageUrl(article) ? 'text-white' : 'text-main'"
          >
            {{ article.title.toLowerCase() }}
          </h2>
          <div
            class="prose prose-sm max-h-56 max-w-none overflow-hidden dark:prose-invert sm:max-h-72"
            :class="getArticleImageUrl(article) ? 'text-white/85' : 'text-sub'"
            v-html="article.summary"
          ></div>
          <span
            class="w-fit rounded-full px-4 py-2 text-xs font-semibold"
            :class="
              getArticleImageUrl(article)
                ? 'bg-white text-gray-900'
                : 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
            "
          >
            Read article
          </span>
        </article>
      </NuxtLink>

      <div
        v-if="is_loading_more"
        class="flex min-h-24 snap-start items-center justify-center py-6"
      >
        <div class="w-10 h-10 mx-auto shadow-lg bg-base-light rounded-full p-2">
          <IconsLoadingIcon />
        </div>
      </div>
      <AppInfiniteScroll v-if="has_more_articles" @refresh="loadMoreArticles" />
      <div
        v-if="sanitized_content.length === 0 && !is_loading"
        class="flex min-h-full snap-start items-center justify-center px-4 text-center text-sm text-muted"
      >
        No articles found.
      </div>
    </section>
  </main>
</template>
