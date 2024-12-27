import { useStorage } from "@vueuse/core";
import { FetchMethod } from "~/types/types";
import type { User } from "~/types/user";
import api_routes from "~/utils/api-routes";
import { useGlobalStore } from "./global";
import routes from "~/utils/routes";

export const useAuthStore = defineStore("auth", () => {
  const is_logged_in = useStorage("is_logged_in", false);
  const globalStore = useGlobalStore();
  const { addSnack } = globalStore;
  const access_token = useStorage("access_token", "");
  const refresh_token = useStorage("refresh_token", "");
  const user = useStorage("user", {} as User, localStorage, {
    mergeDefaults: true,
  });

  async function signup(userData: Partial<User>) {
    const response = await useApiConnect<Partial<User>, User>(api_routes.register, FetchMethod.POST, userData);
    if ("status" in response || "statusCode" in response) {
      addSnack({ ...response, type: "error", message: "Invalid credentials" });
      throw new Error("Invalid credentials");
    } else {
      goTo(routes.login);
    }
  }

  async function login(loginData: Partial<User>, to: string = routes.home) {
    const response = await useApiConnect<Partial<User>, User>(api_routes.login, FetchMethod.POST, loginData);
    if ("status" in response || "statusCode" in response) {
      addSnack({ ...response, type: "error", message: "Invalid credentials" });
      logout();
    } else {
      const route = useRoute();
      saveTokens(response);
      goTo((route.query.redirect as string) || to);
    }
  }

  async function getAuthUserProfile() {
    const response = await useApiConnect<string, User>(`${api_routes.users.get(user.value.id)}`, FetchMethod.GET);

    if ("status" in response || "statusCode" in response) {
      addSnack({ ...response, type: "error", message: "User not found" });
      return null;
    } else {
      user.value = response;
      return response;
    }
  }

  async function authWithGoogle(credential: { token: string }, context: string = "login", to: string = routes.home) {
    const response = await useApiConnect<{ token: string }, User>(context === "login" ? api_routes.google_login : api_routes.google_signup, FetchMethod.POST, credential);
    if ("status" in response || "statusCode" in response) {
      addSnack({ ...response, type: "error", message: "Invalid credentials" });
      logout();
    } else {
      saveTokens(response);
      goTo(to);
    }
  }

  function goTo(to: string) {
    const router = useRouter();
    if (to.includes("/login") || to.includes("/signup")) router.push(routes.home);
    else router.push(to);
  }

  async function logout() {
    is_logged_in.value = false;
    user.value = null;
    access_token.value = "";
    refresh_token.value = "";

    addSnack({
      message: "Sorry, you need an account to continue",
      type: "info",
      timeout: 5000,
    });
    const router = useRouter();
    router.push(`${routes.login}?redirect=${encodeURIComponent(router.currentRoute.value.fullPath)}`);
  }

  async function saveTokens(response: User) {
    access_token.value = response.access_token;
    refresh_token.value = response.refresh_token;
    is_logged_in.value = true;
    user.value = response;
  }

  return {
    is_logged_in,
    access_token,
    user,
    getAuthUserProfile,
    signup,
    login,
    logout,
    authWithGoogle,
  };
});
