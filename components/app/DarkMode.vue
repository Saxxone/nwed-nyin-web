<script setup lang="ts">
const isDarkMode = ref(false);

if (import.meta.client) {
  try {
    const storedDarkMode = localStorage.getItem("darkMode");
    if (storedDarkMode !== null) {
      isDarkMode.value = JSON.parse(storedDarkMode) === true;
    }
  } catch {
    /* ignore invalid stored value */
  }
}

onMounted(() => {
  applyDarkMode();
});

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
};

const applyDarkMode = () => {
  if (isDarkMode.value) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
};

watch(isDarkMode, (newValue) => {
  localStorage.setItem("darkMode", JSON.stringify(newValue));
  applyDarkMode();
});
</script>

<template>
  <div class="flex justify-end items-center mb-2">
    <div
      class="flex justify-end gap-x-1 items-center rounded-full"
      @click="toggleDarkMode"
    >
      <div
        class="cursor-pointer rounded-full p-2"
        :class="{ 'bg-base-white': !isDarkMode }"
      >
        <IconsSunIcon width="12" height="12" />
      </div>
      <div
        class="cursor-pointer rounded-full p-2"
        :class="{ 'bg-base-white': isDarkMode }"
      >
        <IconsMoonIcon width="12" height="12" />
      </div>
    </div>
  </div>
</template>
