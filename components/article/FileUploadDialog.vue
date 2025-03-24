<script setup lang="ts">
import { useToast } from "@/components/ui/toast/use-toast";
import { disbaleForm, enableForm } from "~/composables/useUtils";
import { useGlobalStore } from "~/store/global";

const props = defineProps<{
  file: File;
}>();

const emit = defineEmits(["close", "uploaded"]);
const { toast } = useToast();
const globalStore = useGlobalStore();
const blob_url = ref<string>("");

const form = ref({
  name: "",
  description: "",
});


async function upload() {
  if (!form.value.name) return;

  try {
    disbaleForm();
    const response = await globalStore.uploadFiles([props.file]);
    toast({
      title: `${form.value.name} uploaded successfully`,
      description: "Keep going 📝",
    });

    await getFileUrls(response);
  } catch (error) {
    toast({
      title: `Error uploading ${props.file.name}`,
      description: `${error instanceof Error ? error.message : "Unknown error"}`,
    });
    enableForm();
  }
}

async function getFileUrls(ids: string[]) {
  try {
    const response = await globalStore.getFileUrls(ids);
    const api_url = import.meta.env.VITE_API_BASE_URL;
    const url = `${api_url}${api_url.endsWith("/") ? "nwed-nyin-api" : "/nwed-nyin-api"}${response[0].url}`;

    emit("uploaded", {
      name: form.value.name,
      description: form.value.description,
      url: url,
    });
  } catch (error) {
    toast({
      title: `Error getting file url`,
      description: `${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}

watch(
  () => props.file,
  (file) => {
    if (file) {
      blob_url.value = URL.createObjectURL(file);
      form.value.name = file.name;
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (blob_url.value) URL.revokeObjectURL(blob_url.value);
});
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-base-light p-4 rounded-lg w-full max-w-lg m-4">
      <div class="flex justify-between items-center">
        <h2>Upload File</h2>
        <IconsCloseIcon class="h-6 w-6" @click="emit('close')" />
      </div>
      <form @submit.prevent.stop="upload">
        <div class="my-4" v-if="blob_url">
          <img :src="blob_url" alt="" v-if="props.file.type.includes('image')" class="object-cover max-h-60 w-full rounded-md" />
          <video :src="blob_url" alt="" v-if="props.file.type.includes('video')" autoplay controls muted loop class="object-cover max-h-60 w-full rounded-md" />
          <audio :src="blob_url" alt="" v-if="props.file.type.includes('audio')" autoplay controls loop />
        </div>
        <fieldset>
          <label for="name" class="font-semibold mb-1 block">Name</label>
          <input type="text" id="name" placeholder="File Name" v-model="form.name" class="input" />
          <label for="description" class="font-semibold mb-1 block">Description</label>
          <input type="text" id="description" placeholder="File Description" v-model="form.description" class="input" />
        </fieldset>
        <div class="flex justify-end">
          <Button type="button" @click="emit('close')" class="mr-4 border border-gray-200 dark:border-gray-800" variant="outline">Cancel</Button>
          <Button type="submit" :disabled="!form.name && !form.description">Save</Button>
        </div>
      </form>
    </div>
  </div>
</template>
