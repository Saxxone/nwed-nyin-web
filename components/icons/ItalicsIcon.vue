<script setup lang="ts">
interface Props {
  width?: string;
  height?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="props.width ?? 24"
    :height="props.height ?? 24"
    viewBox="0 0 24 24"
  >
    <path
      fill="currentColor"
      d="M17 6h-6a1 1 0 0 0 0 2h1.52l-3.2 8H7a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-1.52l3.2-8H17a1 1 0 0 0 0-2"
    />
  </svg>
</template>
