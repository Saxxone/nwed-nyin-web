<script setup lang="ts">
import Definition from "@/components/dictionary/Definition.vue";
import type { Word } from "@/types/word";
import { useDictStore } from "@/store/dictionary";

definePageMeta({
  title: "Ñwed Nnyi&#x0323;n (Nwed Nyin) - Dictionary",
  layout: "articles",
});

const word = ref<Word>();

const route = useRoute();

const dictStore = useDictStore();

onMounted(async () => {
  word.value = await dictStore.fetchWord(route.params.word as string);
  console.log(word.value);
});
</script>

<template>
  <main>
    <Definition v-if="word" :word="word" :more="true" />
  </main>
</template>
