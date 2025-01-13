import api_routes from "~/utils/api-routes";
import { FetchMethod } from "~/types/types";

export const useGlobalStore = defineStore("global", () => {
  const api_loading = ref(false);
  const page_title = ref("");

  async function uploadFiles(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append(file.name, file);
    });

    const response = await useApiConnect<FormData, string[]>(
      api_routes.files.upload,
      FetchMethod.POST,
      formData,
      "multipart/form-data"
    );

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
  };
});
