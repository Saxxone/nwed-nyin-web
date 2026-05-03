<script setup lang="ts">
import type { DiffLinePart } from "~/utils/article-revision-diff";

withDefaults(
  defineProps<{
    parts: DiffLinePart[];
    headline?: string;
  }>(),
  { headline: "" },
);

function blockClass(kind: DiffLinePart["type"]) {
  switch (kind) {
    case "remove":
      return "border-red-700/55 bg-red-500/15 text-foreground dark:border-red-600/55 dark:bg-red-500/10";
    case "add":
      return "border-green-700/55 bg-green-500/15 text-foreground dark:border-green-600/55 dark:bg-green-500/10";
    default:
      return "border-transparent bg-muted/25 text-foreground";
  }
}
</script>

<template>
  <div
    class="flex max-h-none min-h-[40vh] max-w-none flex-col gap-0.5 overflow-auto rounded-md border font-mono text-xs leading-snug whitespace-pre-wrap sm:min-h-[50vh] sm:text-sm"
    role="region"
    tabindex="0"
    :aria-label="headline || 'Markdown line diff'"
  >
    <p
      v-if="headline"
      class="text-muted-foreground bg-background sticky top-0 z-10 border-b px-2 py-1.5 text-xs font-sans whitespace-normal break-words"
    >
      {{ headline }}
    </p>
    <div class="flex min-h-0 flex-col px-2 py-2">
      <pre
        v-for="(part, i) in parts"
        :key="`${i}-${part.type}-${part.text.length}`"
        class="max-w-none border-l-2 px-2 py-0.5 whitespace-pre-wrap break-words outline-none md:py-px"
        :class="blockClass(part.type)"
      >{{ part.text }}</pre>
    </div>
  </div>
</template>
