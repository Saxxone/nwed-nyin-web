<script setup lang="ts">
import Definition from "../../components/dictionary/Definition.vue";

definePageMeta({
  title: "Nwed Nyin - Dictionary",
  layout: "articles",
});

import { Word } from "../../types/dictionary/word";

const words: Word[] = [
  {
    word: "example",
    pronunciation: "/ɪɡˈzæmpəl/", // Optional
    partOfSpeech: ["noun", "verb"],
    definitions: [
      {
        meaning: "A representative instance.",
        examples: ["This is an example of good writing."],
        links: [
          {
            target: "instance",
            text: "See also instance",
          },
        ],
      },
      {
        meaning: "To illustrate by example.",
        examples: ["He exemplified good behavior."],
        links: [],
      },
    ],
    synonyms: ["sample", "illustration"],
    antonyms: ["exception"],
  },
];
</script>

<template>
  <main>
    <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-2xl">Dictionary</h1>
    <Definition :word="word" v-for="word in words" :key="word.word" />
  </main>
</template>
