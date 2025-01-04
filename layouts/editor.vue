<script setup lang="ts">
import { Menubar, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";

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
  <div class="container p-4 mx-auto">
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
</template>
