<script setup lang="ts">
import imageCompression from "browser-image-compression";
import { useToast } from "@/components/ui/toast/use-toast";
import { disbaleForm, enableForm } from "~/composables/useUtils";
import { useGlobalStore } from "~/store/global";
import type { ArticleImagePosition } from "~/utils/article-editor";

const props = defineProps<{
  file: File;
}>();

const emit = defineEmits(["close", "uploaded"]);
const { toast } = useToast();
const globalStore = useGlobalStore();
const blob_url = ref<string>("");
const compressed_file = ref<File>();

const form = ref({
  name: "",
  description: "",
  position: "center" as ArticleImagePosition,
});

const image_position_options: { label: string; value: ArticleImagePosition }[] = [
  { label: "Centered", value: "center" },
  { label: "Left aligned", value: "left" },
  { label: "Right aligned", value: "right" },
  { label: "Wide", value: "wide" },
  { label: "Full width", value: "full" },
];

function resolveUploadedFileUrl(path?: string) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  const api_url = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") ?? "";
  const normalized_path = path.replace(/^\/+/, "").replace(/^public\/+/, "");
  const served_path = normalized_path.startsWith("articles/")
    ? normalized_path
    : `articles/${normalized_path}`;

  return `${api_url}/${served_path}`;
}

async function upload() {
  if (!form.value.name || !form.value.description) return;
  if (!compressed_file.value) return;

  try {
    disbaleForm();
    const response = await globalStore.uploadFiles([compressed_file.value]);
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
async function handleImageCompression() {
  if (!props.file.type.includes("image")) return;

  const image_file = props.file;
  console.log("originalFile instanceof Blob", image_file instanceof Blob); // true
  console.log(`originalFile size ${image_file.size / 1024 / 1024} MB`);

  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };
  try {
    compressed_file.value = await imageCompression(image_file, options);
    console.log(
      "compressedFile instanceof Blob",
      compressed_file.value instanceof Blob,
    ); // true
    console.log(
      `compressedFile size ${compressed_file.value?.size / 1024 / 1024} MB`,
    ); // smaller than maxSizeMB
  } catch (error) {
    console.log(error);
  }
}

async function getFileUrls(ids: string[]) {
  try {
    const response = await globalStore.getFileUrls(ids);
    const uploaded_file = response[0];
    const url = resolveUploadedFileUrl(uploaded_file.url);

    emit("uploaded", {
      id: uploaded_file.id,
      name: form.value.name,
      description: form.value.description,
      position: form.value.position,
      path: uploaded_file.path,
      type: uploaded_file.type,
      url: url,
      mimetype: uploaded_file.mimetype,
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
      handleImageCompression();
      form.value.name = file.name;
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (blob_url.value) URL.revokeObjectURL(blob_url.value);
});
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
  >
    <div class="bg-base-light p-4 rounded-lg w-full max-w-lg m-4">
      <div class="flex justify-between items-center">
        <h2>Upload File</h2>
        <IconsCloseIcon class="h-6 w-6" @click="emit('close')" />
      </div>
      <form @submit.prevent.stop="upload">
        <div v-if="blob_url" class="my-4">
          <img
            v-if="props.file.type.includes('image')"
            :src="blob_url"
            alt=""
            class="object-cover max-h-60 w-full rounded-md"
          />
          <video
            v-if="props.file.type.includes('video')"
            :src="blob_url"
            autoplay
            controls
            muted
            loop
            class="object-cover max-h-60 w-full rounded-md"
          />
          <audio
            v-if="props.file.type.includes('audio')"
            :src="blob_url"
            autoplay
            controls
            loop
          />
        </div>
        <fieldset>
          <label for="name" class="font-semibold mb-1 block">Name</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            placeholder="File Name"
            class="input"
          />
          <label for="description" class="font-semibold mb-1 block"
            >Description</label
          >
          <input
            id="description"
            v-model="form.description"
            type="text"
            placeholder="File Description"
            class="input"
          />
          <label
            v-if="props.file.type.includes('image')"
            for="position"
            class="font-semibold mb-1 block"
            >Image position</label
          >
          <select
            v-if="props.file.type.includes('image')"
            id="position"
            v-model="form.position"
            class="input"
          >
            <option
              v-for="option in image_position_options"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </fieldset>
        <div class="flex justify-end">
          <Button
            type="button"
            class="mr-4 border border-gray-200 dark:border-gray-800"
            variant="outline"
            @click="emit('close')"
            >Cancel</Button
          >
          <Button
            type="submit"
            :disabled="!form.name || !form.description || !compressed_file"
            >Save</Button
          >
        </div>
      </form>
    </div>
  </div>
</template>
