export function useNormalizeString(str: string) {
  return str
    .normalize("NFD") // Normalize for diacritics
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/\s+/g, "-") // Replace spaces with dashes
    .toLowerCase(); // Convert to lowercase
}

export function disbaleForm() {
  console.log(window);
  const inputs = ref<NodeListOf<HTMLInputElement>>();
  const buttons = ref<NodeListOf<HTMLButtonElement>>();
  inputs.value?.forEach((input) => {
    input.disabled = true;
  });
  buttons.value?.forEach((button) => {
    button.disabled = true;
  });
}


export function enableForm() {
  
  const inputs = ref<NodeListOf<HTMLInputElement>>();
  const buttons = ref<NodeListOf<HTMLButtonElement>>();
  inputs.value?.forEach((input) => {
    input.disabled = false;
  });
  buttons.value?.forEach((button) => {
    button.disabled = false;
  });
}