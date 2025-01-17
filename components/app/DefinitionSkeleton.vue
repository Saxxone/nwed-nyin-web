<script setup lang="ts">
import { Skeleton } from '@/components/ui/skeleton'
</script>

<template>
  <div class="border block rounded-lg card text-sm word-wrap mb-4 break-words">
    <Skeleton class="w-[300px] h-4 rounded-full mb-2" />
    <Skeleton class="w-[220px] h-3 rounded-full mb-3" />

    <Skeleton class="w-[100px] h-2 rounded-full" />
  </div>
</template>
