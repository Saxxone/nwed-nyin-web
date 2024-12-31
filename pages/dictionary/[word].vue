<script setup lang="ts">
import Definition from "@/components/dictionary/Definition.vue";
import type { Word } from "@/types/word";
import { useDictStore } from "@/store/dictionary";

const word = ref<Word>();

const route = useRoute();

const dictStore = useDictStore();

onMounted(async () => {
  word.value = await dictStore.fetchWord(route.params.word as string);
});

definePageMeta({
  title: `${word.value?.term} Nnyịn (Nwed Nyin) - Dictionary"`,
  layout: "articles",

  meta: [
    {
      name: "description",
      content: `Definition of ${word.value?.term} in the Ñwed Nnyìn (Nwed Nyin) Dictionary. Explore the meaning, pronunciation, etymology, and examples of words in Efik/Ibibio..`,
    },
    {
      property: "og:title",
      content: `${word.value?.term} - Ñwed Nnyìn (Nwed Nyin) Dictionary`,
    },
    {
      property: "og:description",
      content: `Definition of ${word.value?.term} in the Ñwed Nnyìn (Nwed Nyin) Dictionary. Explore the meaning, pronunciation, etymology, and examples of words in Efik/Ibibio..`,
    },
    {
      property: "og:type",
      content: "article",
    },

    {
      name: "twitter:title",
      content: `${word.value?.term} - Ñwed Nnyìn (Nwed Nyin) Dictionary`,
    },
    {
      name: "twitter:description",
      content: `Definition of ${word.value?.term} in the Ñwed Nnyìn (Nwed Nyin) Dictionary. Explore the meaning, pronunciation, etymology, and examples of words in Efik/Ibibio.`,
    },
    {
      name: "twitter:card",
      content: "summary",
    },
    {
      name: "keywords",
      content: `${word.value?.term}, dictionary, definition, Ñwed Nnyìn, Nwed Nyin, language, etymology, Efik, Ibibio, Annang, Oron, Eket, Ikot Abasi, Uruan, Mbo, Ibeno, Oron, Eket, Ikot Abasi, Uruan, Mbo`,
    },
  ],
});
</script>

<template>
  <main>
    <Definition v-if="word" :word="word" :more="true" />
  </main>
</template>
