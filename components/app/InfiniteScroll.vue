<script lang="ts" setup>

const emit = defineEmits(['refresh'])

const target = ref<Element | null>(null);
const options = {
  root: null,
  rootMargin: "0px",
  threshold: 0.1,
};
const observer = ref<IntersectionObserver | null>(null);


function handleIntersection(entries: IntersectionObserverEntry[]) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      emit('refresh');
    }
  });
}

function startObserver() {
  target.value = document.querySelector("#bottom-of-page");
  observer.value = new IntersectionObserver(handleIntersection, options);
  if (target.value) {
    observer.value.observe(target.value);
  }
}


onMounted(async () => {
  startObserver();
});
</script>


<template>
  <div id="bottom-of-page"></div>
</template>