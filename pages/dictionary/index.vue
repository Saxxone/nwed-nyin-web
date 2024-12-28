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
const query = ref("");
const dictStore = useDictStore();

onMounted(async () => {
  words.value = await dictStore.fetchWords();
  console.log(words.value);
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
        <Input type="search" v-model="query" placeholder="Search..." class="mb-4" />
      </div>
    </div>

    <Definition :word="word" v-for="word in words" :key="word.id" />
  </main>
</template>
