<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    /** When false, sentinel is not observed (use to avoid racing parent mount / scroll restore). */
    enabled?: boolean;
  }>(),
  { enabled: true },
);

const emit = defineEmits(["refresh"]);

const target = ref<Element | null>(null);
const options = {
  root: null,
  rootMargin: "320px 0px",
  threshold: 0.1,
};
const observer = ref<IntersectionObserver | null>(null);

function handleIntersection(entries: IntersectionObserverEntry[]) {
  if (!props.enabled) return;
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      emit("refresh");
    }
  });
}

function startObserver() {
  observer.value?.disconnect();
  observer.value = null;
  if (!props.enabled) {
    target.value = null;
    return;
  }
  target.value = document.querySelector("#bottom-of-page");
  observer.value = new IntersectionObserver(handleIntersection, options);
  if (target.value) {
    observer.value.observe(target.value);
  }
}

watch(
  () => props.enabled,
  () => {
    nextTick(() => startObserver());
  },
  { flush: "post" },
);

onMounted(() => {
  nextTick(() => startObserver());
});

onBeforeUnmount(() => {
  observer.value?.disconnect();
});
</script>

<template>
  <div id="bottom-of-page"></div>
</template>
