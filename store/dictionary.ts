import { FetchMethod } from "~/types/types";
import api_routes from "~/utils/api-routes";
import type { PartOfSpeech, Word } from "~/types/word";
import type { Pagination } from "~/types/types";

export const useDictStore = defineStore("dict", () => {
  const last_word = ref<Word | null>(null);
  async function fetchWords(pagination: Pagination = { cursor: "1", skip: 0, take: 10 }) {
    try {
      const response = await useApiConnect<Partial<Word>, Word[]>(
        `${api_routes.dictionary.list}?cursor=${encodeURIComponent(pagination.cursor as string)}&skip=${encodeURIComponent(pagination.skip as number)}&take=${encodeURIComponent(
          pagination.take as number
        )}`,
        FetchMethod.GET
      );

      if ("message" in response) {
        throw new Error(response.message);
      } else {
        last_word.value = response[response.length - 1];
        return response;
      }
    } catch (error) {
      console.error("Error fetching words:", error);
      throw error;
    }
  }

  async function fetchWord(word: string) {
    try {
      const response = await useApiConnect<string, Word>(api_routes.dictionary.view(word), FetchMethod.GET);

      if ("message" in response) {
        throw new Error(response.message);
      } else {
        return response;
      }
    } catch (error) {
      console.error("Error fetching words:", error);
      throw error;
    }
  }

  async function fetchPartsOfSpeech() {
    try {
      const response = await useApiConnect<null, PartOfSpeech[]>(api_routes.dictionary.parts_of_speech, FetchMethod.GET);

      if ("message" in response) {
        throw new Error(response.message);
      } else {
        return response;
      }
    } catch (error) {
      console.error("Error fetching words:", error);
      throw error;
    }
  }

  async function makeWord(word: Word) {
    try {
      const response = await useApiConnect<Word, Word>(api_routes.dictionary.add, FetchMethod.POST, word);

      if ("message" in response) {
        throw new Error(response.message);
      } else {
        return response;
      }
    } catch (error) {
      console.error("Error fetching words:", error);
      throw error;
    }
  }

  return {
    fetchWords,
    fetchWord,
    makeWord,
    fetchPartsOfSpeech,
  };
});
