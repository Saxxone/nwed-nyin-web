<script>
import { Toaster } from "@/components/ui/toast";
</script>

<template>
  <div>
    <NuxtLayout>
      <Toaster />
      <NuxtPage></NuxtPage>
      <ClientOnly>
        <template v-if="$nuxt.isProduction">
          <Analytics />
        </template>
      </ClientOnly>
    </NuxtLayout>
  </div>
</template>
