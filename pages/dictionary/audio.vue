<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast/use-toast";
import { useDictStore } from "~/store/dictionary";
import type { Word } from "~/types/word";

definePageMeta({
  title: "Ñwed Nnyịn (Nwed Nyin) - Dictionary",
  layout: "articles",
});

const { toast } = useToast();
const route = useRoute();
const inputs = ref<NodeListOf<HTMLInputElement>>();
const buttons = ref<NodeListOf<HTMLButtonElement>>();
const form = ref<HTMLFormElement>();
const mediaRecorder = ref<MediaRecorder>();
const audio_chunks = ref<Blob[]>([]);
const audio_playback = ref<HTMLAudioElement>();
const is_recording = ref(false);

const dictStore = useDictStore();

const form_fields = [
  {
    name: "sound",
    label: "Sound",
    type: "audio",
    placeholder: "Sound out the word slowly and clearly",
  },
];

const base_word: Partial<Word> = {
  sound: "",
};
const word = ref<Partial<Word>>({
  sound: "",
});

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder.value = new MediaRecorder(stream);

    mediaRecorder.value.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audio_chunks.value.push(event.data);
      }
    };

    mediaRecorder.value.onstop = () => {
      const audioBlob = new Blob(audio_chunks.value, { type: "audio/mpeg" });
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audio_playback.value) audio_playback.value.src = audioUrl;
      audio_chunks.value = [];
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

async function stopRecording() {
  if (!mediaRecorder.value) return;
  mediaRecorder.value.stop();
  is_recording.value = false;
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

onMounted(async () => {
  word.value = await dictStore.fetchWord(decodeURI(route.query.word as string) as string);
  bindForm();
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
        <div :name="field.label" v-for="field in form_fields" class="mb-4">
          <label :for="field.name">{{ field.label }}</label>
          <div>
            <div class="p-2 border rounded-lg flex items-center" @click="startRecording" v-if="!is_recording">
              <IconsMicrophoneIcon class="w-6 h-6 text-main" />
            </div>
            <div class="p-2 border rounded-lg flex items-center" @click="stopRecording" v-if="is_recording">
              <IconsMicrophoneDisabledIcon class="w-6 h-6 text-main" />
            </div>
          </div>

          <div>
            <audio ref="audio_playback" controls class="w-full" />
          </div>
        </div>
      </div>
      <div class="col-span-12 md:col-span-8">
        <div class="flex justify-end mt-4">
          <Button type="submit">Save</Button>
        </div>
      </div>
    </form>
  </main>
</template>
