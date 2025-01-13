<script lang="ts" setup>
import { useAuthStore } from "@/store/auth";

useHead({
  title: "Login",
});

const g_id_signin = ref(null);
const route = useRoute();

const oauth_2_endpoint = import.meta.env.VITE_GOOGLE_OAUTH_ENDPOINT;
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

onMounted(() => {
    //@ts-expect-error handleCredentialResponse needs to be defined in a types delcaration file to remove this error
  
  google.accounts.id.initialize({
    client_id: client_id,
    callback: handleCredentialResponse,
    auto_select: false,
    cancel_on_tap_outside: true
  });

  //@ts-expect-error handleCredentialResponse needs to be defined in a types delcaration file to remove this error
  
  google.accounts.id.renderButton(
    document.querySelector('.g_id_signin')!,
    { 
      type: 'standard',
      shape: 'rectangular',
      theme: 'outline',
      text: 'signin_with',
      size: 'large',
      logo_alignment: 'left'
    }
  );
})
</script>

<template>
  <div class="container h-dvh md:grid lg:grid-cols-12 mx-auto p-4">
    <div class="h-full bg-slate-900 rounded-lg flex-col p-6 text-white dark:border-r hidden lg:flex lg:col-span-4">
      <div class="flex items-center text-lg font-medium">
        <img src="/favicon-32x32.png" class="h-6 rounded-full mr-3" alt="nsibidi" />
        Ñwed Nnyịn
      </div>
      <div class="mt-auto">
        <blockquote class="space-y-2">
          <p class="text-lg">&ldquo;Help us create, archive and standardise information on the web.&rdquo;</p>
          <footer class="text-sm">Stephen Udoekpo</footer>
        </blockquote>
      </div>
    </div>

    <div class="lg:col-span-8 lg:p-6">
      <div class="flex flex-col justify-center items-end h-full">
        <div class="max-w-96 mx-auto">
          <div class="text-center">
            <h1 class="text-2xl font-semibold tracking-tight">Create an account or Login</h1>
            <p class="text-sm text-muted-foreground">Login or signup with</p>
          </div>
          <div class="my-4 flex items-center justify-center">
            <div class="g_id_signin" />
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