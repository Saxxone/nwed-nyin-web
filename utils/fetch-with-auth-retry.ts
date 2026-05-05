import { useAuthStore } from "~/store/auth";

/**
 * `fetch` with bearer auth; on 401 runs `refreshSession` once and retries.
 * If still 401, calls `logout`. Matches `useApiConnect` session recovery.
 */
export async function fetchWithAuthRetry(
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const authStore = useAuthStore();
  const { logout, refreshSession } = authStore;

  const withBearer = (base: RequestInit): RequestInit => {
    const headers = new Headers(base.headers);
    headers.set(
      "Authorization",
      `Bearer ${authStore.access_token ?? ""}`,
    );
    return { ...base, headers };
  };

  let res = await fetch(url, withBearer(init));
  if (res.status === 401 && (await refreshSession())) {
    res = await fetch(url, withBearer(init));
  }
  if (res.status === 401) {
    await logout();
  }
  return res;
}
