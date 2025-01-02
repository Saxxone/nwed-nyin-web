<script setup lang="ts">
import Definition from "@/components/dictionary/Definition.vue";
import type { Word } from "@/types/word";
import { useDictStore } from "@/store/dictionary";

const word = ref<Word>();

const route = useRoute();

const dictStore = useDictStore();

function gotoEdit() {
  navigateTo(`/dictionary/add/?action=edit&word=${encodeURI(word.value?.alt_spelling?.length ? word.value?.alt_spelling : word.value?.term || "")}`);
}

onMounted(async () => {
  word.value = await dictStore.fetchWord(decodeURI(route.params.word as string) as string);
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
    <div class="flex items-center justify-end">
      <div class="p-2 cursor-pointer" @click="gotoEdit">
        <IconsEditIcon width="16" height="16" />
      </div>
    </div>
    <Definition v-if="word" :word="word" :more="true" />
  </main>
</template>
