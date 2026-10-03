import { defineEventHandler } from 'h3';

interface NasaApodResponse {
  media_type: 'image' | 'video' | string;
    [key: string]: unknown;
}

const defaultResponse = { media_type: 'default' };

export default defineEventHandler(async (event) => {
  // Use useRuntimeConfig to access environment variables
  const config = useRuntimeConfig(event);
  const apiKey = config.nasaKey;

  // Handle missing API key
  if (!apiKey) {
    console.error('Error: NASA_KEY environment variable is not set.');
    // Return a sensible fallback
    return null;
  }

  const nasaApiUrl = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}&hd=true`;

  try {
    // Fetch data from NASA APOD API
    const apodResponse = await $fetch<NasaApodResponse>(nasaApiUrl);

    // If the media type is 'image', return the full response
    if (apodResponse.media_type === 'image') {
      return apodResponse;
    } else {
      // Otherwise, return the default object
      return defaultResponse;
    }
  } catch (error) {
    // Log the error on the server and return a fallback value
    console.error('Error fetching data from NASA APOD API:', error);
    return null;
  }
});
