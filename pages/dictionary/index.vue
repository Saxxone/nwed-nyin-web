<script setup lang="ts">
import type { Word } from "~/types/word";
import Definition from "@/components/dictionary/Definition.vue";
import { useDictStore } from "@/store/dictionary";
import app_routes from "~/utils/routes";
import { watchDebounced } from "@vueuse/core";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "@/components/ui/command";

const words = ref<Word[]>([]);
const count = ref(0);
const query = ref("");
const search_results = ref<Word[]>([]);
const dictStore = useDictStore();

async function search() {
  search_results.value = await dictStore.searchWord(query.value);
}

watchDebounced(
  () => query.value,
  () => {
    console.log("query", query.value);
    search();
  },
  { debounce: 500, maxWait: 1000 }
);

onMounted(async () => {
  const { words: dictionary, totalCount } = await dictStore.fetchWords();
  count.value = totalCount;
  words.value = dictionary;
});

definePageMeta({
  title: "Ñwed Nnyịn (Nwed Nyin) - Dictionary",
  layout: "articles",
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
    <div class="flex items-start justify-between">
      <div class="mb-4">
        <h1 class="text-4xl font-extrabold tracking-tight lg:text-2xl">Dictionary</h1>
        <p class="text-sm text-muted" v-show="words.length">{{ count }} words in dictionary</p>
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
            :to="`${routes.dictionary.view(word.alt_spelling?.length ? word.alt_spelling : word.term)}`"
            class="p-4 block">
            <div>{{ word.term }}</div>
            <div class="w-40 text-sm text-muted">
              <p class="truncate">{{ word.definitions[0].meaning }}</p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>

    <section :class="{ 'opacity-25 pointer-events-none': search_results.length > 0 }">
      <Definition :word="word" v-for="word in words" :key="word.id" />
    </section>
  </main>
</template>
