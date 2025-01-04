<script setup lang="ts">
interface Props {
  width?: string;
  height?: string;
}

const props = defineProps<Props>();
</script>

<template>
  <svg xmlns="http://www.w3.org/2000/svg" :width="props.width ?? 24" :height="props.height ?? 24" viewBox="0 0 24 24">
    <path fill="currentColor" d="M12 15.5a5 5 0 0 0 5-5v-5a1 1 0 0 0-2 0v5a3 3 0 0 1-6 0v-5a1 1 0 0 0-2 0v5a5 5 0 0 0 5 5m5 2H7a1 1 0 0 0 0 2h10a1 1 0 0 0 0-2" />
  </svg>
</template>
