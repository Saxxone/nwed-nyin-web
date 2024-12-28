<script setup lang="ts">
import { Menubar, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";
import LeftSideBar from "@/components/LeftSideBar.vue";
import RightSideBar from "@/components/RightSideBar.vue";
import routes from "../utils/routes";

const pages = [
  {
    name: "Dictionary",
    route: routes.dictionary.list,
  },
  {
    name: "Archives",
    route: routes.archives.list,
  },
];
</script>

<template>
  <div class="grid grid-cols-12 py-4">
    <LeftSideBar class="col-span-2 hidden lg:block" />

    <section class="container mx-auto col-span-12 lg:col-span-8">
      <Menubar>
        <MenubarMenu class="flex justify-between">
          <NuxtLink :to="page.route" v-for="page in pages" :key="page.name" class="px-2">{{ page.name }}</NuxtLink>
        </MenubarMenu>
      </Menubar>
      <main class="my-4">
        <slot></slot>
      </main>
    </section>
    <RightSideBar class="col-span-2" />
  </div>
</template>
