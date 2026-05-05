<script setup lang="ts">
import { useToast } from "@/components/ui/toast/use-toast";
import { ChevronDown, ChevronUp, Search, X } from "lucide-vue-next";
import type { ComponentPublicInstance } from "vue";
import { useArticleStore } from "~/store/articles";
import type { Article } from "~/types/article";
import app_routes from "~/utils/routes";

type ArticlesFeedState = {
  articles: Article[];
  hasMoreArticles: boolean;
  imageUrls: Record<string, string | null>;
  scrollTop: number;
  searchQuery: string;
};

definePageMeta({
  layout: "generic",
});

const { toast } = useToast();
const articles_feed_state = useState<ArticlesFeedState>(
  "articles-feed-state",
  () => ({
    articles: [],
    hasMoreArticles: true,
    imageUrls: {},
    scrollTop: 0,
    searchQuery: "",
  }),
);
const is_loading = ref(false);
const is_loading_more = ref(false);
const has_more_articles = ref(articles_feed_state.value.hasMoreArticles);
const page_size = 10;
const auto_scroll_delay = 5000;
const api_url = import.meta.env.VITE_API_BASE_URL;
const articleStore = useArticleStore();
const search_query = ref(articles_feed_state.value.searchQuery);
const is_mobile_search_open = ref(false);
const sanitized_content = ref<Article[]>([
  ...articles_feed_state.value.articles,
]);
const article_image_urls = ref<Record<string, string | null>>({
  ...articles_feed_state.value.imageUrls,
});
const feed = ref<HTMLElement | null>(null);
const article_items = ref<HTMLElement[]>([]);
const auto_scroll_timer = ref<ReturnType<typeof setTimeout> | null>(null);
const scroll_settle_timer = ref<ReturnType<typeof setTimeout> | null>(null);
const search_timer = ref<ReturnType<typeof setTimeout> | null>(null);
/** Bumped when the browse feed is replaced so stale in-flight fetches cannot overwrite state incorrectly. */
const articles_list_generation = ref(0);
/** Bumped per search request so stale search responses cannot overwrite the dropdown. */
const search_list_generation = ref(0);
const search_debounce_ms = 320;
/** Results shown only in the search dropdown; the main feed always uses browse pagination. */
const search_results = ref<Article[]>([]);
const is_search_loading = ref(false);
const is_searching = computed(() => search_query.value.trim().length > 0);
const show_search_results = computed(
  () => is_searching.value && !is_loading.value,
);
const show_mobile_search = computed(
  () => is_mobile_search_open.value || is_searching.value,
);
const is_restoring_feed_scroll = ref(sanitized_content.value.length > 0);

/** Syncs with `DarkMode.vue` / `document.documentElement.classList` (`dark`). */
const html_is_dark = ref(false);

/** Pastel stops (~Tailwind 200–250): soft blurs for no-image cards without neon saturation. */
const NO_IMAGE_GRADIENT_PALETTES = [
  ["#fbcfe8", "#ddd6fe", "#bae6fd"],
  ["#a7f3d0", "#a5f3fc", "#bfdbfe"],
  ["#dbeafe", "#cffafe", "#fecdd3"],
  ["#ddd6fe", "#c7d2fe", "#99f6e4"],
  ["#bbf7d0", "#d9f99d", "#e0e7ff"],
  ["#99f6e4", "#bfdbfe", "#f5d0fe"],
  ["#fecdd3", "#f5d0fe", "#bae6fd"],
  ["#e0f2fe", "#dbeafe", "#e9d5ff"],
] as const;

