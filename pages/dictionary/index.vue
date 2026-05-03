<script setup lang="ts">
import Definition from "@/components/dictionary/Definition.vue";
import { useDictStore } from "@/store/dictionary";
import DefinitionSkeleton from "~/components/app/DefinitionSkeleton.vue";
import WayPoints from "~/components/dictionary/WayPoints.vue";
import type { Word } from "~/types/word";
import app_routes from "~/utils/routes";

type DictionaryListState = {
  words: Word[];
  searchResults: Word[];
  count: number;
  audioCount: number;
  take: number;
  query: string;
  scrollY: number;
};

const dictionary_list_state = useState<DictionaryListState>(
  "dictionary-list-state",
  () => ({
    words: [],
    searchResults: [],
    count: 0,
    audioCount: 0,
    take: 50,
    query: "",
    scrollY: 0,
  }),
);
const words = ref<Word[]>([...dictionary_list_state.value.words]);
const is_loading = ref(false);
const count = ref(dictionary_list_state.value.count);
const audio_count = ref(dictionary_list_state.value.audioCount);
const take = ref(dictionary_list_state.value.take);
const query = ref(dictionary_list_state.value.query);
const search_results = ref<Word[]>([
  ...dictionary_list_state.value.searchResults,
]);
const dictStore = useDictStore();

async function search() {
  search_results.value = await dictStore.searchWord(query.value);
  saveDictionaryListState();
}

function saveDictionaryListState(options?: {
  preserve_scroll?: boolean;
  scroll_y?: number;
}) {
  const scroll_y =
    options?.scroll_y !== undefined
      ? options.scroll_y
      : options?.preserve_scroll === true
        ? dictionary_list_state.value.scrollY
        : window.scrollY;
  dictionary_list_state.value = {
    words: [...words.value],
    searchResults: [...search_results.value],
    count: count.value,
    audioCount: audio_count.value,
    take: take.value,
    query: query.value,
    scrollY: scroll_y,
  };
}

async function restoreDictionaryScroll(scroll_y: number) {
  if (scroll_y <= 0 || words.value.length === 0) return;
  await nextTick();
  requestAnimationFrame(() => {
    window.scrollTo({ top: scroll_y, behavior: "auto" });
    requestAnimationFrame(() => {
      window.scrollTo({ top: scroll_y, behavior: "auto" });
    });
  });
}

const infinite_scroll_enabled = ref(false);

