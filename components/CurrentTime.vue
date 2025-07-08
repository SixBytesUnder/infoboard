<template>
  <div class="container">
    <div class="time">{{ time }}</div>
    <div class="date">{{ date }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// Use the new app config composable, which is type-safe
const appConfig = useAppConfig();

// Get the settings from the structured config
const locale = appConfig.infoboard.dateTime.locale;
const timeOptions = appConfig.infoboard.dateTime.time;
const dateOptions = appConfig.infoboard.dateTime.date;

const time = ref(new Date().toLocaleTimeString(locale, timeOptions));
const date = ref(new Date().toLocaleDateString(locale, dateOptions));

let intervalId;

onMounted(() => {
  intervalId = setInterval(() => {
    const now = new Date();
    time.value = now.toLocaleTimeString(locale, timeOptions);
    date.value = now.toLocaleDateString(locale, dateOptions);
  }, 1000);
});

onUnmounted(() => {
  clearInterval(intervalId);
});
</script>

<style scoped>
.container {
}
.time {
  font-size: 5rem;
}
.date {
  font-size: 1.5rem;
}
</style>
