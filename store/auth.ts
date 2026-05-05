import { useToast } from "@/components/ui/toast/use-toast";
import { useStorage } from "@vueuse/core";
import { FetchMethod, isApiError } from "~/types/types";
import type { User } from "~/types/user";
import {
  readLocalStorageTrimmed,
  withAuthRefreshCoordination,
} from "~/utils/auth-refresh-coordination";
import api_routes from "~/utils/api-routes";
import app_routes from "~/utils/routes";

function hasBearerToken(payload: unknown): payload is User {
  return (
    typeof payload === "object" &&
    payload !== null &&
    "access_token" in payload &&
    typeof (payload as User).access_token === "string" &&
    (payload as User).access_token.length > 0
  );
}

/** Result of exchanging the refresh token; drives retry vs logout in API helpers. */
export type RefreshSessionResult =
  | { success: true }
  | { success: false; invalidateSession: boolean };

function httpStatusFromUnknown(err: unknown): number | undefined {
  const e = err as {
    statusCode?: number;
    status?: number;
    response?: { status?: number };
  };
  const fromResponse =
    typeof e.response?.status === "number" ? e.response.status : undefined;
  return typeof e.statusCode === "number"
    ? e.statusCode
    : typeof e.status === "number"
      ? e.status
      : fromResponse;
}

export const useAuthStore = defineStore("auth", () => {
  let refresh_in_flight: Promise<RefreshSessionResult> | null = null;

  const is_logged_in = useStorage("is_logged_in", false);
  const { toast } = useToast();
  const access_token = useStorage("access_token", "");
  const refresh_token = useStorage("refresh_token", "");
  const user = useStorage("user", {} as User, localStorage, {
    mergeDefaults: true,
  });

  /**
   * Exchanges refresh_token for a new pair. Uses $fetch (not useApiConnect) to
   * avoid recursion. Concurrent callers in this tab share one refresh; across
   * tabs, `withAuthRefreshCoordination` serializes so only one refresh runs.
   *
   * On 401 from `/auth/refresh`, re-reads `refresh_token` once and retries so a
   * peer tab that just rotated the row does not force logout. Network errors do
   * not set `invalidateSession`.
   */
  async function refreshSession(): Promise<RefreshSessionResult> {
    const rt = readLocalStorageTrimmed("refresh_token");
    if (!rt) return { success: false, invalidateSession: true };

    if (refresh_in_flight) return refresh_in_flight;

    const api_url = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "");
    if (!api_url?.trim())
      return { success: false, invalidateSession: false };

    refresh_in_flight = (async () => {
      try {
        return await withAuthRefreshCoordination(async () => {
          const max_attempts = 2;
          for (let attempt = 0; attempt < max_attempts; attempt++) {
            const body_refresh = readLocalStorageTrimmed("refresh_token");
            if (!body_refresh)
              return { success: false, invalidateSession: true };

            try {
              const res = await $fetch<{
                access_token: string;
                refresh_token?: string;
              }>(`${api_url}${api_routes.auth.refresh}`, {
                method: "POST",
                body: { refresh_token: body_refresh },
              });
              if (!res?.access_token?.trim())
                return { success: false, invalidateSession: true };
              access_token.value = res.access_token;
              if (res.refresh_token?.trim()) {
                refresh_token.value = res.refresh_token;
              }
              is_logged_in.value = true;
              return { success: true };
            } catch (err: unknown) {
              const status = httpStatusFromUnknown(err);
              const is401 = status === 401;
              if (is401 && attempt + 1 < max_attempts) continue;
              if (is401)
                return { success: false, invalidateSession: true };
              return { success: false, invalidateSession: false };
            }
          }
          return { success: false, invalidateSession: true };
        });
      } catch {
        return { success: false, invalidateSession: false };
      } finally {
        refresh_in_flight = null;
      }
    })();

    return refresh_in_flight;
  }

  async function signup(userData: Partial<User>) {
    const response = await useApiConnect<Partial<User>, User>(
      api_routes.auth.register,
      FetchMethod.POST,
      userData,
    );
    if (isApiError(response)) {
      toast({
        title: response.message,
        description: "Sign up failed",
      });
      throw new Error(response.message);
    } else {
      goTo(app_routes.auth.login);
    }
  }

  async function login(
    loginData: Partial<User>,
    to: string = app_routes.articles.list,
  ) {
    const response = await useApiConnect<Partial<User>, User>(
      api_routes.auth.login,
      FetchMethod.POST,
      loginData,
    );
    if (isApiError(response)) {
      toast({
        title: response.message,
        description: "Sign in failed",
      });
      logout();
    } else if (!hasBearerToken(response)) {
      toast({
        title: "Sign in failed",
        description: "The server did not return a session token.",
      });
      logout();
    } else {
      const route = useRoute();
      saveTokens(response, to);
      goTo((route.query.redirect as string) || to);
    }
  }

  async function getAuthUserProfile() {
    const response = await useApiConnect<string, User>(
      api_routes.auth.profile,
      FetchMethod.GET,
    );

    if (isApiError(response)) {
      toast({
        title: response.message,
        description: "User not found",
      });
      return null;
    } else {
      user.value = response;
      return response;
    }
  }

  async function authWithGoogle(
    credential: { token: string },
    to: string = app_routes.articles.list,
  ) {
    const response = await useApiConnect<{ token: string }, User>(
      api_routes.auth.google_signup,
      FetchMethod.POST,
      credential,
    );
    if (isApiError(response)) {
      logout();
      toast({
        title: response.message,
        description: "Google sign-in failed",
      });
    } else if (!hasBearerToken(response)) {
      toast({
        title: "Google sign-in failed",
        description: "The server did not return a session token.",
      });
    } else {
      saveTokens(response, to);
    }
  }

  function goTo(to: string) {
    const router = useRouter();
    if (to.includes("/login") || to.includes("/signup"))
      router.push(app_routes.articles.list);
    else router.push(to);
  }

  async function revokeServerSessions() {
    const api_url = import.meta.env.VITE_API_BASE_URL;
    const token = access_token.value;
    if (!api_url?.trim() || !token?.trim()) return;

    try {
      await fetch(`${api_url.replace(/\/$/, "")}/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
    } catch {
      /* ignore */
    }
  }

  async function logout() {
    await revokeServerSessions();
    is_logged_in.value = false;
    user.value = null;
    access_token.value = "";
    refresh_token.value = "";
    const router = useRouter();
    window.location.replace(
      `${app_routes.auth.login}?redirect=${encodeURIComponent(router.currentRoute.value.fullPath)}`,
    );
    toast({
      title: "Unauthorized",
      description: "Sorry, you need an account to continue",
    });
  }

  async function saveTokens(response: User, go: string) {
    access_token.value = response.access_token;
    if (response.refresh_token) {
      refresh_token.value = response.refresh_token;
    }
    is_logged_in.value = true;
    user.value = response;
    if (go) goTo(go);
  }

  return {
    is_logged_in,
    access_token,
    refresh_token,
    user,
    getAuthUserProfile,
    refreshSession,
    signup,
    login,
    logout,
    authWithGoogle,
  };
});
