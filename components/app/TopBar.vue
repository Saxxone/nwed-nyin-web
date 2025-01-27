<script lang="ts" setup>
import { Menubar, MenubarMenu } from "@/components/ui/menubar";
import routes from "@/utils/routes";
import { useAuthStore } from "~/store/auth";

let authStore;

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

onMounted(() => {
  authStore = useAuthStore();
});
</script>

<template>
  <div>
    <div>
      <AppDarkMode />
      <ClientOnly fallbackTag="span">
        <div v-if="authStore.user?.img">
          <img :src="'api.nwednyin.org/public/'+authStore.user.img" alt="" />
        </div>
      </ClientOnly>
    </div>
    <Menubar>
      <MenubarMenu class="flex justify-between">
        <NuxtLink :to="page.route" v-for="page in pages" :key="page.name" class="px-2">{{ page.name }}</NuxtLink>
      </MenubarMenu>
    </Menubar>
  </div>
</template>
