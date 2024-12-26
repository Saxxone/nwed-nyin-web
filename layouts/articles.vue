<script setup lang="ts">
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from "@/components/ui/menubar";
</script>

<template>
  <div class="grid grid-cols-12 gap-4 py-4">
    <LeftSideBar class="col-span-2" />

    <section class="container mx-auto col-span-6">
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Archives</MenubarTrigger>
          <MenubarContent>
            <MenubarItem> New Tab <MenubarShortcut>⌘T</MenubarShortcut> </MenubarItem>
            <MenubarItem>New Window</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Share</MenubarItem>
            <MenubarSeparator />
            <MenubarItem>Print</MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
      <main class="my-4">
        <slot></slot>
      </main>
    </section>
    <RightSideBar class="col-span-2" />
  </div>
</template>
