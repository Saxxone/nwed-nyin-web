import { useStorage } from "@vueuse/core";
import { FetchMethod } from "~/types/types";
import type { User } from "~/types/user";
import api_routes from "~/utils/api-routes";
import { useToast } from "@/components/ui/toast/use-toast";
import app_routes from "~/utils/routes";

export const useAuthStore = defineStore("auth", () => {
  const is_logged_in = useStorage("is_logged_in", false);
  const { toast } = useToast();
  const access_token = useStorage("access_token", "");
  const refresh_token = useStorage("refresh_token", "");
  const user = useStorage("user", {} as User, localStorage, {
    mergeDefaults: true,
  });

  async function signup(userData: Partial<User>) {
    const response = await useApiConnect<Partial<User>, User>(
      api_routes.auth.register,
      FetchMethod.POST,
      userData,
    );
    if ("status" in response || "statusCode" in response) {
      toast({
        title: response.message,
        description: "Invalid credentials",
      });
      throw new Error("Invalid credentials");
    } else {
      goTo(app_routes.auth.login);
    }
  }

  async function login(
    loginData: Partial<User>,
    to: string = app_routes.articles.list,
  ) {
    const response = await useApiConnect<Partial<User>, User>(
      api_routes.auth.login,
      FetchMethod.POST,
      loginData,
    );
    if ("status" in response || "statusCode" in response) {
      toast({
        title: response.message,
        description: "Invalid credentials",
      });
      logout();
    } else {
      const route = useRoute();
      saveTokens(response, to);
      goTo((route.query.redirect as string) || to);
    }
  }

  async function getAuthUserProfile() {
    const response = await useApiConnect<string, User>(
      api_routes.auth.profile,
      FetchMethod.GET,
    );

    if ("status" in response || "statusCode" in response) {
      toast({
        title: response.message,
        description: "User not found",
      });
      return null;
    } else {
      user.value = response;
      return response;
    }
  }

  async function authWithGoogle(
    credential: { token: string },
    to: string = app_routes.articles.list,
  ) {
    const response = await useApiConnect<{ token: string }, User>(
      api_routes.auth.google_signup,
      FetchMethod.POST,
      credential,
    );
    if ("status" in response || "statusCode" in response) {
      logout();
      toast({
        title: response.message,
        description: "Invalid credentials",
      });
    } else {
      saveTokens(response, to);
    }
  }

  function goTo(to: string) {
    const router = useRouter();
    if (to.includes("/login") || to.includes("/signup"))
      router.push(app_routes.articles.list);
    else router.push(to);
  }

  async function logout() {
    is_logged_in.value = false;
    user.value = null;
    access_token.value = "";
    refresh_token.value = "";
    const router = useRouter();
    window.location.replace(
      `${app_routes.auth.login}?redirect=${encodeURIComponent(router.currentRoute.value.fullPath)}`,
    );
    toast({
      title: "Unauthorized",
      description: "Sorry, you need an account to continue",
    });
  }

  async function saveTokens(response: User, go: string) {
    access_token.value = response.access_token;
    refresh_token.value = response.refresh_token;
    is_logged_in.value = true;
    user.value = response;
    if (go) goTo(go);
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
