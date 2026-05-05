import { useAuthStore } from "~/store/auth";
import type { Error } from "~/types/types";
import { useGlobalStore } from "~/store/global";
import { storeToRefs } from "pinia";
import { FetchMethod } from "~/types/types";

function normalizeApiMessage(raw: unknown, fallback: string): string {
  if (typeof raw === "string" && raw.length) return raw;
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean).join(", ");
  return fallback;
}

function toApiError(base: Error, patch: Partial<Error>): Error {
  return {
    ...base,
    ...patch,
    type: "error",
  };
}

/** Routes that obtain tokens or must not trigger refresh (avoid loops). */
function isAuthHandshakePath(path: string): boolean {
  const p = path.split("?")[0]?.replace(/^\/+/, "") ?? "";
  return (
    p === "auth/refresh" ||
    p.startsWith("auth/login") ||
    p.startsWith("auth/signup") ||
    p.startsWith("auth/register")
  );
}

function parseFetchError(error: unknown, err: Error): Error {
  const e = error as {
    statusCode?: number;
    status?: number;
    statusMessage?: string;
    data?: { statusCode?: number; message?: unknown };
    message?: string;
  };
  const data =
    e.data && typeof e.data === "object"
      ? e.data
      : ({} as { statusCode?: number; message?: unknown });
  const statusFromBody =
    typeof data.statusCode === "number" ? data.statusCode : undefined;
  const status =
    statusFromBody ?? e.statusCode ?? e.status ?? err.status;
  const message = normalizeApiMessage(
    data.message,
    e.statusMessage || e.message || err.message,
  );
  return toApiError(err, { message, status });
}

/**
 * Makes an API call using the provided parameters.
 *
 * @template Body The type of the request body.
 * @template Res The type of the expected response data.
 * @param {string} path - The API endpoint path.  Should start with a `/`.
 * @param {FetchMethod} [method=FetchMethod.GET] - The HTTP method to use.
 * @param {Body} [body] - The request body data. Will be omitted if undefined.
 * @param {string} [content_type="application/json"] - The Content-Type header value.  Use "multipart/form-data" for file uploads.
 * @param {RequestCache} [cache = "no-cache"] - Cache setting for request.  Defaults to no-cache.
 * @returns {Promise<Res | Error>} A Promise that resolves to the API response data or an Error object if the request fails.
 */

export async function useApiConnect<Body, Res>(
  path: string,
  method: FetchMethod = FetchMethod.GET,
  body?: Body,
  content_type: string = "application/json",
  cache: RequestCache = "no-cache",
): Promise<Res | Error> {
  const api_url = import.meta.env.VITE_API_BASE_URL;
  const authStore = useAuthStore();
  const { logout, refreshSession } = authStore;
  const globalStore = useGlobalStore();
  const { api_loading } = storeToRefs(globalStore);

  api_loading.value = true;

  const url = `${api_url}${path.startsWith("/") ? path : "/" + path.replace(/^\//, "")}`;

  let err: Error = {
    message: "An unknown error occurred",
    status: 500,
    type: "error",
  };

  let res: Res | Error | undefined;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      res = await $fetch<Res>(url, {
        method,
        headers: {
          ...(content_type !== "multipart/form-data" && {
            "Content-Type": content_type,
          }),
          Authorization:
            "Bearer " + (authStore.access_token ?? ""),
          enctype: "multipart/form-data",
        },
        body: body ?? undefined,
        cache: cache,

        async onRequest({ options }) {
          options.query = options.query || {};
        },

        async onRequestError({ response }) {
          const data = response?._data;
          const status =
            typeof response?.status === "number"
              ? response.status
              : typeof data?.statusCode === "number"
                ? data.statusCode
                : 500;
          err = toApiError(err, {
            message: normalizeApiMessage(
              data?.message,
              response?.statusText || err.message,
            ),
            status,
          });
        },

        async onResponseError({ response }) {
          const data = response._data;
          const status =
            response.status ||
            (typeof data?.statusCode === "number" ? data.statusCode : err.status);
          err = toApiError(err, {
            message: normalizeApiMessage(
              data?.message,
              response.statusText || err.message,
            ),
            status,
          });
        },
      });
      break;
    } catch (error: unknown) {
      console.log(error);
      const e = error as { statusCode?: number; status?: number };
      const is401 = e.statusCode === 401 || e.status === 401;

      if (
        is401 &&
        attempt === 0 &&
        !isAuthHandshakePath(path)
      ) {
        const refreshed = await refreshSession();
        if (refreshed) continue;
      }

      if (is401) {
        await logout();
      }

      err = parseFetchError(error, err);
      res = err;
      break;
    }
  }

  api_loading.value = false;

  if (res === undefined) return err;

  return res;
}
