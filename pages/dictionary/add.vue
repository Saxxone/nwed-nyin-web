<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast/use-toast";
import { useDictStore } from "~/store/dictionary";
import type { PartOfSpeech, Word } from "~/types/word";
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
const textArea = ref<NodeListOf<HTMLTextAreaElement>>();
const select = ref<NodeListOf<HTMLSelectElement>>();
const form = ref<HTMLFormElement>();

const parts_of_speech = ref<PartOfSpeech[]>([]);
const form_fields = [
  {
    name: "term",
    label: "Word",
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
const base_word = {
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
};
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

async function onSubmit() {
  try {
    disbaleForm();
    const form_data = { ...word.value, term: word.value.term.toLowerCase() };
    if (route.query.action === "edit" && route.query.word && word.value.id) {
      const res = await dictStore.updateWord(word.value.id, form_data);
      router.replace(
        app_routes.dictionary.view(
          encodeURI(form_data.term) as string,
          res.id as string,
        ),
      );
    } else {
      await dictStore.makeWord(form_data);
      toast({
        title: `${form_data.term} added to dictionary`,
        description: "Keep going 📝",
      });
    }
    form.value?.reset();
    word.value = {} as Word;
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
  textArea.value?.forEach((textArea) => {
    textArea.disabled = true;
  });
  select.value?.forEach((select) => {
    select.disabled = true;
  });
}

function enableForm() {
  inputs.value?.forEach((input) => {
    input.disabled = false;
  });
  buttons.value?.forEach((button) => {
    button.disabled = false;
  });
  textArea.value?.forEach((textArea) => {
    textArea.disabled = false;
  });
  select.value?.forEach((select) => {
    select.disabled = false;
  });
}

onMounted(async () => {
  parts_of_speech.value = await dictStore.fetchPartsOfSpeech();
  if (route.query.action === "edit" && route.query.word) {
    disbaleForm();
    word.value = await dictStore.fetchWord(
      decodeURI(route.query.word as string),
      decodeURI(route.query.id as string),
    );
    enableForm();
  }
  bindForm();
});

function bindForm() {
  inputs.value = document.querySelectorAll("input");
  buttons.value = document.querySelectorAll("button");
  textArea.value = document.querySelectorAll("textarea");
  select.value = document.querySelectorAll("select");
  form.value = document.getElementById("add-form") as HTMLFormElement;
}
</script>

<template>
  <main>
    <form
      ref="form"
      id="add-form"
      @submit.prevent="onSubmit"
      class="grid card grid-cols-12 gap-4 rounded-lg border p-4"
    >
      <div class="col-span-12 md:col-span-4">
        <h2
          class="mb-4 text-2xl flex items-center font-medium tracking-tight capitalize"
        >
          <span v-if="word?.term && route.query.action === 'edit'"
            >Edit: {{ word?.term.toLowerCase() }}</span
          >
          <span v-else>Add a new word </span>
          <NuxtLink
            :to="
              app_routes.dictionary.add_sound(
                encodeURI(word.term),
                encodeURI(word.id),
              )
            "
            v-if="!word.sound && word.id"
            class="p-2 mt-1 text-blue-500 inline-block"
          >
            <IconsMicrophoneIcon width="16" height="16" />
          </NuxtLink>
        </h2>
        <div :name="field.label" v-for="field in form_fields" class="mb-4">
          <label :for="field.name" class="mb-2">{{ field.label }}</label>
          <input
            class="input"
            :id="field.name"
            type="text"
            v-model.trim="word[field.name] as string"
            :placeholder="field.placeholder"
          />
        </div>
      </div>
      <div class="col-span-12 md:col-span-8">
        <div class="flex justify-between mb-4">
          <h2 class="mb-4 text-2xl font-medium tracking-tight">Definitions</h2>
          <Button variant="outline" type="button" @click="addDefinition"
            >Add Definition</Button
          >
        </div>

        <div>
          <div
            class="rounded-lg border p-4 mb-4"
            v-for="(_, definitionIndex) in word.definitions"
          >
            <div class="flex relative mb-2">
              <div
                v-if="word.definitions.length > 1"
                @click="removeDefinition(definitionIndex)"
                class="hover:text-red-700 hover:bg-red-100 cursor-pointer -top-6 rounded-full leading-none w-6 h-6 bg-gray-200 flex text-gray-900 items-center justify-center absolute -right-6"
              >
                <IconsCloseIcon width="16" height="16" />
              </div>
              <div
                class="inline-flex w-4 h-4 bg-base-light text-main -top-3 absolute rounded-full mr-2 text-xs items-center justify-center text-center"
              >
                {{ definitionIndex + 1 }}
              </div>
            </div>
            <div
              name="definition.label"
              v-for="definition in definitions"
              class="mb-4"
            >
              <label :for="definition.name">{{ definition.label }}</label>

              <Input
                v-if="
                  definition.name !== 'examples' &&
                  definition.name !== 'synonyms' &&
                  definition.name !== 'part_of_speech'
                "
                type="text"
                v-model.trim="
                  word.definitions[definitionIndex][definition.name]
                "
                :placeholder="definition.placeholder"
                class="mb-4"
              />
              <div v-if="definition.name === 'examples'">
                <div
                  v-for="(example, exampleIndex) in word.definitions[
                    definitionIndex
                  ].examples"
                  class="flex items-center mb-2"
                >
                  <input
                    type="text"
                    v-model.trim="
                      word.definitions[definitionIndex].examples[exampleIndex]
                        .sentence
                    "
                    placeholder="Example sentence"
                    class="input mr-2"
                  />
                  <button
                    type="button"
                    class="text-red-500 hover:text-red-700"
                    @click="
                      word.definitions[definitionIndex].examples.splice(
                        exampleIndex,
                        1,
                      )
                    "
                  >
                    Remove
                  </button>
                </div>
                <Button
                  variant="outline"
                  type="button"
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
                  v-model.trim="
                    word.definitions[definitionIndex].part_of_speech
                  "
                  class="input"
                >
                  <option
                    v-for="part_of_speech in parts_of_speech"
                    :value="part_of_speech"
                  >
                    {{ part_of_speech.name }}
                  </option>
                </select>
              </div>
              <div v-if="definition.name === 'synonyms'">
                <div
                  v-for="(synonym, synonymIndex) in word.definitions[
                    definitionIndex
                  ].synonyms"
                  class="flex items-center mb-2"
                >
                  <input
                    class="input mr-2"
                    type="text"
                    v-model.trim="
                      word.definitions[definitionIndex].synonyms[synonymIndex]
                        .synonym
                    "
                    placeholder="Synonym"
                  />
                  <button
                    type="button"
                    class="text-red-500 hover:text-red-700"
                    @click="
                      word.definitions[definitionIndex].synonyms.splice(
                        synonymIndex,
                        1,
                      )
                    "
                  >
                    Remove
                  </button>
                </div>
                <Button
                  type="button"
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
