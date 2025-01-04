<script setup lang="ts">
interface Props {
  width?: string;
  height?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <svg xmlns="http://www.w3.org/2000/svg" :width="props.width ?? 24" :height="props.height ?? 24" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M8 12a1 1 0 0 0 1 1h6a1 1 0 0 0 0-2H9a1 1 0 0 0-1 1m2 3H7a3 3 0 0 1 0-6h3a1 1 0 0 0 0-2H7a5 5 0 0 0 0 10h3a1 1 0 0 0 0-2m7-8h-3a1 1 0 0 0 0 2h3a3 3 0 0 1 0 6h-3a1 1 0 0 0 0 2h3a5 5 0 0 0 0-10" />
  </svg>
</template>
