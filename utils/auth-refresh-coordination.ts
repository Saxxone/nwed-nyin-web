/**
 * Serializes auth refresh across browser tabs. Without this, two tabs can POST
 * /auth/refresh with the same refresh token; one succeeds and rotates the row,
 * the other gets 401 and the SPA logs the user out.
 *
 * Manual repro: open two tabs, trigger authenticated requests in both within
 * the same second (or let both hit 401+refresh together) and watch Network:
 * before this lock, two concurrent POST /auth/refresh often yields one 401.
 */
export const AUTH_REFRESH_LOCK_NAME = "nwed-nyin-auth-refresh";

export function readLocalStorageTrimmed(key: string): string {
  if (typeof localStorage === "undefined") return "";
  return (localStorage.getItem(key) ?? "").trim();
}

/**
 * Runs `fn` under the Web Locks API when available (cross-tab mutex).
 * Falls back to immediate `fn()` when `navigator.locks` is missing.
 */
export async function withAuthRefreshCoordination<T>(
  fn: () => Promise<T>,
): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request(AUTH_REFRESH_LOCK_NAME, fn);
  }
  return fn();
}
