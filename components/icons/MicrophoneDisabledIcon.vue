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
      d="M10.5 3.73a2 2 0 0 1 2.95-.14A2 2 0 0 1 14 5v3.41a1 1 0 0 0 2 0V5a4 4 0 0 0-7-2.53a1 1 0 1 0 1.5 1.26m8.22 9.54h.2a1 1 0 0 0 1-.81A8 8 0 0 0 20 11a1 1 0 0 0-2 0a5.5 5.5 0 0 1-.11 1.1a1 1 0 0 0 .83 1.17m3 6.06l-18-18a1 1 0 0 0-1.42 0a1 1 0 0 0 0 1.41L8 8.48V11a4 4 0 0 0 6 3.46l1.46 1.46A6 6 0 0 1 6 11a1 1 0 0 0-2 0a8 8 0 0 0 7 7.93V21H9a1 1 0 0 0 0 2h6a1 1 0 0 0 0-2h-2v-2.07a7.87 7.87 0 0 0 3.85-1.59l3.4 3.4a1 1 0 0 0 1.42-1.41ZM12 13a2 2 0 0 1-2-2v-.52l2.45 2.46A1.7 1.7 0 0 1 12 13"
    />
  </svg>
</template>
