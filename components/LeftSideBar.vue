<script setup lang="ts">
import { SidebarHeader } from "@/components/ui/sidebar";

const items = [
  {
    title: "Search",
    url: "#",
    icon: "Search",
  },
  {
    title: "Home",
    url: "#",
    icon: "Home",
  },
  {
    title: "Inbox",
    url: "#",
    icon: "Inbox",
  },
  {
    title: "Contact Us",
    url: "#",
    icon: "Calendar",
  },

  {
    title: "Settings",
    url: "#",
    icon: "Settings",
  },
];
</script>

<template>
  <div>
    <SidebarHeader>
      <h1 class="text-xl">
        <NuxtLink to="/">Ñwed Nnyịn</NuxtLink>
      </h1>
    </SidebarHeader>
  </div>
</template>
