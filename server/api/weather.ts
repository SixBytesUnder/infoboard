import { defineEventHandler } from 'h3';

export default defineEventHandler(async (event) => {
  const config = useAppConfig();

  const { apiKey, latitude, longitude, fields, timesteps, units } = config.infoboard.weather;

  const location = `${latitude},${longitude}`;

  const url = `https://api.tomorrow.io/v4/timelines?location=${location}&fields=${fields.join('&')}&timesteps=${timesteps.join('&')}&units=${units}`;

  try {
    const response = await fetch(url, {
      headers: {
        'apikey': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch weather data: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return {
      error: 'Failed to fetch weather data',
    };
  }
});
