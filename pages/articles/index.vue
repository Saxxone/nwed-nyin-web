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
const is_loading = ref(false)
const articleStore = useArticleStore();
const sanitized_content = ref<Article[]>([]);

async function sanitizeContent(content: string) {
  return DOMPurify.sanitize(await marked.parse(`${content} ...`, { breaks: true }));
}

async function getArticles() {
  try {
    is_loading.value = true
    const items = await articleStore.fetchArticles();
    sanitized_content.value = await Promise.all(items.map(async (item) => ({ ...item, summary: await sanitizeContent(item.summary as string) })));
  } catch (error) {
    toast({
      title: "Error loading article",
      description: error as string,
    });
  } finally {
    is_loading.value = false
  }
}

onMounted(async () => {
  await getArticles();
});
</script>

<template>
  <main>
    <div class="flex items-start mb-4 justify-between">
      <h1 class="text-4xl font-extrabold tracking-tight lg:text-2xl">Articles</h1>
      <NuxtLink :to="app_routes.articles.add" class="ml-auto"> Contribute </NuxtLink>
    </div>

    <IconsLoadingIcon v-if="is_loading"/>
    <NuxtLink
      :to="app_routes.articles.view(encodeURI(article.slug as string))"
      v-for="article in sanitized_content"
      :key="article.id"
      class="border block rounded-lg card text-sm word-wrap mb-4 break-words">
      <h2>{{ article.title }}</h2>
      <p v-html="article.summary" class="text-xs text-muted"></p>
    </NuxtLink>
  </main>
</template>
