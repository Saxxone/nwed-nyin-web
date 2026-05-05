import { useApiConnect } from "~/composables/useApiConnect";
import { useAuthStore } from "~/store/auth";
import { FetchMethod } from "~/types/types";
import api_routes from "~/utils/api-routes";

function normalizeUploadErrorMessage(raw: unknown, fallback: string): string {
  if (typeof raw === "string" && raw.length) return raw;
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean).join(", ");
  return fallback;
}

function buildFilesUploadUrl(): string {
  const api_url = import.meta.env.VITE_API_BASE_URL;
  const path = api_routes.files.upload;
  const normalized =
    path.startsWith("/") ? path : `/${path.replace(/^\//, "")}`;
  return `${api_url}${normalized}`;
}

/**
 * Multipart upload with `upload` progress (not available on `$fetch`).
 * Rejects with `Error` and optional numeric `status` for 401 retry handling.
 */
function postMultipartUploadWithProgress(
  url: string,
  form_data: FormData,
  access_token: string,
  on_progress?: (percent: number, length_known: boolean) => void,
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Authorization", `Bearer ${access_token}`);
    xhr.responseType = "json";

    xhr.upload.addEventListener("progress", (e) => {
      if (!on_progress) return;
      if (e.lengthComputable && e.total > 0) {
        on_progress(
          Math.min(100, Math.round((100 * e.loaded) / e.total)),
          true,
        );
      } else {
        on_progress(0, false);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = xhr.response;
        if (!Array.isArray(data)) {
          reject(new Error("Invalid upload response"));
          return;
        }
        resolve(data as string[]);
        return;
      }

      const body = xhr.response as { message?: unknown } | null;
      const msg = normalizeUploadErrorMessage(
        body?.message,
        xhr.statusText || "Upload failed",
      );
      reject(Object.assign(new Error(msg), { status: xhr.status }));
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload"));
    });

    xhr.addEventListener("abort", () => {
      reject(new Error("Upload aborted"));
    });

    xhr.send(form_data);
  });
}

export type UploadFilesOptions = {
  on_upload_progress?: (percent: number, length_known: boolean) => void;
};

export const useGlobalStore = defineStore("global", () => {
  const api_loading = ref(false);
  const page_title = ref("");

  async function createFormData(files: File[]): Promise<FormData> {
    const form_data = new FormData();
    files.forEach((file) => {
      // Third arg sets multipart filename — required so Multer gets extension + sane originalname (not "blob").
      form_data.append("file", file, file.name);
    });

    return form_data;
  }

  async function uploadFiles(
    files: File[],
    options?: UploadFilesOptions,
  ): Promise<string[]> {
    const form_data = await createFormData(files);

    if (!options?.on_upload_progress) {
      const response = await useApiConnect<FormData, string[]>(
        api_routes.files.upload,
        FetchMethod.POST,
        form_data,
        "multipart/form-data",
      );

      if ("message" in response) {
        throw new Error(response.message);
      } else {
        return response;
      }
    }

    const url = buildFilesUploadUrl();
    const auth_store = useAuthStore();
    const { logout, refreshSession } = auth_store;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        return await postMultipartUploadWithProgress(
          url,
          form_data,
          auth_store.access_token ?? "",
          options.on_upload_progress,
        );
      } catch (error: unknown) {
        const status =
          typeof (error as { status?: number }).status === "number"
            ? (error as { status: number }).status
            : undefined;
        const is_401 = status === 401;

        if (is_401 && attempt === 0) {
          const refreshed = await refreshSession();
          if (refreshed.success) continue;
        }

        if (is_401) {
          await logout();
        }

        throw error instanceof Error
          ? error
          : new Error(String(error));
      }
    }

    throw new Error("Upload failed");
  }

  async function getFileUrls(ids: string[]): Promise<
    {
      id: string;
      path: string;
      url: string;
      type: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
      mimetype: string;
      width: number | null;
      height: number | null;
    }[]
  > {
    const response = await useApiConnect<
      string[],
      {
        id: string;
        path: string;
        url: string;
        type: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
        mimetype: string;
        width: number | null;
        height: number | null;
      }[]
    >(api_routes.files.getUrls, FetchMethod.POST, ids);

    if ("message" in response) {
      throw new Error(response.message);
    } else {
      return response;
    }
  }

  return {
    api_loading,
    page_title,
    uploadFiles,
    createFormData,
    getFileUrls,
  };
});
