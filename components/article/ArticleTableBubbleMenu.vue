<script setup lang="ts">
import { BubbleMenu } from "@tiptap/vue-3/menus";
import type { Editor } from "@tiptap/core";
import {
  ArrowDownToLine,
  ArrowLeftToLine,
  ArrowRightToLine,
  ArrowUpFromLine,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Combine,
  Eraser,
  Paintbrush,
  Rows2,
  SplitSquareHorizontal,
  TableProperties,
  Trash2,
  Unlink2,
} from "lucide-vue-next";
import { PluginKey } from "@tiptap/pm/state";
import { computed, onUnmounted, ref, watch } from "vue";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const props = defineProps<{
  editor: Editor | undefined;
}>();

const tableMenuPluginKey = new PluginKey("articleTableBubbleMenu");

/** Bumps when the editor updates so `can()` / cell attrs react to caret moves inside the table. */
const editor_tick = ref(0);

let detachEditorListeners: (() => void) | undefined;

watch(
  () => props.editor,
  (ed) => {
    detachEditorListeners?.();
    detachEditorListeners = undefined;
    if (!ed) return;
    const bump = () => {
      editor_tick.value++;
    };
    ed.on("transaction", bump);
    ed.on("selectionUpdate", bump);
    detachEditorListeners = () => {
      ed.off("transaction", bump);
      ed.off("selectionUpdate", bump);
    };
    bump();
  },
  { immediate: true },
);

onUnmounted(() => {
  detachEditorListeners?.();
});

const cellAlign = computed(() => {
  void editor_tick.value;
  const ed = props.editor;
  if (!ed) return null;
  const a =
    ed.getAttributes("tableCell").align ??
    ed.getAttributes("tableHeader").align;
  return (typeof a === "string" ? a : null) as "left" | "center" | "right" | null;
});

const cellBackground = computed(() => {
  void editor_tick.value;
  const ed = props.editor;
  if (!ed) return null;
  const bg =
    ed.getAttributes("tableCell").backgroundColor ??
    ed.getAttributes("tableHeader").backgroundColor;
  return typeof bg === "string" && bg.trim() ? bg.trim() : null;
});

function chain() {
  return props.editor?.chain().focus();
}

const canDeleteRow = computed(() => {
  void editor_tick.value;
  return props.editor?.can().deleteRow() ?? false;
});
const canDeleteColumn = computed(() => {
  void editor_tick.value;
  return props.editor?.can().deleteColumn() ?? false;
});
const canMergeCells = computed(() => {
  void editor_tick.value;
  return props.editor?.can().mergeCells() ?? false;
});
const canSplitCell = computed(() => {
  void editor_tick.value;
  return props.editor?.can().splitCell() ?? false;
});
const canMergeOrSplit = computed(() => {
  void editor_tick.value;
  return props.editor?.can().mergeOrSplit() ?? false;
});
const canGoNextCell = computed(() => {
  void editor_tick.value;
  return props.editor?.can().goToNextCell() ?? false;
});
const canGoPrevCell = computed(() => {
  void editor_tick.value;
  return props.editor?.can().goToPreviousCell() ?? false;
});

const swatches = [
  "#fef08a",
  "#bbf7d0",
  "#bae6fd",
  "#fecaca",
  "#e9d5ff",
  "#e5e5e5",
  "#ffffff",
  "#1f2937",
] as const;

function shouldShowBubble({ editor }: { editor: Editor }) {
  return editor.isActive("table");
}

function preservePointerdown(evt: PointerEvent) {
  evt.preventDefault();
}
</script>

