<script setup lang="ts">
import Definition from "@/components/dictionary/Definition.vue";
import { useDictStore } from "@/store/dictionary";
import DefinitionSkeleton from "~/components/app/DefinitionSkeleton.vue";
import WayPoints from "~/components/dictionary/WayPoints.vue";
import type { Word } from "~/types/word";
import app_routes from "~/utils/routes";

const words = ref<Word[]>([]);
const router = useRouter();
const route = useRoute();
const is_loading = ref(false);
const count = ref(0);
const audio_count = ref(0);
const take = ref(50);
const query = ref("");
const search_results = ref<Word[]>([]);
const dictStore = useDictStore();

async function search() {
  search_results.value = await dictStore.searchWord(query.value);
}

function setCursor(cursor: string) {
  router.push({ query: { cursor } });
}

async function getDictionaryItems() {
  is_loading.value = true;
  try {
    const {
      words: dictionary,
      totalCount: total_count,
      audioCount,
    } = await dictStore.fetchWords({
      cursor: (route.query.cursor as string) ?? words.value[words.value.length - 1]?.id,
      skip: 0,
      take: take.value,
    });
    count.value = total_count;
    audio_count.value = audioCount;
    words.value = [...words.value, ...dictionary];
    is_loading.value = false;
  } catch (error) {
    is_loading.value = false;
  } finally {
    is_loading.value = false;
  }
}

async function jumpToAlphabet(alphabet: string) {
  is_loading.value = true;
  try {
    const { words: dictionary, totalCount: total_count, audioCount } = await dictStore.jumpToAlphabet(alphabet);
    count.value = total_count;
    audio_count.value = audioCount;
    words.value = dictionary;
    is_loading.value = false;
    scrollToTop();
  } catch (error) {
    is_loading.value = false;
  } finally {
    is_loading.value = false;
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

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
  <main>
    <div class="flex items-start justify-between relative">
      <div class="mb-4">
        <h1 class="text-4xl font-extrabold tracking-tight lg:text-2xl">Dictionary</h1>
      </div>
      <NuxtLink :to="app_routes.dictionary.add">Contribute</NuxtLink>
    </div>
    <div class="flex justify-end gap-4 z-20 relative">
      <div class="">
        <form @submit.prevent="search">
          <input class="input" type="search" v-model="query" placeholder="Search..." @keydown.enter="search" />
        </form>
        <div class="absolute w-72 right-0 bg-base-white shadow-lg rounded-lg" v-if="search_results.length > 0">
          <div></div>
          <NuxtLink
            v-for="word in search_results"
            :key="word.id + 'search'"
            :to="`${routes.dictionary.view(encodeURI(word.term), encodeURI(word.id as string))}`"
            class="p-4 block">
            <div>{{ word.term }}</div>
            <div class="w-40 text-sm text-muted">
              <p class="truncate">{{ word.definitions[0].meaning }}</p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>

    <section class="relative" :class="{ 'opacity-25 pointer-events-none': search_results.length > 0 }">
      <div v-if="is_loading && words.length < 1">
        <DefinitionSkeleton v-for="i in 5" :key="'definition-skeleton-' + i" />
      </div>
      <Definition @cursor="setCursor" :word="word" v-for="word in words" :key="word.id" />
      <WayPoints @jump="jumpToAlphabet" />
      <AppInfiniteScroll @refresh="getDictionaryItems" />
      <div v-if="is_loading" class="fixed top-24 z-50 w-full py-10 left-0">
        <div class="w-10 h-10 mx-auto shadow-lg bg-base-light rounded-full p-2">
          <IconsLoadingIcon />
        </div>
      </div>
    </section>
  </main>
</template>
