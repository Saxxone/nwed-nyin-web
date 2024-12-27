import type { Post } from "~/types/post";
import api_routes from "~/utils/api-routes";
import { FetchMethod, type Pagination } from "~/types/types";
import { useGlobalStore } from "./global";
import type { User } from "~/types/user";

export const useUsersStore = defineStore("users", () => {
  const globalStore = useGlobalStore();
  const { addSnack } = globalStore;

  async function findUser(search_query: string, pagination: Pagination = { cursor: undefined, skip: 0, take: 10 }, with_pk: boolean = false) {
    const query = `${encodeURIComponent(search_query)}&with_pk=${encodeURIComponent(with_pk)}`;
    const response = await useApiConnect<Partial<Post>, Post[]>(
      `${api_routes.users.search(query)}&cursor=${encodeURIComponent(pagination.cursor as string)}&skip=${encodeURIComponent(pagination.skip as number)}&take=${encodeURIComponent(
        pagination.take as number
      )}`,
      FetchMethod.POST
    );

    if ("message" in response) {
      addSnack({ ...response });
      throw new Error(response.message);
    } else {
      return response;
    }
  }

  async function getUserProfile(id: string) {
    const response = await useApiConnect<string, User>(`${api_routes.users.get(id)}`, FetchMethod.GET);

    if ("message" in response) {
      addSnack({ ...response });
      throw new Error(response.message);
    } else {
      return response;
    }
  }

  return {
    findUser,
    getUserProfile,
  };
});
