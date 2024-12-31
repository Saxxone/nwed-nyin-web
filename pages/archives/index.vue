<script setup lang="ts">
definePageMeta({
  title: "Ñwed Nnyi&#x0323;n (Nwed Nyin) - Archives",
  layout: "articles",
});

const query = ref("");
</script>

<template>
  <main>
    <h1 class="text-4xl mb-4 font-extrabold tracking-tight lg:text-2xl">Archives</h1>
    <div class="flex justify-end gap-4">
      <div class="">
        <input class="input" type="search" v-model="query" placeholder="Search..." />
      </div>
    </div>
  </main>
</template>
