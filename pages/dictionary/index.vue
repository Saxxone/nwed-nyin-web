<script setup lang="ts">
import type { Word } from "~/types/word";
import Definition from "@/components/dictionary/Definition.vue";
import { useDictStore } from "@/store/dictionary";
import app_routes from "~/utils/routes";

const words = ref<Word[]>([]);
const count = ref(0);
const query = ref("");
const dictStore = useDictStore();

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
      <h1 class="text-4xl mb-4 font-extrabold tracking-tight lg:text-2xl">Dictionary</h1>

      <NuxtLink :to="app_routes.dictionary.add">Contribute</NuxtLink>
    </div>
    <div class="flex justify-end gap-4">
      <div class="">
        <input class="input" type="search" v-model="query" placeholder="Search..." />
      </div>
    </div>

    <Definition :word="word" v-for="word in words" :key="word.id" />
  </main>
</template>
