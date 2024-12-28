<script lang="ts" setup>
import type { Word } from "~/types/word";

interface Props {
  word: Word;
  more?: boolean;
}

const props = defineProps<Props>();
</script>

<template>
  <section class="border rounded-md p-4 text-sm word-wrap mb-4">
    <h5 class="scroll-m-20 text-2xl flex items-end capitalize font-bold tracking-tight lg:text-xl">
      <span class="block">{{ props.word.term }}</span>
      <span class="text-gray-500 ml-1 text-lg font-medium block" v-if="props.word.alt_spelling">({{ props.word.alt_spelling }})</span>
    </h5>
    <p class="mb-2 font-mono text-xs">{{ props.word.pronunciation }}</p>

    <div>
      <div v-for="(definition, index) in props.word.definitions" class="mb-4">
        <div v-if="props.more || index === 0">
          <p class="text-xs italic text-gray-600">{{ definition.part_of_speech.name }}</p>
          <p>{{ definition.meaning }}</p>
          <div class="my-1">
            <h6 class="text-xs mt-1">Examples:</h6>

            <div>
              <p v-for="example in definition.examples">{{ example.sentence }}</p>
            </div>

            <div>
              <h6 class="text-xs mt-1">Synonyms:</h6>
              <div>
                <span v-for="synonym in definition.synonyms" class="text-xs">{{ synonym.synonym }}, </span>
              </div>
            </div>
          </div>

          <div>
            <NuxtLink v-for="link in props.word.related_to" :to="`${routes.dictionary.view(link.type)}`" class="text-blue-500 text-xs">{{ link }}</NuxtLink>
          </div>
        </div>
      </div>

      <NuxtLink :to="`${routes.dictionary.view(props.word.term)}`" class="text-blue-500 text-xs" v-if="props.word.definitions.length > 0 && !props.more && $props.word.term"
        >see more</NuxtLink
      >
    </div>
  </section>
</template>
