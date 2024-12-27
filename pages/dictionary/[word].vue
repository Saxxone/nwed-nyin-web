<script setup lang="ts">
import Definition from "@/components/dictionary/Definition.vue";
import type { Word } from "@/types/word";
import { useDictStore } from "@/store/dictionary";

definePageMeta({
  title: "Nwed Nyin - Dictionary",
  layout: "articles",
});

const word = ref<Word>();

const route = useRoute();

const dictStore = useDictStore();
onBeforeMount(async () => {
  word.value = await dictStore.fetchWord(route.params.word as string);
});
</script>

<template>
  <main>
    <Definition v-if="word" :word="word" :more="true" />
  </main>
</template>
