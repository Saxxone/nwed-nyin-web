<script lang="ts" setup>
import { useAuthStore } from "@/store/auth";

useHead({
  title: "Login",
});

const g_id_signin = ref(null);
const route = useRoute();

const oauth_2_endpoint = import.meta.env.VITE_GOOGLE_OAUTH;
const client_id = import.meta.env.VITE_GOOGLE_AUTH_CLIENT_ID;

useHead({
  script: [
    {
      src: oauth_2_endpoint,
      async: true,
      defer: true,
    },
  ],
});

interface CredentialResponse {
  credential: string;
  select_by: string;
  state: string;
}

function handleCredentialResponse(response: CredentialResponse) {
  const authStore = useAuthStore();

  authStore.authWithGoogle({ token: response.credential }, route.fullPath);
}
if (process.client)
  //@ts-expect-error handleCredentialResponse needs to be defined in a types delcaration file to remove this error
  window.handleCredentialResponse = handleCredentialResponse;
</script>

<template>
  <div class="container h-dvh md:grid lg:grid-cols-12 mx-auto p-4">
    <div class="h-full bg-slate-900 rounded-lg flex-col p-6 text-white dark:border-r lg:flex lg:col-span-4">
      <div class="flex items-center text-lg font-medium">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          class="mr-2 h-6 w-6">
          <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
        </svg>
        Ñwed Nnyi&#x0323;n
      </div>
      <div class="mt-auto">
        <blockquote class="space-y-2">
          <p class="text-lg">&ldquo;This library has saved me countless hours of work and helped me deliver stunning designs to my clients faster than ever before.&rdquo;</p>
          <footer class="text-sm">Sofia Davis</footer>
        </blockquote>
      </div>
    </div>

    <div class="lg:col-span-8 lg: p-6">
      <div class="flex justify-end">
        <a href="/examples/authentication" class=""> Login </a>
      </div>
      <div class="flex flex-col justify-center items-end h-full">
        <div class="max-w-96 mx-auto">
          <div class="text-center">
            <h1 class="text-2xl font-semibold tracking-tight">Create an account or Login</h1>
            <p class="text-sm text-muted-foreground">Login or signup with </p>
          </div>
          <div class="my-4">
            <div
              ref="g_id_signin"
              id="g_id_onload"
              :data-client_id="client_id"
              data-callback="handleCredentialResponse"
              data-context="login"
              data-ux_mode="popup"
              data-nonce=""
              data-auto_prompt="false" />

            <div class="g_id_signin" data-type="standard" data-shape="rectangular" data-theme="outline" data-text="signin_with" data-size="large" data-logo_alignment="left" />
          </div>
          <p class="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our
            <a href="/terms" class="underline underline-offset-4 hover:text-primary"> Terms of Service </a>
            and
            <a href="/privacy" class="underline underline-offset-4 hover:text-primary"> Privacy Policy </a>
            .
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
