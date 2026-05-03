<script setup lang="ts">
import { ArrowLeft, ChevronLeft, ChevronRight, Sparkles } from "lucide-vue-next";
import { useArticleStore } from "~/store/articles";
import type { SuggestedArticleSource } from "~/store/articles";
import { useDictStore } from "~/store/dictionary";
import type { Article } from "~/types/article";
import type { Word } from "~/types/word";
import app_routes from "~/utils/routes";

type SwipeSuggestion = {
  key: string;
  title: string;
  path: string;
  articleSlug?: string;
  wordTerm?: string;
  wordId?: string;
};

const props = withDefaults(
  defineProps<{
    source: SuggestedArticleSource;
    currentSlug?: string;
    terms?: string[];
    backTo?: string;
    /** When false, the fixed ArrowLeft control is hidden (e.g. while an inline hero back link is visible). */
    showFloatingBack?: boolean;
  }>(),
  {
    currentSlug: undefined,
    terms: () => [],
    backTo: app_routes.articles.list,
    showFloatingBack: true,
  },
);

const route = useRoute();
const articleStore = useArticleStore();
const dictStore = useDictStore();
const viewed_items = useState<{ key: string; path: string }[]>("article-swipe-viewed-items", () => []);
const suggestions = ref<SwipeSuggestion[]>([]);
const suggestion_index = ref(0);
const is_loading = ref(false);
const is_animating = ref(false);
const swipe_direction = ref<"left" | "right" | null>(null);
const start_point = ref<{ x: number; y: number } | null>(null);
const swipe_threshold = 72;
const animation_duration = 260;

const active_suggestion = computed(() => {
  if (!suggestions.value.length) return null;
  return suggestions.value[suggestion_index.value % suggestions.value.length];
});

const suggestion_kicker = computed(() => (props.source === "article" ? "related article" : "Learn something new"));

const swipe_nav_region_label = computed(() => (props.source === "article" ? "Article suggestion navigation" : "Word suggestion navigation"));

const next_suggestion_aria = computed(() => (props.source === "article" ? "Open suggested article" : "Open suggested word"));

const previous_item_aria = computed(() => (props.source === "article" ? "Return to the article you were just reading" : "Return to the word you were just reading"));

const current_item_key = computed(() => {
  if (props.source === "article" && props.currentSlug) {
    return `article:${props.currentSlug}`;
  }

  return `${props.source}:${route.fullPath}`;
});
const can_go_previous = computed(() => viewed_items.value.length > 1);
const viewed_article_slugs = computed(() => {
  return viewed_items.value.map((item) => item.key.match(/^article:(.+)$/)?.[1]).filter((slug): slug is string => Boolean(slug));
});
const viewed_item_paths = computed(() => {
  return new Set(viewed_items.value.map((item) => item.path));
});

const normalized_terms = computed(() => {
  return Array.from(new Set(props.terms.map((term) => term.trim()).filter((term) => term.length >= 2)));
});

function getPoint(event: TouchEvent | PointerEvent) {
  if ("changedTouches" in event) {
    const touch = event.changedTouches[0] || event.touches[0];
    return touch ? { x: touch.clientX, y: touch.clientY } : null;
  }

  return { x: event.clientX, y: event.clientY };
}

function startedOnControl(event: Event) {
  const target = event.target;
  if (!(target instanceof Element)) return false;

  return Boolean(target.closest("button, input, textarea, select, [contenteditable='true'], .article-swipe-controls"));
}

function handleSwipeStart(event: TouchEvent | PointerEvent) {
  if (startedOnControl(event)) return;

  start_point.value = getPoint(event);
}

function handleSwipeEnd(event: TouchEvent | PointerEvent) {
  if (!start_point.value || is_animating.value) {
    start_point.value = null;
    return;
  }

  const end_point = getPoint(event);
  if (!end_point) {
    start_point.value = null;
    return;
  }

  const delta_x = end_point.x - start_point.value.x;
  const delta_y = end_point.y - start_point.value.y;
  start_point.value = null;

  if (Math.abs(delta_x) < swipe_threshold) return;
  if (Math.abs(delta_x) < Math.abs(delta_y) * 1.2) return;

  if (delta_x < 0) {
    navigateToPreviousItem();
    return;
  }

  navigateToSuggestedArticle("right");
}

