import { FetchMethod } from "~/types/types";
import api_routes from "~/utils/api-routes";

export const useGlobalStore = defineStore("global", () => {
  const api_loading = ref(false);
  const page_title = ref("");

  async function createFormData(files: File[] | Blob[]): Promise<FormData> {
    const form_data = new FormData();
    files.forEach((file) => {
      form_data.append(file instanceof File ? file.name : "file", file);
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

  return {
    api_loading,
    page_title,
    uploadFiles,
    createFormData,
  };
});
