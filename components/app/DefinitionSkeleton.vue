<script setup lang="ts">
import { Skeleton } from "@/components/ui/skeleton";
</script>

<template>
  <div
    class="card mb-4 block max-w-full min-w-0 rounded-lg border text-sm word-wrap break-words [overflow-wrap:anywhere]"
  >
    <Skeleton class="mb-2 h-4 max-w-full rounded-full" />
    <Skeleton class="mb-3 h-3 max-w-[73%] rounded-full" />

    <Skeleton class="h-2 max-w-[33%] rounded-full" />
  </div>
</template>
