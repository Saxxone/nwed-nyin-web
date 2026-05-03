import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useApiConnect } from "~/composables/useApiConnect";
import { FetchMethod } from "~/types/types";
import { useArticleStore } from "~/store/articles";

vi.mock("~/composables/useApiConnect", () => ({
  useApiConnect: vi.fn(),
}));

const mockedUseApiConnect = vi.mocked(useApiConnect);

describe("useArticleStore", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    mockedUseApiConnect.mockReset();
  });

  it("fetches articles with pagination query params", async () => {
    const articles = [{ id: "article-1", title: "Title", content: "Body" }];
    mockedUseApiConnect.mockResolvedValueOnce(articles);

    const store = useArticleStore();
    await expect(
      store.fetchArticles({ cursor: "cursor 1", skip: 10, take: 5 }),
    ).resolves.toEqual(articles);

    expect(mockedUseApiConnect).toHaveBeenCalledWith(
      "/article?cursor=cursor%201&skip=10&take=5",
      FetchMethod.GET,
    );
  });

  it("throws API error messages from article fetches", async () => {
    mockedUseApiConnect.mockResolvedValueOnce({ message: "API failed" });

    const store = useArticleStore();
    await expect(store.fetchArticles()).rejects.toThrow("API failed");
  });

  it("searches articles through the encoded route builder", async () => {
    mockedUseApiConnect.mockResolvedValueOnce([]);

    const store = useArticleStore();
    await expect(store.searchArticles("nwed nyin")).resolves.toEqual([]);

    expect(mockedUseApiConnect).toHaveBeenCalledWith(
      "/article/search?term=nwed%20nyin&skip=0&take=10",
      FetchMethod.GET,
    );
  });

  it("fetches suggested articles with source context", async () => {
    const articles = [{ id: "article-1", title: "Title", content: "Body" }];
    mockedUseApiConnect.mockResolvedValueOnce(articles);

    const store = useArticleStore();
    await expect(
      store.fetchSuggestedArticles({
        source: "word",
        terms: ["ụlọ", "house"],
        excludeSlugs: ["seen-article"],
        take: 3,
      }),
    ).resolves.toEqual(articles);

    expect(mockedUseApiConnect).toHaveBeenCalledWith(
      "/article/related?source=word&take=3&terms=%E1%BB%A5l%E1%BB%8D%2Chouse&excludeSlugs=seen-article",
      FetchMethod.GET,
    );
  });

  it("prefetches and caches article metadata with markdown", async () => {
    const article = { id: "article-1", title: "Title", content: "Body" };
    mockedUseApiConnect
      .mockResolvedValueOnce(article)
      .mockResolvedValueOnce("# Title");

    const store = useArticleStore();

    await expect(store.prefetchArticlePayload("article-1")).resolves.toEqual({
      article,
      markdown: "# Title",
    });
    await expect(store.prefetchArticlePayload("article-1")).resolves.toEqual({
      article,
      markdown: "# Title",
    });

    expect(mockedUseApiConnect).toHaveBeenCalledTimes(2);
    expect(mockedUseApiConnect).toHaveBeenNthCalledWith(
      1,
      "/article/article/article-1",
      FetchMethod.GET,
    );
    expect(mockedUseApiConnect).toHaveBeenNthCalledWith(
      2,
      "/article/markdown?path=article-1.md",
      FetchMethod.GET,
    );
  });

  it("publishes articles with a POST request", async () => {
    const article = { title: "Title", content: "Body" };
    mockedUseApiConnect.mockResolvedValueOnce(article);

    const store = useArticleStore();
    await expect(store.publishArticle(article)).resolves.toEqual(article);

    expect(mockedUseApiConnect).toHaveBeenCalledWith(
      "/article/publish",
      FetchMethod.POST,
      article,
    );
  });
});
