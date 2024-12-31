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

    <section class="col-span-12 lg:col-span-8">
      <div class="container px-4 mx-auto">
        <AppDarkMode />
        <Menubar>
          <MenubarMenu class="flex justify-between">
            <NuxtLink :to="page.route" v-for="page in pages" :key="page.name" class="px-2">{{ page.name }}</NuxtLink>
          </MenubarMenu>
        </Menubar>
        <main class="my-4">
          <slot></slot>
        </main>
      </div>
    </section>
    <RightSideBar class="col-span-2" />
  </div>
</template>
