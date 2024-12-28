<script setup lang="ts">
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PartOfSpeech, Word } from "~/types/word";
import { useDictStore } from "~/store/dictionary";

definePageMeta({
  title: "Ñwed Nnyi&#x0323;n (Nwed Nyin) - Dictionary",
  layout: "articles",
});

const formSchema = toTypedSchema(
  z.object({
    username: z.string().min(2).max(50),
  })
);

const form = useForm({
  validationSchema: formSchema,
});
const parts_of_speech = ref<PartOfSpeech[]>([]);
const form_fields = [
  {
    name: "term",
    label: "Term",
    type: "text",
    placeholder: "Spelling without special characters",
  },
  {
    name: "pronunciation",
    label: "Pronunciation (/pronunciation/)",
    type: "text",
    placeholder: "Pronunciation in phonemic transcription (/pronunciation/)",
  },
  {
    name: "alt_spelling",
    label: "Alternative Spelling",
    type: "text",
    placeholder: "Alternative Spelling",
  },
  {
    name: "etymology",
    label: "Etymology",
    type: "text",
    placeholder: "Etymology",
  },
];

const definitions = [
  {
    name: "part_of_speech",
    label: "Part of Speech",
    type: "text",
    placeholder: "Part of Speech",
  },
  {
    name: "meaning",
    label: "Meaning",
    type: "text",
    placeholder: "Meaning",
  },
  {
    name: "examples",
    label: "Examples",
    type: "text",
    placeholder: "Examples",
  },
  {
    name: "synonyms",
    label: "Synonyms",
    type: "text",
    placeholder: "Synonyms",
  },
];

const word = ref<Word>({
  term: "",
  pronunciation: "",
  etymology: "",
  definitions: [
    {
      part_of_speech: {
        name: "",
        id: "",
      },
      examples: [],
      synonyms: [],
      meaning: "",
      id: "",
      word_id: "",
      antonyms: [],
      order: null,
    },
  ],
  alt_spelling: "",
});

const dictStore = useDictStore();

function addDefinition() {
  if (word.value.definitions.length >= 3) return;

  word.value.definitions.push({
    part_of_speech: {
      name: "",
      id: "",
    },
    meaning: "",
    examples: [],
    synonyms: [],
    id: "",
    word_id: "",
    order: null,
    antonyms: [],
  });
}

function removeDefinition(index: number) {
  word.value.definitions.splice(index, 1);
}

const onSubmit = (values: Event) => {
  console.log("Form submitted!", values);
  dictStore.makeWord(word.value);
};

onMounted(async () => {
  parts_of_speech.value = await dictStore.fetchPartsOfSpeech();
});
</script>

<template>
  <main>
    <form @submit.prevent="onSubmit" class="grid md:grid-cols-12 gap-4 rounded-md border p-4">
      <div class="col-span-12 md:col-span-4">
        <h2 class="mb-4 text-2xl font-medium tracking-tight">Word</h2>
        <div :name="field.label" v-for="field in form_fields" class="mb-4">
          <label :for="field.name">{{ field.label }}</label>
          <input
            class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mb-4"
            :id="field.name"
            type="text"
            v-model="(word[field.name] as string)"
            :pattern="field.validation ? field.validation.regex.toString() : undefined"
            :placeholder="field.placeholder" />
        </div>
      </div>
      <div class="col-span-12 md:col-span-8">
        <div class="flex justify-between mb-4">
          <h2 class="mb-4 text-2xl font-medium tracking-tight">Definitions</h2>
          <Button class="bg-transparent text-dark border shadow-none hover:bg-gray-100" @click="addDefinition">Add Definition</Button>
        </div>

        <div>
          <div class="rounded border p-4 mb-4" v-for="(d, definitionIndex) in word.definitions">
            <div class="flex relative mb-2">
              <div
                v-if="word.definitions.length > 1"
                @click="removeDefinition(definitionIndex)"
                class="hover:text-red-700 hover:bg-red-100 cursor-pointer -top-6 rounded-full leading-none w-6 h-6 bg-gray-200 flex items-center justify-center absolute -right-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="m13.41 12l4.3-4.29a1 1 0 1 0-1.42-1.42L12 10.59l-4.29-4.3a1 1 0 0 0-1.42 1.42l4.3 4.29l-4.3 4.29a1 1 0 0 0 0 1.42a1 1 0 0 0 1.42 0l4.29-4.3l4.29 4.3a1 1 0 0 0 1.42 0a1 1 0 0 0 0-1.42Z" />
                </svg>
              </div>
              <div class="inline-flex w-4 h-4 bg-slate-200 -top-3 absolute rounded-full mr-2 text-xs items-center justify-center text-center">
                {{ definitionIndex + 1 }}
              </div>
            </div>
            <div name="definition.label" v-for="definition in definitions" class="mb-4">
              <label :for="definition.name">{{ definition.label }}</label>

              <Input
                v-if="definition.name !== 'examples' && definition.name !== 'synonyms' && definition.name !== 'part_of_speech'"
                type="text"
                v-model="word.definitions[definitionIndex][definition.name]"
                :placeholder="definition.placeholder"
                class="mb-4" />
              <div v-if="definition.name === 'examples'">
                <div v-for="(example, exampleIndex) in word.definitions[definitionIndex].examples" class="flex items-center mb-2">
                  <Input type="text" v-model="word.definitions[definitionIndex].examples[exampleIndex].sentence" placeholder="Example sentence" class="mb-4 mr-2" />
                  <button type="button" class="text-red-500 hover:text-red-700" @click="word.definitions[definitionIndex].examples.splice(exampleIndex, 1)">Remove</button>
                </div>
                <Button
                  variant="outline"
                  @click="
                    word.definitions[definitionIndex].examples.push({
                      sentence: '',
                    })
                  "
                  >Add Example</Button
                >
              </div>

              <div v-if="definition.name === 'part_of_speech'">
                <select
                  v-model="word.definitions[definitionIndex].part_of_speech"
                  class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mb-4">
                  <option v-for="part_of_speech in parts_of_speech" :value="part_of_speech">
                    {{ part_of_speech.name }}
                  </option>
                </select>
              </div>
              <div v-if="definition.name === 'synonyms'">
                <div v-for="(synonym, synonymIndex) in word.definitions[definitionIndex].synonyms" class="flex items-center mb-2">
                  <Input type="text" v-model="word.definitions[definitionIndex].synonyms[synonymIndex].synonym" placeholder="Synonym" class="mb-4 mr-2" />
                  <button type="button" class="text-red-500 hover:text-red-700" @click="word.definitions[definitionIndex].synonyms.splice(synonymIndex, 1)">Remove</button>
                </div>
                <Button
                  variant="outline"
                  @click="
                    word.definitions[definitionIndex].synonyms.push({
                      synonym: '',
                    })
                  "
                  >Add Synonym</Button
                >
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end mt-4">
          <Button type="submit">Save</Button>
        </div>
      </div>
    </form>
  </main>
</template>
