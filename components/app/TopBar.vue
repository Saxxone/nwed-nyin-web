<script lang="ts" setup>
import { Menubar, MenubarMenu } from "@/components/ui/menubar";
import routes from "@/utils/routes";
import { useAuthStore } from "~/store/auth";

const authStore = ref<ReturnType<typeof useAuthStore>>();

onMounted(() => {
  authStore.value = useAuthStore();
});

const pages: {name: string; route: string; external?: boolean}[] = [
  {
    name: "Articles",
    route: routes.articles.list,
  },
  {
    name: "Dictionary",
    route: routes.dictionary.list,
  },
  {
    name: "Donate",
    route: "https://paystack.shop/pay/breb6r9a8y",
    external: true,
  },
];



</script>

<template>
  <div>
    <div>
      <AppDarkMode />
      <ClientOnly fallbackTag="span">
        <div v-if="authStore?.user?.img">
          <img :src="'api.nwednyin.org/public/'+authStore?.user.img" alt="" />
        </div>
      </ClientOnly>
    </div>
    <Menubar>
      <MenubarMenu class="flex justify-between">
        <div v-for="page in pages" :key="page.name">
           <a v-if="page.external" :href="page.route" target="_blank" class="px-2">Donate</a>
          <NuxtLink v-else :to="page.route"  class="px-2">{{ page.name }}</NuxtLink>
        </div>
      </MenubarMenu>
    </Menubar>
  </div>
</template>
