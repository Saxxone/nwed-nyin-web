<script setup lang="ts">
import imageCompression from "browser-image-compression";
import { useToast } from "@/components/ui/toast/use-toast";
import { useGlobalStore } from "~/store/global";
import type { ArticleImagePosition } from "~/utils/article-editor";

/** Align with Multer `FILE_SIZE_LIMIT` in `nwed-nyin-api/src/file/file.controller.ts`. */
const MAX_UPLOAD_BYTES = 1024 * 1024;

/** `browser-image-compression` often returns a Blob; Multer/Sharp need a real filename + extension. */
function toUploadableImageFile(blob: Blob, source_name: string): File {
  const stem = source_name.replace(/\.[^/.]+$/, "").trim() || "image";
  const mime = blob.type && blob.type.startsWith("image/")
    ? blob.type
    : "image/jpeg";
  let suffix = ".jpg";
  if (mime.includes("png")) suffix = ".png";
  else if (mime.includes("webp")) suffix = ".webp";
  return new File([blob], `${stem}${suffix}`, { type: mime });
}

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

const image_position_options: { label: string; value: ArticleImagePosition }[] =
  [
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
    const response = await globalStore.uploadFiles([compressed_file.value]);
    await getFileUrls(response);
    toast({
      title: `${form.value.name} uploaded successfully`,
      description: "Keep going 📝",
    });
  } catch (error) {
    toast({
      title: `Error uploading ${props.file.name}`,
      description: `${error instanceof Error ? error.message : "Unknown error"}`,
    });
  }
}
async function handleImageCompression() {
  compressed_file.value = undefined;

  if (!props.file.type.includes("image")) return;

  const image_file = props.file;
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };
  try {
    const out = await imageCompression(image_file, options);
    compressed_file.value = toUploadableImageFile(out, props.file.name);
  } catch {
    const within_limit = props.file.size <= MAX_UPLOAD_BYTES;
    if (within_limit) {
      compressed_file.value = props.file;
      toast({
        title: "Could not shrink image locally",
        description:
          "Using your original file. The server will still optimize it (1 MB maximum).",
      });
    } else {
      toast({
        title: "Could not prepare this image",
        description:
          `${props.file.name} is over 1 MB and could not be reduced in the browser. Try another image file or shrink it elsewhere first.`,
      });
    }
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
      width: uploaded_file.width,
      height: uploaded_file.height,
    });
  } catch (error) {
    toast({
      title: `Error getting file url`,
      description: `${error instanceof Error ? error.message : "Unknown error"}`,
    });
    throw error;
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
