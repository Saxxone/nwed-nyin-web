
<script>
import { Toaster } from "@/components/ui/toast";
import { Analytics } from '@vercel/analytics/nuxt'
</script>

<template>
  <div>
    <NuxtLayout>
         <Toaster />
      <NuxtPage></NuxtPage>
      <Analytics/>
    </NuxtLayout>
  </div>
</template>
