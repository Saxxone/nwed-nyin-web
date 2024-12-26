<script setup lang="ts">
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader } from "@/components/ui/sidebar";

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
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <main>
            <SidebarTrigger />
          </main>
          <SidebarHeader>Ñwed Nnyi&#x0323;n</SidebarHeader>
          <SidebarGroup>
            <SidebarGroupLabel>Links</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem :key="item.title" v-for="item in items">
                  <SidebarMenuButton asChild>
                    <a :href="item.url">
                      <item.icon />
                      <span>{{ item.title }}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  </div>
</template>
