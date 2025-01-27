<script setup lang="ts">
import LeftSideBar from "@/components/LeftSideBar.vue";
import RightSideBar from "@/components/RightSideBar.vue";
</script>

<template>
  <div class="grid grid-cols-12 gap-4 py-4">
    <LeftSideBar class="col-span-2" />

    <section class="container mx-auto col-span-6">
      <AppTopBar />
      <main class="my-4">
        <slot></slot>
      </main>
    </section>
    <RightSideBar class="col-span-2" />
  </div>
</template>