<template>
  <BubbleMenu
    v-if="editor"
    :editor="editor"
    :plugin-key="tableMenuPluginKey"
    :update-delay="80"
    :should-show="shouldShowBubble"
    :options="{
      placement: 'top',
      offset: 8,
      flip: true,
    }"
    class="z-50 max-w-[calc(100vw-2rem)] rounded-lg border border-gray-200 bg-base-white p-1.5 shadow-lg dark:border-gray-700 dark:bg-zinc-900"
    @mousedown.prevent
  >
    <TooltipProvider :delay-duration="200">
      <div class="flex flex-wrap items-center gap-0.5">
    <!-- Rows & columns -->
    <div class="flex flex-wrap items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="rounded p-1.5 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-800"
            aria-label="Add row above"
            @pointerdown="preservePointerdown"
            @click="chain()?.addRowBefore().run()"
          >
            <ArrowUpFromLine class="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" class="text-xs">Add row above</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="rounded p-1.5 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-800"
            aria-label="Add row below"
            @pointerdown="preservePointerdown"
            @click="chain()?.addRowAfter().run()"
          >
            <ArrowDownToLine class="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" class="text-xs">Add row below</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="rounded p-1.5 text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-200 dark:hover:bg-zinc-800"
            :disabled="!canDeleteRow"
            aria-label="Delete row"
            @pointerdown="preservePointerdown"
            @click="chain()?.deleteRow().run()"
          >
            <Rows2 class="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" class="text-xs">Delete row</TooltipContent>
      </Tooltip>
    </div>

    <div class="mx-0.5 h-6 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />

    <div class="flex flex-wrap items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="rounded p-1.5 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-800"
            aria-label="Add column before"
            @pointerdown="preservePointerdown"
            @click="chain()?.addColumnBefore().run()"
          >
            <ArrowLeftToLine class="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" class="text-xs">Add column before</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="rounded p-1.5 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-800"
            aria-label="Add column after"
            @pointerdown="preservePointerdown"
            @click="chain()?.addColumnAfter().run()"
          >
            <ArrowRightToLine class="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" class="text-xs">Add column after</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="rounded p-1.5 text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-200 dark:hover:bg-zinc-800"
            :disabled="!canDeleteColumn"
            aria-label="Delete column"
            @pointerdown="preservePointerdown"
            @click="chain()?.deleteColumn().run()"
          >
            <Columns2 class="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" class="text-xs">Delete column</TooltipContent>
      </Tooltip>
    </div>

    <div class="mx-0.5 h-6 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />

    <div class="flex flex-wrap items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="rounded p-1.5 text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-200 dark:hover:bg-zinc-800"
            :disabled="!canGoPrevCell"
            aria-label="Previous cell"
            @pointerdown="preservePointerdown"
            @click="chain()?.goToPreviousCell().run()"
          >
            <ChevronLeft class="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" class="text-xs">Previous cell (Shift+Tab)</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="rounded p-1.5 text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-200 dark:hover:bg-zinc-800"
            :disabled="!canGoNextCell"
            aria-label="Next cell"
            @pointerdown="preservePointerdown"
            @click="chain()?.goToNextCell().run()"
          >
            <ChevronRight class="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" class="text-xs">Next cell (Tab)</TooltipContent>
      </Tooltip>
    </div>

    <div class="mx-0.5 h-6 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />

    <div class="flex flex-wrap items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="rounded p-1.5 text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-200 dark:hover:bg-zinc-800"
            :disabled="!canMergeCells"
            aria-label="Merge cells"
            @pointerdown="preservePointerdown"
            @click="chain()?.mergeCells().run()"
          >
            <Combine class="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" class="text-xs">Merge cells</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="rounded p-1.5 text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-200 dark:hover:bg-zinc-800"
            :disabled="!canSplitCell"
            aria-label="Split cell"
            @pointerdown="preservePointerdown"
            @click="chain()?.splitCell().run()"
          >
            <SplitSquareHorizontal class="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" class="text-xs">Split cell</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="rounded p-1.5 text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-200 dark:hover:bg-zinc-800"
            :disabled="!canMergeOrSplit"
            aria-label="Merge or split"
            @pointerdown="preservePointerdown"
            @click="chain()?.mergeOrSplit().run()"
          >
            <Unlink2 class="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" class="text-xs">Merge or split</TooltipContent>
      </Tooltip>
    </div>

    <div class="mx-0.5 h-6 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />

    <div class="flex flex-wrap items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="rounded p-1.5 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-800"
            aria-label="Toggle header row"
            @pointerdown="preservePointerdown"
            @click="chain()?.toggleHeaderRow().run()"
          >
            <TableProperties class="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" class="text-xs">Toggle header row</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="rounded p-1.5 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-800"
            aria-label="Toggle header column"
            @pointerdown="preservePointerdown"
            @click="chain()?.toggleHeaderColumn().run()"
          >
            <span class="text-xs font-bold">H↓</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" class="text-xs">Toggle header column</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="rounded p-1.5 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-800"
            aria-label="Toggle header cell"
            @pointerdown="preservePointerdown"
            @click="chain()?.toggleHeaderCell().run()"
          >
            <span class="text-xs font-bold">H•</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" class="text-xs">Toggle this header cell</TooltipContent>
      </Tooltip>
    </div>

    <div class="mx-0.5 h-6 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />

    <!-- Text align -->
    <div class="flex flex-wrap items-center gap-0.5">
      <Tooltip v-for="al in (['left', 'center', 'right'] as const)" :key="al">
        <TooltipTrigger as-child>
          <button
            type="button"
            class="rounded px-2 py-1.5 text-xs font-medium text-gray-700 capitalize hover:bg-gray-100 data-[active=true]:bg-teal-100 data-[active=true]:text-teal-900 dark:text-gray-200 dark:hover:bg-zinc-800 dark:data-[active=true]:bg-teal-900/40 dark:data-[active=true]:text-teal-100"
            :data-active="cellAlign === al"
            :aria-label="`Align ${al}`"
            :aria-pressed="cellAlign === al"
            @pointerdown="preservePointerdown"
            @click="
              chain()?.setCellAttribute('align', al === cellAlign ? null : al).run()
            "
          >
            {{ al === "left" ? "L" : al === "center" ? "C" : "R" }}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" class="text-xs">Align {{ al }}</TooltipContent>
      </Tooltip>
    </div>

    <div class="mx-0.5 h-6 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />

    <!-- Background -->
    <div
      class="flex flex-wrap items-center gap-1"
      title="Cell background"
    >
      <Paintbrush
        class="ml-0.5 h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400"
        aria-hidden="true"
      />
      <button
        v-for="hex in swatches"
        :key="hex"
        type="button"
        class="h-5 w-5 shrink-0 rounded border border-gray-300 dark:border-gray-600"
        :class="cellBackground === hex ? 'ring-2 ring-teal-500 ring-offset-1' : ''"
        :style="{ backgroundColor: hex }"
        :aria-label="`Background ${hex}`"
        @pointerdown="preservePointerdown"
        @click="chain()?.setCellAttribute('backgroundColor', hex).run()"
      />
      <label
        class="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded border border-gray-200 bg-base-light dark:border-gray-600"
        title="Custom color"
      >
        <input
          class="h-5 w-5 cursor-pointer opacity-80"
          type="color"
          :value="cellBackground?.startsWith('#') ? cellBackground : '#fff59d'"
          @pointerdown="preservePointerdown"
          @input="
            chain()?.setCellAttribute(
              'backgroundColor',
              ($event.target as HTMLInputElement).value,
            ).run()
          "
        />
        <span class="sr-only">Pick custom cell color</span>
      </label>
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="rounded p-1.5 text-gray-700 hover:bg-gray-100 disabled:opacity-40 dark:text-gray-200 dark:hover:bg-zinc-800"
            :disabled="!cellBackground"
            aria-label="Clear cell background"
            @pointerdown="preservePointerdown"
            @click="chain()?.setCellAttribute('backgroundColor', null).run()"
          >
            <Eraser class="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" class="text-xs">Clear background</TooltipContent>
      </Tooltip>
    </div>

    <div class="mx-0.5 h-6 w-px bg-gray-200 dark:bg-gray-700" aria-hidden="true" />

    <div class="flex flex-wrap items-center gap-0.5">
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="rounded p-1.5 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-800"
            aria-label="Fix table structure"
            @pointerdown="preservePointerdown"
            @click="chain()?.fixTables().run()"
          >
            <span class="text-[10px] font-semibold">Fix</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" class="text-xs"
          >Fix table if something looks wrong</TooltipContent
        >
      </Tooltip>
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            type="button"
            class="rounded p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
            aria-label="Delete table"
            @pointerdown="preservePointerdown"
            @click="chain()?.deleteTable().run()"
          >
            <Trash2 class="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" class="text-xs">Delete entire table</TooltipContent>
      </Tooltip>
    </div>
      </div>
    </TooltipProvider>
  </BubbleMenu>
</template>
