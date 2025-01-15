import { useAuthStore } from "~/store/auth";
import app_routes from "~/utils/routes";
import { useToast } from "@/components/ui/toast/use-toast";

export default defineNuxtRouteMiddleware((to, from) => {
  if (import.meta.server) return;
  const authStore = useAuthStore();
  const { toast } = useToast();

  const { access_token } = storeToRefs(authStore);
  const closed_paths = [app_routes.dictionary.add, app_routes.articles.add];

  if (
    closed_paths.some((path) => to.path.startsWith(path)) &&
    !access_token.value
  ) {
    toast({
      title: "Invalid credentials",
      description: "Sorry, you need an account to continue",
    });
    return navigateTo(`${app_routes.auth.login}?redirect=${from.fullPath}`);
  }
});
