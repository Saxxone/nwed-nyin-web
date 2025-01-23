<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast/use-toast";
import { useDictStore } from "~/store/dictionary";
import type { Word } from "~/types/word";

definePageMeta({
  title: "Ñwed Nnyịn (Nwed Nyin) - Dictionary",
  layout: "general",
});

const { toast } = useToast();
const route = useRoute();
const router = useRouter();
const inputs = ref<NodeListOf<HTMLInputElement>>();
const buttons = ref<NodeListOf<HTMLButtonElement>>();
const form = ref<HTMLFormElement>();
const mediaRecorder = ref<MediaRecorder>();
const audio_chunks = ref<Blob[]>([]);
const is_recording = ref(false);
const audio_url = ref<string>();

const dictStore = useDictStore();

const base_word: Partial<Word> = {
  sound: "",
};
const word = ref<Partial<Word>>({
  sound: "",
});

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audio_url.value = undefined;

    mediaRecorder.value = new MediaRecorder(stream);

    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audio_chunks.value.push(event.data);
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
}

async function stopRecording(type: "STOP" | "CANCEL") {
  if (mediaRecorder.value && mediaRecorder.value.state !== "inactive") {
    mediaRecorder.value.stream.getTracks().forEach((track) => track.stop());
    mediaRecorder.value.stop();

    mediaRecorder.value.onstop = () => {
      if (type === "CANCEL") {
        audio_chunks.value = [];
        return;
      }
      const audio_blob = new Blob(audio_chunks.value, { type: "audio/mpeg" });
      audio_url.value = URL.createObjectURL(audio_blob);
      audio_chunks.value = [];
    };

    is_recording.value = false;
  }
}

async function cancelRecording() {
  await stopRecording("CANCEL");
  if (audio_url.value) {
    URL.revokeObjectURL(audio_url.value);
    audio_url.value = undefined;
  }
}

async function onSubmit() {
  try {
    disbaleForm();
    await dictStore.saveSound(word.value.id as string, word.value);
    toast({
      title: `${word.value.term} sound guide added to dictionary`,
      description: "You're doing a great job. Keeep it up! ❤️",
    });

    form.value?.reset();
    word.value = base_word as Word;
    word.value = { ...base_word };
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
  if (!route.query.word) router.go(-1);
});

onMounted(async () => {
  bindForm();
  if (!route.query.word) return;
  word.value = await dictStore.fetchWord(decodeURI(route.query.word as string) as string);
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
            <div class="p-3 border rounded-full bg-base-light inline-flex cursor-pointer items-center" title="start recording" v-if="!is_recording" @click="startRecording">
              <IconsMicrophoneIcon width="18px" height="18px" />
            </div>

            <div v-if="is_recording" class="flex items-center rounded-full px-4 py-2 border">
              <div class="animate-pulse text-red-400">
                <IconsStopIcon width="10px" height="10px" />
              </div>
              <div class="animate-pulse leading-1 ml-2 mr-4">Recording...</div>
              <div class="p-2 border rounded-full text-indigo-500 cursor-pointer inline-flex items-center mx-4" title="stop recording" @click="stopRecording('STOP')">
                <IconsStopIcon width="18px" height="18px" />
              </div>
              <div class="p-2 border rounded-full text-red-400 cursor-pointer inline-flex items-center" title="cancel recording" @click="cancelRecording">
                <IconsCloseIcon width="18px" height="18px" />
              </div>
            </div>

            <div>
              <audio v-if="audio_url" :src="audio_url" controls class="w-[240px] h-10 block ml-4" />
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
