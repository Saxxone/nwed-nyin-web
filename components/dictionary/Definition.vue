<script lang="ts" setup>
import type { Word } from "../../types/dictionary/word";

interface Props {
  word: Word;
}

const props = defineProps<Props>();
</script>

<template>
  <section class="border rounded-md p-4 text-sm word-wrap">
    <h5 class="scroll-m-20 text-2xl flex items-end capitalize font-bold tracking-tight lg:text-xl">
      <span class="block">{{ props.word.word }}</span>
      <span class="text-gray-300 ml-3 font-medium block">({{ props.word.alt_spelling }})</span>
    </h5>
    <p>{{ props.word.pronunciation }}</p>

    <div>
      <div v-for="definition in props.word.definitions" class="mb-4">
        <p class="text-xs italic text-gray-600">{{ definition.part_of_speech }}</p>
        <p>{{ definition.meaning }}</p>
        <div class="my-1">
          <h6 class="text-xs">Examples:</h6>

          <div>
            <p v-for="example in definition.examples">{{ example }}</p>
          </div>
        </div>
        <div>
          <h6 class="text-xs">Synonyms:</h6>

          <div>
            <span v-for="synonym in props.word.synonyms" class="text-xs">{{ synonym }}, </span>
          </div>
        </div>

        <div>
          <NuxtLink v-for="link in definition.links" :to="`${routes.dictionary.view(link.target)}`" class="text-blue-500 text-xs">{{ link.text }}</NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
