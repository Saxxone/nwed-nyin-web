<script setup lang="ts">
import app_routes from "~/utils/routes";

definePageMeta({
  title: "Nwed Nyin",
  layout: "generic",
});

const router = useRouter();

onBeforeMount(() => {
  router.push(app_routes.articles.list);
});
</script>

<template>
  <div>
    <h1
      className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl"
    >
      Ñwed Nnyịn
    </h1>
    <p>We're telling our stories</p>
  </div>
</template>
