<script setup lang="ts">
import Definition from "../../components/dictionary/Definition.vue";
import { words } from "../../assets/data";

definePageMeta({
  title: "Nwed Nyin - Dictionary",
  layout: "articles",
});
</script>

<template>
  <main>
    <h1 class="text-4xl mb-4 font-extrabold tracking-tight lg:text-2xl">Dictionary</h1>
    <Definition :word="word" v-for="word in words" :key="word.word" :more="true" />
  </main>
</template>
