<script lang="ts" setup>
import { useToast } from "@/components/ui/toast/use-toast";
import { useDictStore } from "~/store/dictionary";
import type { Word } from "~/types/word";

interface Props {
  word: Word;
  more?: boolean;
}

const emit = defineEmits(["cursor"]);


const { toast } = useToast();
const props = defineProps<Props>();
const dictStore = useDictStore();
const is_loading = ref(false);
const is_playing = ref(false);
const sound = ref();

const target = ref<Element | null>(null);
const options = {
  root: null,
  rootMargin: "-100% 0px 0px 0px", // Adjust rootMargin to trigger when element crosses the top of the screen
  threshold: 0, // Set threshold to 0 to trigger as soon as any part of the element is visible
};
const observer = ref<IntersectionObserver | null>(null);

async function playSound() {
  if (is_playing.value) return;

  if (sound.value) {
    is_playing.value = true;
    const audioUrl = URL.createObjectURL(sound.value);
    const audio = new Audio(audioUrl);
    audio.play();

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      is_playing.value = false;
    };
  }
}

async function downloadAndPlaySound(path: string) {
  if (sound.value) {
    playSound();
    return;
  }

  if (!path) return;

  try {
    is_loading;
    sound.value = await dictStore.fetchSound(path);
    playSound();
  } catch (error) {
    toast({
      title: "Error playing sound",
      description: error as string,
    });
  } finally {
    is_loading.value = false;
  }
}


function handleIntersection(entries: IntersectionObserverEntry[]) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      emit("cursor", props.word.id);
    }
  });
}

function startObserver() {
  target.value = document.querySelector(`#${props.word.id}`);
  observer.value = new IntersectionObserver(handleIntersection, options);
  if (target.value) {
    observer.value.observe(target.value);
  }
}

onMounted(async () => {
  startObserver();
});
</script>

<template>
  <NuxtLink :id="props.word.id"
    :to="`${routes.dictionary.view(encodeURI(props.word.term), encodeURI(props.word.id as string))}`"
    class="border block rounded-lg card text-sm word-wrap mb-4 break-words"
  >
    <div
      class="scroll-m-20 text-2xl items-end capitalize font-bold tracking-tight lg:text-xl mb-1"
    >
      <div class="flex items-center space-x-3">
        <h5>{{ props.word.term }}</h5>
        <div
          v-if="props.word?.pronunciation_audios?.[0]?.file?.url"
          class="cursor-pointer"
        >
          <IconsLoadingIcon v-if="is_loading" class="inline-block" />
          <IconsVolumeIcon
            v-else
            :class="[is_playing ? 'animate-pulse text-blue-500' : '']"
            class="inline-block"
            @click.prevent="
              downloadAndPlaySound(props.word.pronunciation_audios[0].file.url)
            "
          />
        </div>
      </div>
      <h5
        class="text-gray-500 text-sm capitalize font-medium block"
        v-if="props.word.alt_spelling"
      >
        ({{ props.word.alt_spelling }})
      </h5>
    </div>
    <p class="mb-2 font-serif text-xs" v-if="props.word.pronunciation">
      {{
        `${props.word.pronunciation?.startsWith("/") ? "" : "/"}${props.word.pronunciation}${props.word.pronunciation?.endsWith("/") ? "" : "/"}`
      }}
    </p>

    <div>
      <div v-for="(definition, index) in props.word.definitions" class="mb-4">
        <div v-if="props.more || index === 0">
          <p class="text-xs italic text-muted">
            {{ index + 1 }}. {{ definition.part_of_speech.name }}
          </p>
          <p>{{ definition.meaning }}</p>
          <div class="my-1" v-if="definition.examples.length > 0">
            <h6 class="text-xs mt-2 text-muted">Examples:</h6>

            <div>
              <p v-for="example in definition.examples" class="text-xs">
                {{ example.sentence }}
              </p>
            </div>

            <div v-if="definition.synonyms.length > 0">
              <h6 class="text-xs mt-2 text-muted">Synonyms:</h6>
              <div>
                <NuxtLink
                  :to="`${routes.dictionary.view(encodeURI(synonym.synonym), encodeURI(synonym.id as string))}`"
                  v-for="(synonym, index) in definition.synonyms"
                  :key="synonym.synonym + 'synonym'"
                  class="text-xs hover:underline"
                  >{{ synonym.synonym
                  }}{{
                    `${index < definition.synonyms.length - 1 ? ", " : ""}`
                  }}
                </NuxtLink>
              </div>
            </div>
          </div>

          <div>
            <NuxtLink
              v-for="link in props.word.related_to"
              :to="`${routes.dictionary.view(link.type, link.id)}`"
              class="text-blue-500 text-xs"
              >{{ link }}</NuxtLink
            >
          </div>
        </div>
      </div>
    </div>
  </NuxtLink>
</template>
