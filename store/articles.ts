import { defineStore } from "pinia";
import { ref } from "vue";
import { useApiConnect } from "~/composables/useApiConnect";
import type {
  Article,
  ArticleRevision,
  ArticleSearchHit,
} from "~/types/article";
import type { Pagination } from "~/types/types";
import { FetchMethod } from "~/types/types";
import api_routes from "~/utils/api-routes";

export type SuggestedArticleSource = "article" | "word";

export type ArticlePrefetchPayload = {
  article: Article;
  markdown: string;
};

export const useArticleStore = defineStore("articles", () => {
  const last_article = ref<Article | null>(null);
  const article_payload_cache = ref<Record<string, ArticlePrefetchPayload>>({});
  async function fetchArticles(
    pagination: Pagination = { cursor: "1", skip: 0, take: 10 },
  ) {
    try {
      const response = await useApiConnect<Partial<Article>, Article[]>(
        `${api_routes.articles.list}?cursor=${encodeURIComponent(
          pagination.cursor as string,
        )}&skip=${encodeURIComponent(
          pagination.skip as number,
        )}&take=${encodeURIComponent(pagination.take as number)}`,
        FetchMethod.GET,
      );

      if ("message" in response) {
        throw new Error(response.message);
      } else {
        last_article.value = response[response.length - 1] ?? null;
        return response;
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
      throw error;
    }
  }

  async function fetchArticle(slug: string) {
    try {
      const response = await useApiConnect<string, Article>(
        api_routes.articles.view(slug),
        FetchMethod.GET,
      );

      if ("message" in response) {
        throw new Error(response.message);
      } else {
        return response;
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
      throw error;
    }
  }

  async function fetchMarkdown(path: string): Promise<string> {
    try {
      const response = await useApiConnect<string, string>(
        api_routes.articles.getMarkdown(path),
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

  async function fetchSuggestedArticles({
    source,
    slug,
    terms = [],
    excludeSlugs = [],
    take = 5,
  }: {
    source: SuggestedArticleSource;
    slug?: string;
    terms?: string[];
    excludeSlugs?: string[];
    take?: number;
  }) {
    try {
      const response = await useApiConnect<null, Article[]>(
        api_routes.articles.related({
          source,
          slug,
          terms,
          excludeSlugs,
          take,
        }),
        FetchMethod.GET,
      );

      if ("message" in response) {
        throw new Error(response.message);
      } else {
        return response;
      }
    } catch (error) {
      console.error("Error fetching suggested articles:", error);
      throw error;
    }
  }

  async function prefetchArticlePayload(
    slug: string,
    { force = false }: { force?: boolean } = {},
  ): Promise<ArticlePrefetchPayload> {
    const cache_key = decodeURI(slug);

    if (!force && article_payload_cache.value[cache_key]) {
      return article_payload_cache.value[cache_key];
    }

    const [article, markdown] = await Promise.all([
      fetchArticle(cache_key),
      fetchMarkdown(`${cache_key}.md`),
    ]);

    const payload = { article, markdown };
    article_payload_cache.value = {
      ...article_payload_cache.value,
      [cache_key]: payload,
    };

    return payload;
  }

  async function publishArticle(article: Article): Promise<Article> {
    try {
      const response = await useApiConnect<Article, Article>(
        api_routes.articles.publish,
        FetchMethod.POST,
        article,
      );

      if ("message" in response) {
        throw new Error(response.message);
      } else {
        return response;
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
      throw error;
    }
  }

  async function updateArticle(id: string, article: Article) {
    try {
      const response = await useApiConnect<Article, Article>(
        api_routes.articles.update(id),
        FetchMethod.PATCH,
        article,
      );

      if ("message" in response) {
        throw new Error(response.message);
      } else {
        return response;
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
      throw error;
    }
  }

  async function fetchArticleRevisions(article_id: string) {
    try {
      if (!article_id?.trim()) {
        throw new Error("Article id is required to load revisions");
      }
      const response = await useApiConnect<undefined, ArticleRevision[]>(
        api_routes.articles.revisions(article_id),
        FetchMethod.GET,
      );

      if ("message" in response) {
        throw new Error(response.message);
      }
      if (!Array.isArray(response)) {
        throw new Error("Unexpected response when loading revisions");
      }
      return response;
    } catch (error) {
      console.error("Error fetching article revisions:", error);
      throw error;
    }
  }

  async function searchArticles(
    query: string,
    pagination: Pagination = { skip: 0, take: 10 },
  ) {
    try {
      const response = await useApiConnect<string, ArticleSearchHit[]>(
        api_routes.articles.search(
          query,
          pagination.skip ?? 0,
          pagination.take ?? 10,
        ),
        FetchMethod.GET,
      );

      if ("message" in response) {
        throw new Error(response.message);
      } else {
        return response;
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
      throw error;
    }
  }

  async function createArticle(article: Article) {
    try {
      const response = await useApiConnect<Article, Article>(
        api_routes.articles.add,
        FetchMethod.POST,
        article,
      );

      if ("message" in response) {
        throw new Error(response.message);
      } else {
        return response;
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
      throw error;
    }
  }

  return {
    fetchArticles,
    fetchArticle,
    fetchMarkdown,
    fetchSuggestedArticles,
    prefetchArticlePayload,
    createArticle,
    searchArticles,
    updateArticle,
    publishArticle,
    fetchArticleRevisions,
  };
});
