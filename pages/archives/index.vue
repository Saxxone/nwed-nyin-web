<script setup lang="ts">
import app_routes from "~/utils/routes";

definePageMeta({
  title: "Ñwed Nnyịn (Nwed Nyin) - Archives",
  layout: "articles",
});

const query = ref("");
</script>

<template>
  <main>
    <div class="flex items-start justify-between">
      <div class="mb-4">
        <h1 class="text-4xl font-extrabold tracking-tight lg:text-2xl">Archive</h1>
      </div>
      <NuxtLink :to="app_routes.archives.add">Contribute</NuxtLink>
    </div>
  </main>
</template>
