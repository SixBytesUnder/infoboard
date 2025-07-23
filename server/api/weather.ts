import { defineEventHandler } from 'h3';

interface Interval {
  startTime: string;
  values: Record<string, unknown>;
}

interface Timeline {
  timestep: string;
  intervals: Interval[];
}

export default defineEventHandler(async () => {
  const config = useAppConfig();

  const { apiKey, latitude, longitude, fields, timesteps, units, timezone } = config.infoboard.weather;

  const location = `${latitude},${longitude}`;

  const url = 'https://api.tomorrow.io/v4/timelines';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        location,
        fields,
        timesteps,
        units,
        startTime: 'now',
        endTime: 'nowPlus5d',
        timezone,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch weather data: ${response.statusText}`);
    }

    const data = await response.json();

    // Find the hourly timeline in the response
    if (data.data && data.data.timelines) {
      const hourlyTimeline = data.data.timelines.find((t: Timeline) => t.timestep === '1h');

      // If found, find the interval closest to the current time.
      if (hourlyTimeline && hourlyTimeline.intervals && hourlyTimeline.intervals.length > 0) {
        const now = new Date();
        const futureIntervals = hourlyTimeline.intervals.filter(
          (interval: Interval) => new Date(interval.startTime) > now
        );

        if (futureIntervals.length > 0) {
          // The first future interval is the one we want.
          hourlyTimeline.intervals = [futureIntervals[0]];
        } else if (hourlyTimeline.intervals.length > 0) {
          // As a fallback, if no future intervals exist, use the last available interval.
          hourlyTimeline.intervals = [hourlyTimeline.intervals[hourlyTimeline.intervals.length - 1]];
        }
      }
    }

    return data;
  } catch (error) {
    console.error(error);
    return {
      error: 'Failed to fetch weather data',
    };
  }
});
