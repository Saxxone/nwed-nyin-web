<script setup lang="ts">
import { useToast } from "@/components/ui/toast/use-toast";
import { useGlobalStore } from "~/store/global";

const props = defineProps<{
  file: File;
}>();

const emit = defineEmits(['close', 'uploaded'])
const { toast } = useToast();
const globalStore = useGlobalStore();
const blob_url = ref<string>('')
const inputs = ref<NodeListOf<HTMLInputElement>>();
const buttons = ref<NodeListOf<HTMLButtonElement>>();

const form = ref({
  name: '',
  description: ''
})

function disbaleForm() {
  inputs.value?.forEach((input) => {
    input.disabled = true;
  });
  buttons.value?.forEach((button) => {
    button.disabled = true;
  });
}


async function upload() {
  if (!form.value.name) return;

  disbaleForm();

  // await globalStore.uploadFiles([props.file]);

  toast({
    title: `${form.value.name} uploaded successfully`,
    description: "Keep going 📝",
  });

  emit('uploaded', {
    name: form.value.name,
    description: form.value.description,
    url: blob_url.value
  })
}

watch(() => props.file, (file) => {
  if (file) {
    blob_url.value = URL.createObjectURL(file)
    form.value.name = file.name
  }
}, { immediate: true })


onBeforeUnmount(() => {
  if (blob_url.value)
    URL.revokeObjectURL(blob_url.value)
})
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-base-light p-4 rounded-lg w-full max-w-lg m-4">
      <div class="flex justify-between items-center">
        <h2>Upload File</h2>
        <IconsCloseIcon class="h-6 w-6" @click="emit('close')" />
      </div>
      <form @submit.prevent="upload">
        <div class="my-4" v-if="blob_url">
          <img :src="blob_url" alt="" v-if="props.file.type.includes('image')"
            class="object-cover max-h-60 w-full rounded-md" />
          <video :src="blob_url" alt="" v-if="props.file.type.includes('video')" autoplay controls muted loop
            class="object-cover max-h-60 w-full rounded-md" />
          <audio :src="blob_url" alt="" v-if="props.file.type.includes('audio')" autoplay controls loop />
        </div>
        <fieldset>
          <label for="name" class="font-semibold mb-1 block">Name</label>
          <input type="text" id="name" placeholder="File Name" v-model="form.name" class="input" />
          <label for="description" class="font-semibold mb-1 block">Description</label>
          <input type="text" id="description" placeholder="File Description" v-model="form.description" class="input" />
        </fieldset>
        <div class="flex justify-end">
          <Button type="button" @click="emit('close')" class="mr-4 border border-gray-200 dark:border-gray-800"
            variant="outline">Cancel</Button>
          <Button type="submit" :disabled="!form.name && !form.description">Save</Button>
        </div>
      </form>
    </div>
  </div>
</template>