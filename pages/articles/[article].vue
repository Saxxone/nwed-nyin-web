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
const slug = ref(decodeURI(route.params.article as string));
const article = ref<Article>({});
const markdown = ref();
const parsed_article = ref();
const articleStore = useArticleStore();

async function getArticleMeta(slug: string) {
  try {
    article.value = await articleStore.fetchArticle(slug);
  } catch (error) {
    toast({
      title: "Error loading article",
      description: error as string,
    });
  }
}

async function getMarkdownFile(path: string) {
  try {
    markdown.value = await articleStore.fetchMarkdown(path);
  } catch (error) {
    toast({
      title: "Error loading article contents",
      description: error as string,
    });
  }
}

onMounted(async () => {
  await getArticleMeta(slug.value);
  await getMarkdownFile(slug.value);
});

watch(
  () => markdown.value,
  async (new_content) => {
    parsed_article.value = DOMPurify.sanitize(
      await marked.parse(new_content, { breaks: true })
    );
  }
);

useSeoMeta({
  title: article.value?.title,
});
</script>

<template>
  <main>
    <div class="flex items-start mb-4 justify-between">
      <h1
        class="text-4xl font-extrabold tracking-tight lg:text-2xl"
        v-if="article?.title"
      >
        {{ article.title }}
      </h1>
      <NuxtLink :to="app_routes.articles.edit(encodeURI(slug))" class="ml-auto">
        <IconsEditIcon />
      </NuxtLink>
    </div>

    <div
      v-if="parsed_article"
      class="bg-base-light prose prose-sm max-w-none dark:prose-invert"
      v-html="parsed_article"
    ></div>
  </main>
</template>

