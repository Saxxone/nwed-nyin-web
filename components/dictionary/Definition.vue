<script lang="ts" setup>
import type { Word } from "~/types/word";

interface Props {
  word: Word;
  more?: boolean;
}

const props = defineProps<Props>();
</script>

<template>
  <NuxtLink
    :to="`${routes.dictionary.view(props.word.alt_spelling?.length ? props.word.alt_spelling : props.word.term)}`"
    class="border block rounded-md card text-sm word-wrap mb-4 select-text break-words ove">
    <h5 class="scroll-m-20 text-2xl items-end capitalize font-bold tracking-tight lg:text-xl mb-1">
      <div>{{ props.word.term }}</div>

      <div class="text-gray-500 text-sm font-medium block" v-if="props.word.alt_spelling">({{ props.word.alt_spelling }})</div>
    </h5>
    <p class="mb-2 font-serif text-xs" v-if="props.word.pronunciation">
      {{ `${props.word.pronunciation?.startsWith("/") ? "" : "/"}${props.word.pronunciation}${props.word.pronunciation?.endsWith("/") ? "" : "/"}` }}
    </p>

    <div>
      <div v-for="(definition, index) in props.word.definitions" class="mb-4">
        <div v-if="props.more || index === 0">
          <p class="text-xs italic text-muted">{{ index + 1 }}. {{ definition.part_of_speech.name }}</p>
          <p>{{ definition.meaning }}</p>
          <div class="my-1" v-if="definition.examples.length > 0">
            <h6 class="text-xs mt-2 text-muted">Examples:</h6>

            <div>
              <p v-for="example in definition.examples" class="text-xs">{{ example.sentence }}</p>
            </div>

            <div v-if="definition.synonyms.length > 0">
              <h6 class="text-xs mt-2 text-muted">Synonyms:</h6>
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

      <NuxtLink
        :to="`${routes.dictionary.view(props.word.alt_spelling?.length ? props.word.alt_spelling : props.word.term)}`"
        class="text-blue-500 text-xs"
        v-if="props.word.definitions.length > 0 && !props.more && $props.word.term && $props.word.related_to"
        >see more</NuxtLink
      >
    </div>
  </NuxtLink>
</template>
