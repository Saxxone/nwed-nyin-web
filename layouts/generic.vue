<script setup lang="ts">
import LeftSideBar from "@/components/LeftSideBar.vue";
import RightSideBar from "@/components/RightSideBar.vue";
</script>

<template>
  <div class="grid grid-cols-12 py-4">
    <LeftSideBar class="col-span-2 hidden lg:block" />

    <section class="col-span-12 lg:col-span-8">
      <div class="container px-4 mx-auto">
        <AppTopBar />
        <main class="my-4">
          <slot></slot>
        </main>
      </div>
    </section>
    <RightSideBar class="col-span-2" />
  </div>
</template>