async function getDictionaryItems() {
  if (is_loading.value) return;

  is_loading.value = true;
  try {
    const {
      words: dictionary,
      totalCount: total_count,
      audioCount,
    } = await dictStore.fetchWords({
      cursor: words.value[words.value.length - 1]?.id,
      skip: 0,
      take: take.value,
    });
    count.value = total_count;
    audio_count.value = audioCount;
    const existing_ids = new Set(
      words.value
        .map((w) => w.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    );
    const appended = dictionary.filter((w) => {
      const id = w.id;
      return typeof id === "string" && id.length > 0 && !existing_ids.has(id);
    });
    words.value = [...words.value, ...appended];
    saveDictionaryListState({ preserve_scroll: true });
    is_loading.value = false;
  } catch {
    is_loading.value = false;
  } finally {
    is_loading.value = false;
  }
}

async function jumpToAlphabet(alphabet: string) {
  is_loading.value = true;
  try {
    const {
      words: dictionary,
      totalCount: total_count,
      audioCount,
    } = await dictStore.jumpToAlphabet(alphabet);
    count.value = total_count;
    audio_count.value = audioCount;
    words.value = dictionary;
    search_results.value = [];
    saveDictionaryListState({ scroll_y: 0 });
    is_loading.value = false;
    scrollToTop();
  } catch {
    is_loading.value = false;
  } finally {
    is_loading.value = false;
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

onMounted(async () => {
  if (dictionary_list_state.value.words.length === 0) {
    await getDictionaryItems();
  }
  await restoreDictionaryScroll(dictionary_list_state.value.scrollY);
  await nextTick();
  infinite_scroll_enabled.value = true;
});

onBeforeRouteLeave(() => {
  saveDictionaryListState();
});

definePageMeta({
  title: "Ñwed Nyịn (Nwed Nyin) - Dictionary",
  layout: "generic",
  meta: [
    {
      name: "description",
      content: `The Ñwed Nnyìn (Nwed Nyin) Dictionary. Explore the meaning, pronunciation, etymology, and examples of words in Efik/Ibibio.`,
    },
    {
      property: "og:title",
      content: `Ñwed Nnyìn (Nwed Nyin) Dictionary`,
    },
    {
      property: "og:description",
      content: `The Ñwed Nnyìn (Nwed Nyin) Dictionary. Explore the meaning, pronunciation, etymology, and examples of words in Efik/Ibibio.`,
    },
    {
      property: "og:type",
      content: "article",
    },

    {
      name: "twitter:title",
      content: `Ñwed Nnyìn (Nwed Nyin) Dictionary`,
    },
    {
      name: "twitter:description",
      content: `the Ñwed Nnyìn (Nwed Nyin) Dictionary. Explore the meaning, pronunciation, etymology, and examples of words in Efik/Ibibio.`,
    },
    {
      name: "twitter:card",
      content: "summary",
    },
    {
      name: "keywords",
      content: `dictionary, definition, Ñwed Nnyìn, Nwed Nyin, language, etymology, Efik, Ibibio, Annang, Oron, Eket, Ikot Abasi, Uruan, Mbo, Ibeno, Oron, Eket, Ikot Abasi, Uruan, Mbo`,
    },
  ],
});
</script>

<template>
  <main class="w-full min-w-0">
    <div
      class="relative flex min-w-0 flex-wrap items-start justify-between gap-3"
    >
      <div class="mb-4 min-w-0">
        <h1
          class="min-w-0 break-words text-4xl font-extrabold tracking-tight [overflow-wrap:anywhere] lg:text-2xl"
        >
          Dictionary
        </h1>
      </div>
      <NuxtLink class="shrink-0" :to="app_routes.dictionary.add"
        >Contribute</NuxtLink
      >
    </div>
    <div class="relative z-20 flex min-w-0 justify-end gap-4">
      <div class="min-w-0 max-w-full">
        <form @submit.prevent="search">
          <input
            v-model="query"
            class="input"
            type="search"
            placeholder="Search..."
            @keydown.enter="search"
          />
        </form>
        <div
          v-if="search_results.length > 0"
          class="absolute right-0 top-full z-30 mt-2 max-h-80 w-72 max-w-[min(100%,18rem)] overflow-y-auto rounded-lg bg-base-white shadow-lg dark:border dark:border-gray-700"
        >
          <div></div>
          <NuxtLink
            v-for="word in search_results"
            :key="word.id + 'search'"
            :to="`${routes.dictionary.view(encodeURI(word.term), encodeURI(word.id as string))}`"
            class="block max-w-full min-w-0 border-b border-gray-100 p-4 last:border-b-0 dark:border-gray-800"
          >
            <div class="break-words font-medium [overflow-wrap:anywhere]">
              {{ word.term }}
            </div>
            <div class="mt-1 max-w-full text-sm text-muted">
              <p class="break-words [overflow-wrap:anywhere]">
                {{ word.definitions[0].meaning }}
              </p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>

    <section
      class="relative min-w-0 max-w-full"
      :class="{ 'opacity-25 pointer-events-none': search_results.length > 0 }"
    >
      <div v-if="is_loading && words.length < 1">
        <DefinitionSkeleton v-for="i in 5" :key="'definition-skeleton-' + i" />
      </div>
      <Definition
        v-for="word in words"
        :key="word.id"
        :word="word"
      />
      <WayPoints @jump="jumpToAlphabet" />
      <AppInfiniteScroll
        :enabled="infinite_scroll_enabled"
        @refresh="getDictionaryItems"
      />
      <div v-if="is_loading" class="fixed top-24 z-50 w-full py-10 left-0">
        <div class="w-10 h-10 mx-auto shadow-lg bg-base-light rounded-full p-2">
          <IconsLoadingIcon />
        </div>
      </div>
    </section>
  </main>
</template>
