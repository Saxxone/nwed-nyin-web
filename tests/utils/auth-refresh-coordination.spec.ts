import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AUTH_REFRESH_LOCK_NAME,
  readLocalStorageTrimmed,
  withAuthRefreshCoordination,
} from "~/utils/auth-refresh-coordination";

describe("auth-refresh-coordination", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("runs fn immediately when navigator.locks is missing", async () => {
    vi.stubGlobal("navigator", { locks: undefined });
    const fn = vi.fn(async () => 42);
    await expect(withAuthRefreshCoordination(fn)).resolves.toBe(42);
    expect(fn).toHaveBeenCalledOnce();
  });

  it("delegates to navigator.locks.request when present", async () => {
    const request = vi.fn(
      async (_name: string, fn: () => Promise<number>) => fn(),
    );
    vi.stubGlobal("navigator", { locks: { request } });
    const fn = vi.fn(async () => 7);
    await expect(withAuthRefreshCoordination(fn)).resolves.toBe(7);
    expect(request).toHaveBeenCalledWith(AUTH_REFRESH_LOCK_NAME, fn);
  });

  it("readLocalStorageTrimmed reads key from localStorage", () => {
    localStorage.setItem("refresh_token", "  abc  ");
    expect(readLocalStorageTrimmed("refresh_token")).toBe("abc");
    localStorage.removeItem("refresh_token");
    expect(readLocalStorageTrimmed("refresh_token")).toBe("");
  });
});