function hashArticleKey(article: Article): number {
  const key = String(article.id ?? article.slug ?? article.title ?? "");
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (Math.imul(31, h) + key.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** 0–360; grayscale → -1 (skip hue comparison). */
function rgbToHue(r: number, g: number, b: number): number {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  if (max === min) return -1;
  const d = max - min;
  let h = 0;
  switch (max) {
    case rn:
      h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
      break;
    case gn:
      h = ((bn - rn) / d + 2) / 6;
      break;
    default:
      h = ((rn - gn) / d + 4) / 6;
  }
  return h * 360;
}

function circularHueDistance(a: number, b: number): number {
  if (a < 0 || b < 0) return 180;
  const d = Math.abs(a - b);
  return Math.min(d, 360 - d);
}

/** Matches soft hero-style orbs; hues align with mild gradient stops above. */
function parseHexRgb(hex: string): [number, number, number] {
  const n = hex.replace("#", "").trim();
  if (n.length !== 6) return [148, 163, 184];
  return [
    Number.parseInt(n.slice(0, 2), 16),
    Number.parseInt(n.slice(2, 4), 16),
    Number.parseInt(n.slice(4, 6), 16),
  ];
}

/** Per palette, hue of first stop — used to avoid consecutive “same family” combos. */
const NO_IMAGE_PALETTE_ANCHOR_HUES = NO_IMAGE_GRADIENT_PALETTES.map((p) => {
  const [r, g, b] = parseHexRgb(p[0]);
  return rgbToHue(r, g, b);
});

/** Min degrees on the wheel between consecutive no-image cards’ palettes. */
const NO_IMAGE_CONSECUTIVE_MIN_HUE_SEP = 48;

function hexToRgba(hex: string, alpha: number): string {
  const [r, g, b] = parseHexRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Linear blend between two hex colours (used to mute orb hues in dark mode). */
function mixHexToward(hex: string, targetHex: string, amount: number): string {
  const t = Math.min(1, Math.max(0, amount));
  const [r1, g1, b1] = parseHexRgb(hex);
  const [r2, g2, b2] = parseHexRgb(targetHex);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

/** Dark: matte orbs — strong mix toward neutral zinc so glow stays soft and low-chroma. */
const DARK_ORB_TINT_TARGET = "#3f3f46";
const DARK_ORB_MIX = 0.58;
const DARK_ORB_ALPHA_SCALE = 0.88;

/** Orb positions: corner blooms + extra accents (hero-style + fuller field). */
const NO_IMAGE_ORB_SLOTS = [
  {
    positionClass:
      "-right-24 -top-24 h-56 w-56 lg:-right-32 lg:-top-32 lg:h-80 lg:w-80",
    colorIx: 0,
    alpha: 0.7,
  },
  {
    positionClass:
      "-bottom-24 -left-20 h-48 w-48 lg:-bottom-32 lg:-left-28 lg:h-72 lg:w-72",
    colorIx: 2,
    alpha: 0.7,
  },
  {
    positionClass:
      "left-1/2 -top-14 h-44 w-44 -translate-x-1/2 lg:-top-20 lg:h-60 lg:w-60",
    colorIx: 1,
    alpha: 0.42,
  },
  {
    positionClass:
      "-left-20 top-[28%] h-40 w-40 -translate-y-1/2 lg:-left-28 lg:h-56 lg:w-56",
    colorIx: 1,
    alpha: 0.5,
  },
  {
    positionClass:
      "right-[8%] -bottom-12 h-52 w-52 translate-y-1/2 lg:-bottom-16 lg:h-72 lg:w-72",
    colorIx: 0,
    alpha: 0.48,
  },
] as const;

function orbBackgroundColor(slot: (typeof NO_IMAGE_ORB_SLOTS)[number], color: string) {
  if (!html_is_dark.value) {
    return hexToRgba(color, slot.alpha);
  }
  const mixed = mixHexToward(color, DARK_ORB_TINT_TARGET, DARK_ORB_MIX);
  return hexToRgba(mixed, slot.alpha * DARK_ORB_ALPHA_SCALE);
}

function getNoImageHeroOrbs(article: Article, feedIndex: number) {
  const palette = getNoImagePalette(article, feedIndex);
  const colors = [...palette];
  const h = hashArticleKey(article);

  return NO_IMAGE_ORB_SLOTS.map((slot, i) => {
    const color = colors[(slot.colorIx + h + i) % 3];
    return {
      className: `pointer-events-none absolute -z-10 rounded-full blur-3xl lg:blur-[5rem] ${slot.positionClass}`,
      style: { backgroundColor: orbBackgroundColor(slot, color) },
    };
  });
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
  if (/^(https?:|data:|blob:)/i.test(image_path)) return image_path;

  const api_base_url = api_url?.replace(/\/+$/, "") ?? "";
  const normalized_path = image_path
    .replace(/^\/+/, "")
    .replace(/^public\/+/, "");
  const static_path = normalized_path.startsWith("articles/")
    ? normalized_path
    : `articles/${normalized_path}`;

  return `${api_base_url}/${static_path}`;
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

/** Prefer hash-based palette, but never same index / too-similar hue vs previous no-image card. */
function resolveFeedNoImagePaletteIndex(
  article: Article,
  lastIdx: number | null,
): number {
  const n = NO_IMAGE_GRADIENT_PALETTES.length;
  const h0 = hashArticleKey(article) % n;
  if (lastIdx === null) return h0;

  for (let k = 0; k < n; k++) {
    const candidate = (h0 + k) % n;
    if (candidate === lastIdx) continue;
    if (
      circularHueDistance(
        NO_IMAGE_PALETTE_ANCHOR_HUES[candidate],
        NO_IMAGE_PALETTE_ANCHOR_HUES[lastIdx],
      ) < NO_IMAGE_CONSECUTIVE_MIN_HUE_SEP
    )
      continue;
    return candidate;
  }
  for (let k = 0; k < n; k++) {
    const candidate = (h0 + k) % n;
    if (candidate !== lastIdx) return candidate;
  }
  return h0;
}

const no_image_feed_palette_index = computed(() => {
  const articles = sanitized_content.value;
  const out: (number | null)[] = new Array(articles.length).fill(null);
  let last: number | null = null;
  for (let i = 0; i < articles.length; i++) {
    if (getArticleImageUrl(articles[i])) {
      last = null;
      continue;
    }
    const idx = resolveFeedNoImagePaletteIndex(articles[i], last);
    out[i] = idx;
    last = idx;
  }
  return out;
});

function getNoImagePalette(
  article: Article,
  feedIndex: number,
): readonly [string, string, string] {
  const resolved = no_image_feed_palette_index.value[feedIndex];
  const n = NO_IMAGE_GRADIENT_PALETTES.length;
  const idx =
    resolved !== null && resolved !== undefined
      ? resolved
      : hashArticleKey(article) % n;
  return NO_IMAGE_GRADIENT_PALETTES[idx];
}

function getArticleCardStyle(article: Article) {
  const image_url = getArticleImageUrl(article);

  if (!image_url) {
    return {};
  }

  return {
    backgroundImage: `linear-gradient(180deg, rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.76)), url("${image_url}")`,
  };
}

function saveFeedState({ scroll_top = feed.value?.scrollTop ?? 0 } = {}) {
  articles_feed_state.value = {
    articles: [...sanitized_content.value],
    hasMoreArticles: has_more_articles.value,
    imageUrls: { ...article_image_urls.value },
    scrollTop: scroll_top,
    searchQuery: search_query.value,
  };
}

async function restoreFeedScroll(scroll_top: number) {
  await nextTick();

  if (feed.value) feed.value.scrollTop = scroll_top;

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

  is_restoring_feed_scroll.value = false;
}

async function getArticles({
  append = false,
  list_generation_when_started,
}: {
  append?: boolean;
  /** When omitted, coherence is keyed off the generation at invocation time (fine for append). */
  list_generation_when_started?: number;
} = {}) {
  const coherence_gen =
    list_generation_when_started ?? articles_list_generation.value;

  if (append) {
    if (is_loading_more.value || !has_more_articles.value) return;
  } else {
    const can_start =
      !is_loading.value ||
      list_generation_when_started === articles_list_generation.value;
    if (!can_start) return;
  }

  try {
    if (append) {
      is_loading_more.value = true;
    } else {
      is_loading.value = true;
      sanitized_content.value = [];
      article_items.value = [];
    }

    const skip = append ? sanitized_content.value.length : 0;
    const items = await articleStore.fetchArticles({
      cursor: "1",
      skip,
      take: page_size,
    });
    if (coherence_gen !== articles_list_generation.value) return;
    sanitized_content.value = append
      ? [...sanitized_content.value, ...items]
      : items;
    has_more_articles.value = items.length === page_size;
    saveFeedState();
  } catch (error) {
    if (coherence_gen !== articles_list_generation.value) return;
    toast({
      title: "Error loading article",
      description: error as string,
    });
  } finally {
    if (coherence_gen === articles_list_generation.value) {
      is_loading.value = false;
      is_loading_more.value = false;
    }
  }
}

async function loadMoreArticles({ snap_to_new_item = true } = {}) {
  const first_new_article_index = sanitized_content.value.length;

  await getArticles({ append: true });

  if (
    snap_to_new_item &&
    sanitized_content.value.length > first_new_article_index
  ) {
    await nextTick();
    scrollFeedToArticle(article_items.value[first_new_article_index]);
  }
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

function scrollFeedToArticle(article: HTMLElement | undefined) {
  if (!feed.value || !article) return;

  feed.value.scrollTo({
    top: article.offsetTop,
    behavior: "smooth",
  });
}

async function scrollToNextArticle() {
  const current_index = getCurrentArticleIndex();
  let next_article = article_items.value[current_index + 1];

  if (!next_article && has_more_articles.value) {
    await loadMoreArticles({ snap_to_new_item: false });
    await nextTick();
    next_article = article_items.value[current_index + 1];
  }

  scrollFeedToArticle(next_article);
}

function scrollToPreviousArticle() {
  const current_index = getCurrentArticleIndex();
  const previous_article = article_items.value[current_index - 1];

  scrollFeedToArticle(previous_article);
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
  if (is_restoring_feed_scroll.value) return;

  clearAutoScrollTimer();

  if (scroll_settle_timer.value) clearTimeout(scroll_settle_timer.value);

  scroll_settle_timer.value = setTimeout(() => {
    saveFeedState();
    scheduleAutoScroll();
  }, 250);
}

function handleFeedInteraction() {
  scheduleAutoScroll();
}

function resetFeedPosition() {
  if (feed.value) feed.value.scrollTop = 0;
  saveFeedState({ scroll_top: 0 });
}

async function refreshArticles() {
  articles_list_generation.value += 1;
  const gen = articles_list_generation.value;
  has_more_articles.value = true;
  resetFeedPosition();
  clearAutoScrollTimer();
  await getArticles({ list_generation_when_started: gen });
  await nextTick();
  if (gen !== articles_list_generation.value) return;
  saveFeedState({ scroll_top: 0 });
  scheduleAutoScroll();
}

async function openMobileSearch() {
  is_mobile_search_open.value = true;
  await nextTick();
  document.querySelector<HTMLInputElement>("#mobile-article-search")?.focus();
}

function closeMobileSearch() {
  search_list_generation.value += 1;
  search_query.value = "";
  search_results.value = [];
  is_mobile_search_open.value = false;
}

async function fetchSearchResults(trimmed_query: string) {
  if (!trimmed_query) {
    search_results.value = [];
    is_search_loading.value = false;
    return;
  }
  search_list_generation.value += 1;
  const gen = search_list_generation.value;
  is_search_loading.value = true;
  try {
    const items = await articleStore.searchArticles(trimmed_query, {
      skip: 0,
      take: page_size,
    });
    if (gen !== search_list_generation.value) return;
    search_results.value = items;
  } catch (error) {
    if (gen !== search_list_generation.value) return;
    toast({
      title: "Search failed",
      description: error as string,
    });
    search_results.value = [];
  } finally {
    if (gen === search_list_generation.value) {
      is_search_loading.value = false;
    }
  }
}

function setArticleItem(
  element: Element | ComponentPublicInstance | null,
  index: number,
) {
  if (!element) return;

  if (element instanceof HTMLElement) {
    article_items.value[index] = element;
    return;
  }

  const root = (element as ComponentPublicInstance).$el;
  if (root instanceof HTMLElement) article_items.value[index] = root;
}

onBeforeUpdate(() => {
  article_items.value = [];
});

let html_dark_observer: MutationObserver | null = null;

onMounted(async () => {
  if (import.meta.client) {
    html_is_dark.value = document.documentElement.classList.contains("dark");
    html_dark_observer = new MutationObserver(() => {
      html_is_dark.value = document.documentElement.classList.contains("dark");
    });
    html_dark_observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  const restored_scroll_top = articles_feed_state.value.scrollTop;

  if (sanitized_content.value.length === 0) {
    articles_list_generation.value += 1;
    const initial_gen = articles_list_generation.value;
    await getArticles({ list_generation_when_started: initial_gen });
    is_restoring_feed_scroll.value = false;
  } else {
    await restoreFeedScroll(restored_scroll_top);
  }

  scheduleAutoScroll();

  const initial_search = search_query.value.trim();
  if (initial_search) {
    void fetchSearchResults(initial_search);
  }
});

onBeforeRouteLeave(() => {
  saveFeedState();
});

watch(
  () => search_query.value,
  () => {
    if (search_timer.value) clearTimeout(search_timer.value);
    const trimmed = search_query.value.trim();
    if (!trimmed) {
      search_list_generation.value += 1;
      search_results.value = [];
      is_search_loading.value = false;
      return;
    }
    search_timer.value = setTimeout(() => {
      search_timer.value = null;
      void fetchSearchResults(trimmed);
    }, search_debounce_ms);
  },
);

onBeforeUnmount(() => {
  html_dark_observer?.disconnect();
  html_dark_observer = null;
  clearAutoScrollTimer();
  if (scroll_settle_timer.value) clearTimeout(scroll_settle_timer.value);
  if (search_timer.value) clearTimeout(search_timer.value);
});
</script>

<template>
  <main class="articles-page w-full min-w-0">
    <div class="mb-4 flex min-w-0 items-center justify-between gap-3">
      <h1
        class="min-w-0 shrink break-words text-4xl font-extrabold tracking-tight [overflow-wrap:anywhere] lg:text-2xl"
      >
        Articles
      </h1>

      <div class="relative ml-auto hidden w-full min-w-0 max-w-sm md:block">
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
          <div
            v-if="is_search_loading"
            class="flex items-center justify-center py-8"
          >
            <div
              class="w-8 h-8 mx-auto shadow-lg bg-base-light rounded-full p-1.5"
            >
              <IconsLoadingIcon />
            </div>
          </div>

          <template v-else>
            <NuxtLink
              v-for="article in search_results"
              :key="`${article.id}-search-result`"
              :to="app_routes.articles.view(encodeURI(article.slug as string))"
              class="block min-w-0 max-w-full border-b border-gray-100 px-4 py-3 outline-none transition-colors last:border-b-0 hover:bg-base-light focus-visible:bg-base-light dark:border-gray-800"
              role="option"
            >
              <p
                class="break-words text-sm font-semibold capitalize text-main [overflow-wrap:anywhere]"
              >
                {{ article.title.toLowerCase() }}
              </p>
              <div
                class="prose prose-sm mt-1 max-h-12 max-w-none overflow-hidden break-words text-xs text-muted [overflow-wrap:anywhere] dark:prose-invert"
              >
                {{ article.summary }}
              </div>
            </NuxtLink>

            <div
              v-if="search_results.length === 0"
              class="px-4 py-6 text-center text-sm text-muted"
            >
              No articles found.
            </div>
          </template>
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

    <div v-if="show_mobile_search" class="relative mb-4 min-w-0 md:hidden">
      <div
        class="flex min-w-0 items-center gap-2 rounded-lg border border-gray-200 bg-base-white p-2 shadow-sm dark:border-gray-700"
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
        <div
          v-if="is_search_loading"
          class="flex items-center justify-center py-8"
        >
          <div
            class="w-8 h-8 mx-auto shadow-lg bg-base-light rounded-full p-1.5"
          >
            <IconsLoadingIcon />
          </div>
        </div>

        <template v-else>
          <NuxtLink
            v-for="article in search_results"
            :key="`${article.id}-mobile-search-result`"
            :to="app_routes.articles.view(encodeURI(article.slug as string))"
            class="block min-w-0 max-w-full border-b border-gray-100 px-4 py-3 outline-none transition-colors last:border-b-0 hover:bg-base-light focus-visible:bg-base-light dark:border-gray-800"
            role="option"
          >
            <p
              class="break-words text-sm font-semibold capitalize text-main [overflow-wrap:anywhere]"
            >
              {{ article.title.toLowerCase() }}
            </p>
            <div
              class="prose prose-sm mt-1 max-h-12 max-w-none overflow-hidden break-words text-xs text-muted [overflow-wrap:anywhere] dark:prose-invert"
            >
              {{ article.summary }}
            </div>
          </NuxtLink>

          <div
            v-if="search_results.length === 0"
            class="px-4 py-6 text-center text-sm text-muted"
          >
            No articles found.
          </div>
        </template>
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
      class="relative min-w-0 max-w-full h-[calc(100dvh-13rem)] overflow-y-auto overscroll-contain scroll-bar-none rounded-2xl bg-base-white lg:h-[calc(100dvh-14rem)]"
      :class="
        is_restoring_feed_scroll
          ? 'invisible snap-none scroll-auto'
          : 'snap-y snap-mandatory scroll-smooth'
      "
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
        v-for="(article, index) in sanitized_content"
        :key="article.id"
        :ref="(element) => setArticleItem(element, index)"
        :to="app_routes.articles.view(encodeURI(article.slug as string))"
        :style="getArticleCardStyle(article)"
        :class="[
          'relative isolate mb-4 flex min-h-full min-w-0 snap-start snap-always flex-col overflow-hidden text-sm break-words outline-none transition-colors focus-visible:ring-2 focus-visible:ring-gray-900 [overflow-wrap:anywhere] dark:focus-visible:ring-gray-100 lg-mb-6 rounded-2xl',
          getArticleImageUrl(article)
            ? 'justify-end bg-cover bg-center px-5 py-8 hover:bg-base-light sm:px-8 lg:justify-center lg:px-12'
            : 'justify-center border border-gray-200 bg-base-white px-5 py-6 shadow-sm hover:bg-base-light dark:border-gray-800 sm:px-8 lg:px-10',
        ]"
      >
        <template v-if="!getArticleImageUrl(article)">
          <div
            v-for="(orb, orb_i) in getNoImageHeroOrbs(article, index)"
            :key="`${article.id}-orb-${orb_i}`"
            :class="orb.className"
            :style="orb.style"
          ></div>
        </template>

        <article
          class="relative mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-5"
        >
          <h2
            class="min-w-0 break-words text-4xl font-extrabold capitalize leading-tight [overflow-wrap:anywhere] lg:text-5xl"
            :class="getArticleImageUrl(article) ? 'text-white' : 'text-main'"
          >
            {{ article.title.toLowerCase() }}
          </h2>
          <div
            class="max-h-56 max-w-none overflow-hidden break-words [overflow-wrap:anywhere] sm:max-h-72"
            :class="
              getArticleImageUrl(article)
                ? 'prose prose-sm text-white/85 dark:prose-invert'
                : 'text-sm font-medium text-muted'
            "
          >
            {{ article.summary }}
          </div>
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