async function prefetchSuggestion(article = active_suggestion.value) {
  if (!article) return;

  try {
    if (article.articleSlug) {
      await articleStore.prefetchArticlePayload(article.articleSlug);
      return;
    }

    if (article.wordTerm) {
      await dictStore.fetchWord(article.wordTerm, article.wordId || "");
    }
  } catch {
    // Prefetch should never block reading the current page.
  }
}

function articleToSuggestion(article: Article): SwipeSuggestion | null {
  if (!article.slug) return null;

  return {
    key: `article:${article.slug}`,
    title: article.title,
    path: app_routes.articles.view(encodeURI(article.slug)),
    articleSlug: article.slug,
  };
}

function wordToSuggestion(word: Word): SwipeSuggestion | null {
  if (!word.term) return null;

  const id = word.id || "";

  return {
    key: `word:${id || word.term}`,
    title: word.term,
    path: app_routes.dictionary.view(encodeURI(word.term), encodeURI(id)),
    wordTerm: word.term,
    wordId: id,
  };
}

async function getArticleSuggestions() {
  if (props.source === "article" && !props.currentSlug) return;

  const articles = await articleStore.fetchSuggestedArticles({
    source: props.source,
    slug: props.currentSlug,
    terms: normalized_terms.value,
    excludeSlugs: viewed_article_slugs.value,
    take: 5,
  });

  suggestions.value = articles.map(articleToSuggestion).filter((suggestion): suggestion is SwipeSuggestion => {
    return Boolean(suggestion && suggestion.articleSlug !== props.currentSlug && !viewed_item_paths.value.has(suggestion.path));
  });
}

async function getWordSuggestions() {
  const searched_words = (await Promise.all(normalized_terms.value.slice(0, 5).map((term) => dictStore.searchWord(term)))).flat();
  const seen_keys = new Set<string>();
  const buildSuggestions = (words: Word[]) =>
    words
      .map(wordToSuggestion)
      .filter((suggestion): suggestion is SwipeSuggestion => {
        if (!suggestion) return false;
        if (seen_keys.has(suggestion.key)) return false;
        if (viewed_item_paths.value.has(suggestion.path)) return false;

        seen_keys.add(suggestion.key);
        return true;
      })
      .slice(0, 5);

  suggestions.value = buildSuggestions(searched_words);

  if (suggestions.value.length > 0) return;

  seen_keys.clear();
  const fallback_words = (await dictStore.fetchWords({ take: 25, skip: viewed_items.value.length })).words;

  suggestions.value = fallback_words
    .map(wordToSuggestion)
    .filter((suggestion): suggestion is SwipeSuggestion => {
      if (!suggestion) return false;
      if (seen_keys.has(suggestion.key)) return false;
      if (viewed_item_paths.value.has(suggestion.path)) return false;

      seen_keys.add(suggestion.key);
      return true;
    })
    .slice(0, 5);
}

async function getSuggestions() {
  try {
    is_loading.value = true;
    if (props.source === "article") {
      await getArticleSuggestions();
    } else {
      await getWordSuggestions();
    }
    suggestion_index.value = 0;
    await prefetchSuggestion();
  } catch {
    suggestions.value = [];
  } finally {
    is_loading.value = false;
  }
}

function goBack() {
  navigateTo(props.backTo);
}

function rememberCurrentItem() {
  const key = current_item_key.value;
  const last_item = viewed_items.value[viewed_items.value.length - 1];

  if (last_item?.key === key) return;

  const existing_index = viewed_items.value.findIndex((item) => item.key === key);

  viewed_items.value = existing_index >= 0 ? viewed_items.value.slice(0, existing_index + 1) : [...viewed_items.value, { key, path: route.fullPath }];
}

function navigateToPreviousItem() {
  if (is_animating.value || !can_go_previous.value) return;

  const previous_item = viewed_items.value[viewed_items.value.length - 2];
  if (!previous_item) return;

  swipe_direction.value = "left";
  is_animating.value = true;
  viewed_items.value = viewed_items.value.slice(0, -1);

  window.setTimeout(() => {
    navigateTo(previous_item.path);
  }, animation_duration);
}

async function navigateToSuggestedArticle(direction: "right") {
  if (is_animating.value || !suggestions.value.length) return;

  const target_article = active_suggestion.value;
  const target_path = target_article?.path;
  if (!target_path) return;

  swipe_direction.value = direction;
  is_animating.value = true;
  await prefetchSuggestion(target_article);

  window.setTimeout(() => {
    navigateTo(target_path);
  }, animation_duration);
}

