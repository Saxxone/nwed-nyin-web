import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

type DebouncedSearchOptions<Result> = {
  search: (query: string) => Promise<Result[]>;
  initialQuery?: string;
  initialResults?: Result[];
  debounceMs?: number;
  searchInitialQuery?: boolean;
  onError?: (error: unknown) => void;
  onSettled?: () => void;
};

function searchErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  return "Search is temporarily unavailable.";
}

/** Shared live-search state with debounce and stale-response protection. */
export function useDebouncedSearch<Result>({
  search,
  initialQuery = "",
  initialResults = [],
  debounceMs = 300,
  searchInitialQuery = true,
  onError,
  onSettled,
}: DebouncedSearchOptions<Result>) {
  const query = ref(initialQuery);
  const results = ref<Result[]>([...initialResults]);
  const isLoading = ref(false);
  const errorMessage = ref("");
  const hasQuery = computed(() => query.value.trim().length > 0);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let requestGeneration = 0;

  function cancelTimer() {
    if (!timer) return;
    clearTimeout(timer);
    timer = null;
  }

  function resetForBlankQuery() {
    cancelTimer();
    requestGeneration += 1;
    results.value = [];
    isLoading.value = false;
    errorMessage.value = "";
    onSettled?.();
  }

  async function execute(value = query.value): Promise<Result[]> {
    const trimmed = value.trim();
    cancelTimer();

    if (!trimmed) {
      resetForBlankQuery();
      return [];
    }

    requestGeneration += 1;
    const generation = requestGeneration;
    isLoading.value = true;
    errorMessage.value = "";

    try {
      const nextResults = await search(trimmed);
      if (generation !== requestGeneration) return [];
      results.value = nextResults;
      return nextResults;
    } catch (error) {
      if (generation !== requestGeneration) return [];
      results.value = [];
      errorMessage.value = searchErrorMessage(error);
      onError?.(error);
      return [];
    } finally {
      if (generation === requestGeneration) {
        isLoading.value = false;
        onSettled?.();
      }
    }
  }

  function schedule(value: string) {
    cancelTimer();
    if (!value.trim()) {
      resetForBlankQuery();
      return;
    }

    // Invalidate the previous request as soon as the query changes, including
    // during the debounce window before the replacement request begins.
    requestGeneration += 1;
    isLoading.value = true;
    errorMessage.value = "";
    timer = setTimeout(() => {
      timer = null;
      void execute(value);
    }, debounceMs);
  }

  function clear() {
    if (!query.value) {
      resetForBlankQuery();
      return;
    }
    query.value = "";
  }

  const stopWatching = watch(query, schedule);

  onMounted(() => {
    if (searchInitialQuery && query.value.trim()) void execute(query.value);
  });

  onBeforeUnmount(() => {
    stopWatching();
    cancelTimer();
    requestGeneration += 1;
  });

  return {
    query,
    results,
    isLoading,
    errorMessage,
    hasQuery,
    execute,
    clear,
  };
}
