<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast/use-toast";
import { normalizeString } from "~/composables/useUtils";
import { useDictStore } from "~/store/dictionary";
import { useGlobalStore } from "~/store/global";
import type { Word } from "~/types/word";
import app_routes from "~/utils/routes";

definePageMeta({
  title: "Ñwed Nnyịn (Nwed Nyin) - Dictionary",
  layout: "generic",
});

const { toast } = useToast();
const route = useRoute();
const router = useRouter();
const inputs = ref<NodeListOf<HTMLInputElement>>();
const buttons = ref<NodeListOf<HTMLButtonElement>>();
const form = ref<HTMLFormElement>();
const mediaRecorder = ref<MediaRecorder>();
const is_recording = ref(false);
const is_loading = ref(false);
const audio_url = ref<string>();
const audio_chunk = ref<BlobPart[]>([]);

const dictStore = useDictStore();
const globalStore = useGlobalStore();

const base_word: Partial<Word> = {
  sound: null,
};
const word = ref<Partial<Word>>({
  sound: null,
});

async function startRecording() {
  is_loading.value = true;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
   if(audio_url.value) URL.revokeObjectURL(audio_url.value);
    audio_url.value = undefined;
    audio_chunk.value = [];

    mediaRecorder.value = new MediaRecorder(stream);
    console.log(mediaRecorder.value)

    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audio_chunk.value = [event.data];
      }
    };
    mediaRecorder.value.start();
    is_recording.value = true;
  } catch (error) {
    toast({
      title: "An error occurred",
      description: "Error accessing microphone" + error,
    });
  }
  finally {
    is_loading.value = false;
  }
}

async function stopRecording(type: "STOP" | "CANCEL") {
  if (mediaRecorder.value && mediaRecorder.value.state !== "inactive") {
    mediaRecorder.value.stream.getTracks().forEach((track) => track.stop());
    mediaRecorder.value.stop();

    mediaRecorder.value.onstop = () => {
      if (type === "CANCEL" && audio_url.value) {
        audio_chunk.value = [];
        URL.revokeObjectURL(audio_url.value);
        audio_url.value = undefined;
        return;
      }
      if (!audio_chunk.value) return;

      const filename = `${normalizeString(word.value.term as string)}-${Date.now()}.webm`; 
      const audio_blob = new Blob(audio_chunk.value, { type: "audio/webm" });
      word.value.sound = new File([audio_blob], filename, {
        type: "audio/webm",
        lastModified: Date.now(),
      }); 
      
      audio_url.value = URL.createObjectURL(audio_blob);
    };
    is_recording.value = false;
  }
}

async function onSubmit() {
  try {
    if (!word.value.sound) return;
    disbaleForm();
    const form_data = await globalStore.createFormData([word.value.sound]);
    await dictStore.saveSound(word.value.id as string, form_data);
    toast({
      title: `${word.value.term} sound guide added to dictionary`,
      description: "You're doing a great job. Keeep it up! ❤️",
    });

    form.value?.reset();
    word.value = base_word as Word;
    word.value = { ...base_word };
    router.replace(app_routes.dictionary.view(encodeURI(word.value.term as string), encodeURI(word.value.id as string)));
  } catch (error) {
    toast({
      title: "An error occurred",
      description: error as string,
    });
    alert(error);
  } finally {
    enableForm();
  }
}

function disbaleForm() {
  inputs.value?.forEach((input) => {
    input.disabled = true;
  });
  buttons.value?.forEach((button) => {
    button.disabled = true;
  });
}

function enableForm() {
  inputs.value?.forEach((input) => {
    input.disabled = false;
  });
  buttons.value?.forEach((button) => {
    button.disabled = false;
  });
}

onBeforeMount(async () => {
  if (!route.query.word || !route.query.id) router.go(-1);
});

onMounted(async () => {
  bindForm();
  if (!route.query.word || !route.query.id) return;
  const { term, id } = await dictStore.fetchWord(decodeURI(route.query.word as string), decodeURI(route.query.id as string));
  word.value.term = term;
  word.value.id = id;
});

function bindForm() {
  inputs.value = document.querySelectorAll("input");
  buttons.value = document.querySelectorAll("button");
  form.value = document.getElementById("add-form") as HTMLFormElement;
}
</script>

<template>
  <main>
    <form ref="form" id="add-form" @submit.prevent="onSubmit" class="grid card grid-cols-12 gap-4 rounded-lg border p-4">
      <div class="col-span-12 md:col-span-4">
        <h2 class="mb-4 text-2xl font-medium tracking-tight">
          Word <span v-if="word.term" class="text-main text-sub capitalize break-words"> - {{ word.term }}</span>
        </h2>
        <div class="mb-4">
          <div class="flex items-center">
            <div
              class="p-3 border rounded-full bg-base-light hover:dark:bg-white hover:dark:text-gray-800 hover:bg-gray-700 hover:text-gray-200 inline-flex cursor-pointer items-center transition-colors"
              title="start recording"
              v-if="!is_recording"
              @click="startRecording">
              <IconsLoadingIcon v-if="is_loading" class="animate-spin text-indigo-400" width="18px" height="18px" />
              <IconsMicrophoneIcon v-else width="18px" height="18px" />
            </div>

            <div v-if="is_recording" class="flex items-center w-full md:w-[400px] rounded-full px-2 py-2 border">
              <div class="animate-pulse text-red-400 pl-2">
                <IconsStopIcon width="10px" height="10px" />
              </div>
              <div class="animate-pulse leading-1 ml-2 mr-4">Recording...</div>
              <div class="p-2 border rounded-full text-indigo-500 cursor-pointer inline-flex items-center ml-auto mr-3" title="stop recording" @click="stopRecording('STOP')">
                <IconsStopIcon width="18px" height="18px" />
              </div>
              <div class="p-2 border rounded-full text-red-400 cursor-pointer inline-flex items-center" title="cancel recording" @click="stopRecording('CANCEL')">
                <IconsCloseIcon width="18px" height="18px" />
              </div>
            </div>

            <div>
              <audio v-if="audio_url" :src="audio_url" controls controlslist="nodownload nofullscreen" class="w-[calc(100vw-8rem)] md:w-[300px] h-10 block ml-4" />
            </div>
          </div>
        </div>
      </div>
      <div class="col-span-12 md:col-span-8">
        <div class="flex justify-end mt-4">
          <Button type="submit" :disabled="!audio_url">Save</Button>
        </div>
      </div>
    </form>
  </main>
</template>
