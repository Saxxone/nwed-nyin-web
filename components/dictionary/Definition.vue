<script lang="ts" setup>
import { Word } from "../../types/dictionary/word";

interface Props {
  word: Word;
}

const props = defineProps<Props>();
</script>

<template>
  <section class="border rounded-md p-4 my-4 word-wrap">
    <h5 class="scroll-m-20 text-2xl capitalize font-extrabold tracking-tight lg:text-xl">{{ props.word.word }}</h5>
    <p>{{ props.word.pronunciation }}</p>
    <div>
      <div v-for="definition in props.word.definitions" class="my-4">
        <p>{{ definition.meaning }}</p>
        <div>
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
          <h6 class="text-xs">Antonyms:</h6>

          <div>
            <span v-for="antonym in props.word.antonyms" class="text-xs">{{ antonym }}, </span>
          </div>
        </div>
        <div>
          <NuxtLink v-for="link in definition.links" :to="link.target" class="text-green-500">{{ link.text }}</NuxtLink>
        </div>
      </div>
    </div>
  </section>
</template>
