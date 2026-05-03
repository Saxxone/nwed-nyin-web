import { defineStore } from "pinia";
import { ref } from "vue";
import { useApiConnect } from "~/composables/useApiConnect";
import type { Pagination } from "~/types/types";
import { FetchMethod } from "~/types/types";
import type { PartOfSpeech, Word } from "~/types/word";
import api_routes from "~/utils/api-routes";
import { useAuthStore } from "~/store/auth";

function dictionaryListSearchParams(pagination: Pagination): string {
  const skip =
    typeof pagination.skip === "number" && Number.isFinite(pagination.skip)
      ? pagination.skip
      : 0;
  const take =
    typeof pagination.take === "number" && Number.isFinite(pagination.take)
      ? pagination.take
      : 50;
  const parts: string[] = [
    `skip=${encodeURIComponent(String(skip))}`,
    `take=${encodeURIComponent(String(take))}`,
  ];
  const cursor =
    typeof pagination.cursor === "string" ? pagination.cursor.trim() : "";
  if (
    cursor.length > 0 &&
    cursor !== "undefined" &&
    cursor !== "null"
  ) {
    parts.unshift(`cursor=${encodeURIComponent(cursor)}`);
  }
  return parts.join("&");
}

function dictionaryJumpSearchParams(
  alphabet: string,
  pagination: Pagination,
): string {
  const parts: string[] = [
    `alphabet=${encodeURIComponent(alphabet.trim())}`,
  ];
  const take =
    typeof pagination.take === "number" && Number.isFinite(pagination.take)
      ? pagination.take
      : 50;
  parts.push(`take=${encodeURIComponent(String(take))}`);
  const cursor =
    typeof pagination.cursor === "string" ? pagination.cursor.trim() : "";
  if (
    cursor.length > 0 &&
    cursor !== "undefined" &&
    cursor !== "null"
  ) {
    parts.push(`cursor=${encodeURIComponent(cursor)}`);
  }
  return parts.join("&");
}

export const useDictStore = defineStore("dict", () => {
  const last_word = ref<Word | null>(null);

  async function fetchWords(
    pagination: Pagination = { cursor: undefined, take: 50, skip: 0 },
  ) {
    try {
      const response = await useApiConnect<
        Partial<Word>,
        { words: Word[]; totalCount: number; audioCount: number }
      >(
        `${api_routes.dictionary.list}?${dictionaryListSearchParams({
          cursor: pagination.cursor,
          skip: pagination.skip,
          take: pagination.take,
        })}`,
        FetchMethod.GET,
      );

      if ("message" in response) {
        throw new Error(response.message);
      } else {
        last_word.value = response.words[response.words.length - 1];
        return response;
      }
    } catch (error) {
      throw error;
    }
  }

  async function fetchWord(word: string, id: string) {
    try {
      const response =
        id && id !== "" && id !== "null" && id !== "undefined"
          ? await useApiConnect<string, Word>(
              api_routes.dictionary.viewById(id),
              FetchMethod.GET,
            )
          : await useApiConnect<string, Word>(
              api_routes.dictionary.view(word),
              FetchMethod.GET,
            );

      if ("message" in response) {
        throw new Error(response.message);
      } else {
        return response;
      }
    } catch (error) {
      throw error;
    }
  }

  async function searchWord(word: string) {
    try {
      const response = await useApiConnect<string, Word[]>(
        api_routes.dictionary.search(word),
        FetchMethod.GET,
      );

      if ("message" in response) {
        throw new Error(response.message);
      } else {
        return response;
      }
    } catch (error) {
      throw error;
    }
  }

  async function jumpToAlphabet(
    alphabet: string,
    pagination: Pagination = { cursor: undefined, take: 50 },
  ): Promise<{
    words: Word[];
    totalCount: number;
    audioCount: number;
  }> {
    try {
      const response = await useApiConnect<
        string,
        {
          words: Word[];
          totalCount: number;
          audioCount: number;
        }
      >(
        `${api_routes.dictionary.jump}?${dictionaryJumpSearchParams(
          alphabet,
          {
            cursor: pagination.cursor,
            take: pagination.take,
          },
        )}`,
        FetchMethod.GET,
      );

      if ("message" in response) {
        throw new Error(response.message);
      } else {
        return response;
      }
    } catch (error) {
      throw error;
    }
  }

  async function fetchPartsOfSpeech() {
    try {
      const response = await useApiConnect<null, PartOfSpeech[]>(
        api_routes.dictionary.parts_of_speech,
        FetchMethod.GET,
      );

      if ("message" in response) {
        throw new Error(response.message);
      } else {
        return response;
      }
    } catch (error) {
      throw error;
    }
  }

  async function makeWord(word: Word) {
    try {
      const response = await useApiConnect<Word, Word>(
        api_routes.dictionary.add,
        FetchMethod.POST,
        word,
      );

      if ("message" in response) {
        throw new Error(response.message);
      } else {
        return response;
      }
    } catch (error) {
      throw error;
    }
  }

  async function updateWord(id: string, word: Word) {
    try {
      const response = await useApiConnect<Word, Word>(
        api_routes.dictionary.update(id),
        FetchMethod.PATCH,
        word,
      );

      if ("message" in response) {
        throw new Error(response.message);
      } else {
        return response;
      }
    } catch (error) {
      throw error;
    }
  }

  async function saveSound(id: string, sound: FormData) {
    try {
      const response = await useApiConnect<Partial<Word>, Word>(
        api_routes.dictionary.updateSound(id),
        FetchMethod.POST,
        sound,
        "multipart/form-data",
      );

      if ("message" in response) {
        throw new Error(response.message);
      } else {
        return response;
      }
    } catch (error) {
      throw error;
    }
  }

  async function fetchSound(path: string): Promise<Blob> {
    const api_url = import.meta.env.VITE_API_BASE_URL as string | undefined;
    const authStore = useAuthStore();
    const url = `${api_url ?? ""}${api_routes.dictionary.getSound(path)}`;

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${authStore.access_token ?? ""}`,
        },
      });

      if (!res.ok) {
        let message = res.statusText;
        try {
          const body = await res.json() as {
            message?: unknown;
          };
          if (typeof body?.message === "string") message = body.message;
        } catch {
          /* non-JSON error body */
        }
        throw new Error(message || `HTTP ${res.status}`);
      }

      return await res.blob();
    } catch (error) {
      console.error("Error fetching pronunciation audio:", error);
      throw error;
    }
  }

  return {
    fetchWords,
    fetchWord,
    makeWord,
    fetchPartsOfSpeech,
    searchWord,
    updateWord,
    saveSound,
    fetchSound,
    jumpToAlphabet,
  };
});