watch(
  () => [props.source, props.currentSlug, normalized_terms.value.join("|")],
  () => {
    rememberCurrentItem();
    getSuggestions();
  },
  { immediate: true },
);

onMounted(() => {
  window.addEventListener("touchstart", handleSwipeStart, { passive: true });
  window.addEventListener("touchend", handleSwipeEnd, { passive: true });
  window.addEventListener("pointerdown", handleSwipeStart);
  window.addEventListener("pointerup", handleSwipeEnd);
});

onBeforeUnmount(() => {
  window.removeEventListener("touchstart", handleSwipeStart);
  window.removeEventListener("touchend", handleSwipeEnd);
  window.removeEventListener("pointerdown", handleSwipeStart);
  window.removeEventListener("pointerup", handleSwipeEnd);
});
</script>

<template>
  <div class="article-swipe-controls pointer-events-none fixed inset-0 z-40">
    <button
      v-show="props.showFloatingBack"
      type="button"
      class="pointer-events-auto fixed left-4 top-24 inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-base-white/95 text-main shadow-lg backdrop-blur transition hover:bg-base-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:border-gray-700 dark:focus-visible:ring-gray-100 sm:left-6"
      aria-label="Go back"
      @click="goBack">
      <ArrowLeft class="h-5 w-5" aria-hidden="true" />
    </button>

    <div
      v-if="active_suggestion || can_go_previous"
      class="pointer-events-none fixed inset-y-0 left-0 right-0 hidden items-center justify-between px-5 lg:flex xl:px-8"
      :aria-label="swipe_nav_region_label">
      <button
        type="button"
        class="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-base-white/95 text-main shadow-lg backdrop-blur transition hover:-translate-x-0.5 hover:bg-base-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:focus-visible:ring-gray-100"
        :disabled="is_loading || is_animating || !can_go_previous"
        :aria-label="previous_item_aria"
        @click="navigateToPreviousItem">
        <ChevronLeft class="h-6 w-6" aria-hidden="true" />
      </button>

      <button
        type="button"
        class="pointer-events-auto inline-flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-base-white/95 text-main shadow-lg backdrop-blur transition hover:translate-x-0.5 hover:bg-base-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:focus-visible:ring-gray-100"
        :disabled="is_loading || is_animating || !active_suggestion"
        :aria-label="next_suggestion_aria"
        @click="navigateToSuggestedArticle('right')">
        <ChevronRight class="h-6 w-6" aria-hidden="true" />
      </button>
    </div>

    <button
      v-if="active_suggestion"
      type="button"
      class="swipe-suggestion pointer-events-auto fixed bottom-5 left-1/2 flex w-[min(92vw,28rem)] -translate-x-1/2 items-center gap-3 rounded-2xl border border-gray-200 bg-base-white/95 px-4 py-3 text-left shadow-xl backdrop-blur transition hover:bg-base-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-900 dark:border-gray-700 dark:focus-visible:ring-gray-100"
      :aria-label="`${next_suggestion_aria}: ${active_suggestion.title}`"
      :class="{
        'swipe-suggestion--left': is_animating && swipe_direction === 'left',
        'swipe-suggestion--right': is_animating && swipe_direction === 'right',
      }"
      :disabled="is_loading || is_animating"
      @click="navigateToSuggestedArticle('right')">
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900">
        <Sparkles class="h-5 w-5" aria-hidden="true" />
      </span>
      <span class="min-w-0">
        <span class="block text-xs font-semibold uppercase tracking-wide text-muted">
          {{ suggestion_kicker }}
        </span>
        <span class="block truncate text-sm font-semibold capitalize text-main">
          {{ active_suggestion.title.toLowerCase() }}
        </span>
      </span>
    </button>
  </div>
</template>

<style scoped>
.swipe-suggestion {
  transform: translateX(-50%);
  transition:
    opacity 260ms ease,
    transform 260ms ease;
}

.swipe-suggestion--left {
  opacity: 0;
  transform: translateX(calc(-50% - 7rem)) rotate(-3deg);
}

.swipe-suggestion--right {
  opacity: 0;
  transform: translateX(calc(-50% + 7rem)) rotate(3deg);
}
</style>
