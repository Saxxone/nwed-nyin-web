<script setup lang="ts">
import { Menubar, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";
import LeftSideBar from "@/components/LeftSideBar.vue";
import RightSideBar from "@/components/RightSideBar.vue";
import routes from "../utils/routes";
</script>

<template>
  <div class="grid grid-cols-12 gap-4 py-4">
    <LeftSideBar class="col-span-2 hidden lg:block" />

    <section class="container mx-auto col-span-12 lg:col-span-8">
      <Menubar>
        <MenubarMenu class="flex justify-between">
          <MenubarTrigger>
            <NuxtLink :to="routes.archives.list">Archives</NuxtLink>
          </MenubarTrigger>

          <NuxtLink :to="routes.dictionary.list">Dictionary</NuxtLink>
        </MenubarMenu>
      </Menubar>
      <main class="my-4">
        <slot></slot>
      </main>
    </section>
    <RightSideBar class="col-span-2" />
  </div>
</template>
