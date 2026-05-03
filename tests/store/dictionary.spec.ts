import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("~/composables/useApiConnect", () => ({
  useApiConnect: vi.fn(),
}));

vi.mock("~/store/auth", () => ({
  useAuthStore: vi.fn(() => ({
    access_token: "",
  })),
}));

import { useApiConnect } from "~/composables/useApiConnect";
import { useDictStore } from "~/store/dictionary";
import { FetchMethod } from "~/types/types";

const mockedUseApiConnect = vi.mocked(useApiConnect);

describe("useDictStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockedUseApiConnect.mockReset();
  });

  it("fetches dictionary words with pagination query params", async () => {
    const response = {
      words: [
        { id: "word-1", term: "ụlọ", alt_spelling: null, definitions: [] },
      ],
      totalCount: 1,
      audioCount: 0,
    };
    mockedUseApiConnect.mockResolvedValueOnce(response);

    const store = useDictStore();
    await expect(
      store.fetchWords({ cursor: "cursor 1", skip: 5, take: 25 }),
    ).resolves.toEqual(response);

    expect(mockedUseApiConnect).toHaveBeenCalledWith(
      "/dictionary?cursor=cursor%201&skip=5&take=25",
      FetchMethod.GET,
    );
  });

  it("fetches a word by id when one is provided", async () => {
    const word = {
      id: "word-1",
      term: "ụlọ",
      alt_spelling: null,
      definitions: [],
    };
    mockedUseApiConnect.mockResolvedValueOnce(word);

    const store = useDictStore();
    await expect(store.fetchWord("ulo", "word-1")).resolves.toEqual(word);

    expect(mockedUseApiConnect).toHaveBeenCalledWith(
      "/dictionary/id/word-1",
      FetchMethod.GET,
    );
  });

  it("falls back to the term route when id is empty", async () => {
    const word = {
      id: "word-1",
      term: "ụlọ",
      alt_spelling: null,
      definitions: [],
    };
    mockedUseApiConnect.mockResolvedValueOnce(word);

    const store = useDictStore();
    await expect(store.fetchWord("ulo", "")).resolves.toEqual(word);

    expect(mockedUseApiConnect).toHaveBeenCalledWith(
      "/dictionary/ulo",
      FetchMethod.GET,
    );
  });

  it("throws API error messages from word fetches", async () => {
    mockedUseApiConnect.mockResolvedValueOnce({ message: "Dictionary failed" });

    const store = useDictStore();
    await expect(store.fetchWords()).rejects.toThrow("Dictionary failed");
  });

  it("uploads word sound as multipart form data", async () => {
    const word = {
      id: "word-1",
      term: "ụlọ",
      alt_spelling: null,
      definitions: [],
    };
    const sound = new FormData();
    mockedUseApiConnect.mockResolvedValueOnce(word);

    const store = useDictStore();
    await expect(store.saveSound("word-1", sound)).resolves.toEqual(word);

    expect(mockedUseApiConnect).toHaveBeenCalledWith(
      "/file/upload-sound/word-1",
      FetchMethod.POST,
      sound,
      "multipart/form-data",
    );
  });
});
