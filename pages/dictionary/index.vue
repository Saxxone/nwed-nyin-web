<script setup lang="ts">
import type { Word } from "~/types/word";
import Definition from "@/components/dictionary/Definition.vue";
import { useDictStore } from "@/store/dictionary";
import app_routes from "~/utils/routes";

definePageMeta({
  title: "Ñwed Nnyi&#x0323;n (Nwed Nyin) - Dictionary",
  layout: "articles",
});

const words = ref<Word[]>([]);
const count = ref(0);
const query = ref("");
const dictStore = useDictStore();

onMounted(async () => {
  const { words: dictionary, totalCount } = await dictStore.fetchWords();
  count.value = totalCount;
  words.value = dictionary;
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
