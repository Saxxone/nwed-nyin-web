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
      d="m13.41 12l4.3-4.29a1 1 0 1 0-1.42-1.42L12 10.59l-4.29-4.3a1 1 0 0 0-1.42 1.42l4.3 4.29l-4.3 4.29a1 1 0 0 0 0 1.42a1 1 0 0 0 1.42 0l4.29-4.3l4.29 4.3a1 1 0 0 0 1.42 0a1 1 0 0 0 0-1.42Z"
    />
  </svg>
</template>
