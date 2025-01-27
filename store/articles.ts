import { FetchMethod } from "~/types/types";
import api_routes from "~/utils/api-routes";
import type { Article } from "~/types/article";
import type { Pagination } from "~/types/types";
import { useApiConnect } from "~/composables/useApiConnect";

export const useArticleStore = defineStore("articles", () => {
  const last_article = ref<Article | null>(null);
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
        last_article.value = response[response.length - 1];
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

  async function searchArticles(query: string) {
    try {
      const response = await useApiConnect<string, Article[]>(
        api_routes.articles.search(query),
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
    createArticle,
    searchArticles,
    updateArticle,
    publishArticle,
  };
});
