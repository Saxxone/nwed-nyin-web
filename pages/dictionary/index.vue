<script setup lang="ts">
import type { Word } from "~/types/word";
import Definition from "@/components/dictionary/Definition.vue";
import { useDictStore } from "@/store/dictionary";

definePageMeta({
  title: "Nwed Nyin - Dictionary",
  layout: "articles",
});

const words = ref<Word[]>([]);
const query = ref("");
const dictStore = useDictStore();

onMounted(async () => {
  words.value = await dictStore.fetchWords();
});
</script>

<template>
  <main>
    <h1 class="text-4xl mb-4 font-extrabold tracking-tight lg:text-2xl">Dictionary</h1>
    <div class="flex justify-end gap-4">
      <div class="">
        <Input type="search" v-model="query" placeholder="Search..." class="mb-4" />
      </div>
    </div>

    <Definition :word="word" v-for="word in words" :key="word.term" />
  </main>
</template>
