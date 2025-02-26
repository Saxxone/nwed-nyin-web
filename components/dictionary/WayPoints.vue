<script setup lang="ts">
const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const emit = defineEmits(["jump"]);
</script>

<template>
  <div class="absolute top-0 right-0 z-50 w-6 h-screen  flex flex-col opacity-0 hover:opacity-95 items-center transition-opacity duration-300">
    <div v-for="alphabet in alphabets" :key="alphabet" @click="emit('jump', alphabet)" class="text-xs hover:shadow-md dark:hover:bg-gray-500 hover:bg-gray-300 cursor-pointer rounded-full h-6 w-6 flex items-center justify-center text-center">{{ alphabet }}</div>
  </div>
</template>