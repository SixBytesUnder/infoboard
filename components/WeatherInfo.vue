<template>
  <div class="weather-container">
    <p>Weather in {{ weather.city }}</p>
    <p>{{ weather.temperature }}°C, {{ weather.description }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const weather = ref({
  city: 'New York',
  temperature: 22,
  description: 'Partly cloudy',
});
</script>

<style scoped>
.weather-container {
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}
</style>
