import { FetchMethod } from "~/types/types";
import api_routes from "~/utils/api-routes";

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

  async function uploadFiles(files: File[]): Promise<string[]> {
    const form_data = await createFormData(files);

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
