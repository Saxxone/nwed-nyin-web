<script lang="ts" setup>
import { useAuthStore } from "@/store/auth";
import { useToast } from "@/components/ui/toast/use-toast";

useHead({
  title: "Login",
});

const route = useRoute();
const { toast } = useToast();
const is_loading = ref(false);
const oauth_2_endpoint = import.meta.env.VITE_GOOGLE_OAUTH_ENDPOINT;
const client_id = import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID;

interface CredentialResponse {
  credential: string;
  select_by: string;
  state: string;
}

function handleCredentialResponse(response: CredentialResponse) {
  try {
    is_loading.value = true;
    const authStore = useAuthStore();
    authStore.authWithGoogle({ token: response.credential }, route.query.redirect as string);
  } catch (error) {
    toast({
      title: "Authentication failed",
      description: `Failed to authenticate with Google ${error}`,
    });
  } finally {
    is_loading.value = false;
  }
}

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = oauth_2_endpoint;
    script.onload = () => resolve(script);
    script.onerror = () =>
      reject(new Error("Failed to load Google API script"));
    document.head.appendChild(script);
  });
}

onMounted(async () => {
  try {
    await loadGoogleScript();

    if (typeof window.google !== "undefined") {
      window.google.accounts.id.initialize({
        client_id: client_id,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.renderButton(
        document.querySelector(".g_id_signin")!,
        {
          type: "standard",
          shape: "rectangular",
          theme: "outline",
          text: "signin_with",
          size: "large",
          logo_alignment: "left",
        },
      );
    } else {
      console.error(
        "Google API script loaded but google object is not defined",
      );
    }
  } catch (error) {
    console.error("Failed to load Google API script", error);
  }
});
</script>

<template>
  <div
    class="container h-dvh md:grid lg:grid-cols-12 mx-auto p-4"
    :class="[
      is_loading ? 'pointer-events-none opacity-50 cursor-not-allowed' : '',
    ]"
  >
    <div
      class="h-full bg-slate-900 rounded-lg flex-col p-6 text-white dark:border-r hidden lg:flex lg:col-span-4"
    >
      <div class="flex items-center text-lg font-medium">
        <img
          src="/favicon-32x32.png"
          class="h-6 rounded-full mr-3"
          alt="nsibidi"
        />
        Ñwed Nnyịn
      </div>
      <div class="mt-auto">
        <blockquote class="space-y-2">
          <p class="text-lg">
            &ldquo;Help us create, archive and standardise information on the
            web.&rdquo;
          </p>
          <footer class="text-sm">Stephen Udoekpo</footer>
        </blockquote>
      </div>
    </div>

    <div class="lg:col-span-8 lg:p-6 m-auto h-full">
      <div class="flex flex-col justify-center items-end h-full">
        <div class="max-w-96 m-auto">
          <div class="text-center">
            <h1 class="text-2xl font-semibold tracking-tight">
              Create an account or Login
            </h1>
            <p class="text-sm text-muted-foreground">Login or signup with</p>
          </div>
          <div class="my-4 flex items-center justify-center">
            <IconsLoadingIcon v-if="is_loading" width="40" height="40" />
            <div v-else class="g_id_signin" />
          </div>
          <p class="px-8 text-center text-sm text-muted-foreground">
            By signing up, you agree to our
            <a
              href="/terms"
              class="underline underline-offset-4 hover:text-primary"
            >
              Terms of Service
            </a>
            and
            <a
              href="/privacy"
              class="underline underline-offset-4 hover:text-primary"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
