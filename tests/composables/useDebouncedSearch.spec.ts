import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDebouncedSearch } from "~/composables/useDebouncedSearch";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function mountSearch(
  search: (query: string) => Promise<string[]>,
  initialQuery = "",
) {
  let state!: ReturnType<typeof useDebouncedSearch<string>>;
  const wrapper = mount(
    defineComponent({
      setup() {
        state = useDebouncedSearch({ search, initialQuery });
        return () => null;
      },
    }),
  );
  return { wrapper, state };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebouncedSearch", () => {
  it("debounces queries for 300ms and exposes loading/results", async () => {
    vi.useFakeTimers();
    const search = vi.fn(async (query: string) => [query]);
    const { wrapper, state } = mountSearch(search);

    state.query.value = "place people live";
    await vi.advanceTimersByTimeAsync(299);
    expect(search).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    expect(search).toHaveBeenCalledWith("place people live");
    expect(state.results.value).toEqual(["place people live"]);
    expect(state.isLoading.value).toBe(false);
    wrapper.unmount();
  });

  it("clears results and invalidates pending work for a blank query", async () => {
    vi.useFakeTimers();
    const request = deferred<string[]>();
    const { wrapper, state } = mountSearch(() => request.promise);

    state.query.value = "first";
    await vi.advanceTimersByTimeAsync(300);
    expect(state.isLoading.value).toBe(true);
    state.query.value = "";
    await Promise.resolve();
    request.resolve(["stale"]);
    await Promise.resolve();

    expect(state.results.value).toEqual([]);
    expect(state.isLoading.value).toBe(false);
    wrapper.unmount();
  });

  it("prevents an older response from replacing a newer one", async () => {
    vi.useFakeTimers();
    const first = deferred<string[]>();
    const second = deferred<string[]>();
    const search = vi
      .fn<(query: string) => Promise<string[]>>()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const { wrapper, state } = mountSearch(search);

    state.query.value = "first";
    await vi.advanceTimersByTimeAsync(300);
    state.query.value = "second";
    await vi.advanceTimersByTimeAsync(300);
    second.resolve(["new"]);
    await Promise.resolve();
    first.resolve(["old"]);
    await Promise.resolve();

    expect(state.results.value).toEqual(["new"]);
    wrapper.unmount();
  });

  it("surfaces recoverable errors and refreshes a restored query", async () => {
    const search = vi.fn(async () => {
      throw new Error("Network unavailable");
    });
    const { wrapper, state } = mountSearch(search, "restored");
    await Promise.resolve();
    await Promise.resolve();

    expect(search).toHaveBeenCalledWith("restored");
    expect(state.errorMessage.value).toBe("Network unavailable");
    expect(state.results.value).toEqual([]);
    wrapper.unmount();
  });
});
