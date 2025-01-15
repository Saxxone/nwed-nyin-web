<script setup lang="ts">
import app_routes from "~/utils/routes";
import { useToast } from "@/components/ui/toast/use-toast";
import type { Article } from "~/types/article";
import { useArticleStore } from "~/store/articles";
import DOMPurify from "dompurify";
import { marked } from "marked";

definePageMeta({
  layout: "articles",
});

const { toast } = useToast();
const route = useRoute();
const articles = ref<Article[]>([]);
const articleStore = useArticleStore();

async function getArticles() {
  try {
    articles.value = await articleStore.fetchArticles();
  } catch (error) {
    toast({
      title: "Error loading article",
      description: error as string,
    });
  }
}

onMounted(async () => {
  await getArticles();
});
</script>

<template>
  <main>
    <div class="flex items-start mb-4 justify-between">
      <h1 class="text-4xl font-extrabold tracking-tight lg:text-2xl">
        Articles
      </h1>
      <NuxtLink :to="app_routes.articles.add" class="ml-auto">
        Contribute
      </NuxtLink>
    </div>

    <NuxtLink
      :to="app_routes.articles.view(encodeURI(article.slug as string))"
      v-for="article in articles"
      :key="article.id"
      class="border block rounded-lg card text-sm word-wrap mb-4 break-words"
    >
      <h2>{{ article.title }}</h2>
      <p v-html="async() => DOMPurify.sanitize(await marked.parse('article.summary' + '...', { breaks: true }))" class="text-xs text-muted"></p>
    </NuxtLink>
  </main>
</template>
