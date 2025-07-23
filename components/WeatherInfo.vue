<template>
  <div v-if="weatherData" class="weather-container">
    <p>Weather in {{ weather.city }}</p>
    <p>{{ weather.temperature }}°C, {{ weather.description }}</p>
  </div>
  <div v-else>
    <p>Loading weather...</p>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const weather = ref({
  city: 'Loading...',
  temperature: 0,
  description: 'Loading...',
});

const weatherData = ref(null);

const fetchWeather = async () => {
  try {
    const response = await fetch('/api/weather');
    if (!response.ok) {
      throw new Error('Failed to fetch weather data');
    }
    const data = await response.json();
    weatherData.value = data;
    const current = data.data.timelines[0].intervals[0].values;
    weather.value = {
      city: 'Your Location', // The API doesn't provide city name, so using a placeholder
      temperature: Math.round(current.temperature),
      description: 'Weather description not available', // Placeholder
    };
  } catch (error) {
    console.error(error);
    weather.value.city = 'Error';
    weather.value.description = 'Could not load weather data.';
  }
};

onMounted(() => {
  fetchWeather();
  const config = useRuntimeConfig();
  const refreshInterval = parseInt(config.public.infoboard.weather.refresh, 10) || 600000; // Default to 10 minutes
  setInterval(fetchWeather, refreshInterval);
});
</script>

<style scoped>
.weather-container {
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 8px;
}
</style>
