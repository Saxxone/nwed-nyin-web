import { FetchMethod } from "~/types/types";
import api_routes from "~/utils/api-routes";
import type { Article } from "~/types/article";
import type { Pagination } from "~/types/types";
import { useApiConnect } from "~/composables/useApiConnect";

export const useArchiveStore = defineStore("archive", () => {
  const last_article = ref<Article | null>(null);
  async function fetchArticles(pagination: Pagination = { cursor: "1", skip: 0, take: 10 }) {
    try {
      const response = await useApiConnect<Partial<Article>, { articles: Article[]; totalCount: number }>(
        `${api_routes.archive.list}?cursor=${encodeURIComponent(pagination.cursor as string)}&skip=${encodeURIComponent(pagination.skip as number)}&take=${encodeURIComponent(
          pagination.take as number
        )}`,
        FetchMethod.GET
      );

      if ("message" in response) {
        throw new Error(response.message);
      } else {
        last_article.value = response.articles[response.articles.length - 1];
        return response;
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
      throw error;
    }
  }

  async function fetchArticle(article: string) {
    try {
      const response = await useApiConnect<string, Article>(api_routes.archive.view(article), FetchMethod.GET);

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

  async function searchArticles(query: string) {
    try {
      const response = await useApiConnect<string, Article[]>(api_routes.archive.search(query), FetchMethod.GET);

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
      const response = await useApiConnect<Article, Article>(api_routes.archive.add, FetchMethod.POST, article);

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
      const response = await useApiConnect<Article, Article>(api_routes.archive.update(id), FetchMethod.PATCH, article);

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
    createArticle,
    searchArticles,
    updateArticle,
  };
});
