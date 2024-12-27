import type { Snack } from "~/types/types";
import api_routes from "~/utils/api-routes";
import { FetchMethod } from "~/types/types";

export const useGlobalStore = defineStore("global", () => {
  const api_loading = ref(false);
  const page_title = ref("");
  const snack_bars = ref<Snack[]>([]);

  function closeSnack(index: number) {
    snack_bars.value.splice(index, 1);
  }

  function addSnack(snack: Snack) {
    snack_bars.value.push(snack);
  }

  async function uploadFiles(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append(file.name, file);
    });

    const response = await useApiConnect<FormData, string[]>(api_routes.files.upload, FetchMethod.POST, formData, "multipart/form-data");

    if ("message" in response) {
      addSnack({ ...response });
      throw new Error(response.message);
    } else {
      return response;
    }
  }

  return {
    api_loading,
    page_title,
    snack_bars,
    closeSnack,
    addSnack,
    uploadFiles,
  };
});
