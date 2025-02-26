import type { Pagination } from "~/types/types";
import { FetchMethod } from "~/types/types";
import type { PartOfSpeech, Word } from "~/types/word";
import api_routes from "~/utils/api-routes";

export const useDictStore = defineStore("dict", () => {
  const last_word = ref<Word | null>(null);

  async function fetchWords(
    pagination: Pagination = { cursor: undefined, take: 50, skip: 0 },
  ) {
    try {
      const response = await useApiConnect<
        Partial<Word>,
        { words: Word[]; totalCount: number }
      >(
        `${api_routes.dictionary.list}?cursor=${encodeURIComponent(pagination.cursor as string)}&skip=${encodeURIComponent(
          pagination.skip as number,
        )}&take=${encodeURIComponent(
          pagination.take as number,
        )}`,
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

  async function jumpToAlphabet(alphabet: string, pagination: Pagination = { cursor: undefined, take: 50 },) {
    try {
      const response = await useApiConnect<string, Word[]>(
        `${api_routes.dictionary.jump}?alphabet=${alphabet}&cursor=${encodeURIComponent(pagination.cursor as string)}&take=${encodeURIComponent(
          pagination.take as number,
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

  async function fetchSound(path: string): Promise<string> {
    try {
      const response = await useApiConnect<string, string>(
        api_routes.dictionary.getSound(path),
        FetchMethod.GET,
      );

      if (typeof response === "string") return response;
      else if ("message" in response) {
        throw new Error(response.message);
      } else return response;
    } catch (error) {
      console.error("Error fetching articles:", error);
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
