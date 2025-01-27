<script lang="ts" setup>
import { Menubar, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";
import routes from "@/utils/routes";

const pages = [
  {
    name: "Articles",
    route: routes.articles.list,
  },
  {
    name: "Dictionary",
    route: routes.dictionary.list,
  },
  
];
</script>

<template>
  <div>
    <AppDarkMode />
        <Menubar>
          <MenubarMenu class="flex justify-between">
            <NuxtLink :to="page.route" v-for="page in pages" :key="page.name" class="px-2">{{ page.name }}</NuxtLink>
          </MenubarMenu>
        </Menubar>
    </div>
</template>


