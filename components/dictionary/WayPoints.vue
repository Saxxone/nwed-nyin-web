<script setup lang="ts">
const alphabets = "ABDEFGIKMNOSTUWY".split("");

const emit = defineEmits(["jump"]);
</script>

<template>
  <div  class="fixed top-0 right-0 z-50 w-6 py-4 h-screen flex lg:mr-4 flex-col hover:opacity-95 items-center justify-between opacity-45">
    <div v-for="alphabet in alphabets" :key="alphabet" @click="emit('jump', alphabet)" class="text-xs hover:shadow-md dark:hover:bg-gray-500 hover:bg-gray-300 cursor-pointer rounded-full h-6 w-6 flex items-center justify-center text-center">{{ alphabet }}</div>
  </div>
</template>