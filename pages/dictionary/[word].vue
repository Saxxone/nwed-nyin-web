<script setup lang="ts">
import Definition from "@/components/dictionary/Definition.vue";
import DefinitionSkeleton from "@/components/app/DefinitionSkeleton.vue";
import { useDictStore } from "@/store/dictionary";
import type { Word } from "@/types/word";
import app_routes from "~/utils/routes";

const word = ref<Word>();

const route = useRoute();
const router = useRouter();
const dictStore = useDictStore();
const is_loading = ref(false);

function gotoEdit() {
  if (!word.value) return;
  navigateTo(
    app_routes.dictionary.edit(
      encodeURI(word.value.term),
      encodeURI(word.value.id as string) as string,
    ),
  );
}

async function fetchWord() {
  try {
    is_loading.value = true;
    word.value = await dictStore.fetchWord(
      decodeURI(route.params.word as string),
      decodeURI(route.query.id as string),
    );
  } catch (error) {
    console.error(error);
  } finally {
    is_loading.value = false;
  }
}

onMounted(() => {
  fetchWord();
});

definePageMeta({
  title: `${word.value?.term} Nnyịn (Nwed Nyin) - Dictionary"`,
  layout: "generic",

  meta: [
    {
      name: "description",
      content: `Definition of ${word.value?.term} in the Ñwed Nnyìn (Nwed Nyin) Dictionary. Explore the meaning, pronunciation, etymology, and examples of words in Efik/Ibibio..`,
    },
    {
      property: "og:title",
      content: `${word.value?.term} - Ñwed Nnyìn (Nwed Nyin) Dictionary`,
    },
    {
      property: "og:description",
      content: `Definition of ${word.value?.term} in the Ñwed Nnyìn (Nwed Nyin) Dictionary. Explore the meaning, pronunciation, etymology, and examples of words in Efik/Ibibio..`,
    },
    {
      property: "og:type",
      content: "article",
    },

    {
      name: "twitter:title",
      content: `${word.value?.term} - Ñwed Nnyìn (Nwed Nyin) Dictionary`,
    },
    {
      name: "twitter:description",
      content: `Definition of ${word.value?.term} in the Ñwed Nnyìn (Nwed Nyin) Dictionary. Explore the meaning, pronunciation, etymology, and examples of words in Efik/Ibibio.`,
    },
    {
      name: "twitter:card",
      content: "summary",
    },
    {
      name: "keywords",
      content: `${word.value?.term}, dictionary, definition, Ñwed Nnyìn, Nwed Nyin, language, etymology, Efik, Ibibio, Annang, Oron, Eket, Ikot Abasi, Uruan, Mbo, Ibeno, Oron, Eket, Ikot Abasi, Uruan, Mbo`,
    },
  ],
});
</script>

<template>
  <main>
    <div class="flex items-center justify-end">
      <div class="p-2 cursor-pointer" @click="gotoEdit">
        <IconsEditIcon width="16" height="16" />
      </div>
    </div>
    <DefinitionSkeleton v-if="is_loading" />
    <Definition v-else-if="word" :word="word" :more="true" />
  </main>
</template>
