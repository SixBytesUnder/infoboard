import { defineEventHandler } from 'h3';

interface LineStatus {
  name: string;
  lineStatuses: {
    statusSeverity: number;
    statusSeverityDescription: string;
  }[];
}

interface TubeStatus {
  [key: string]: LineStatus;
}

interface BusArrival {
  [key: string]: {
    [key: string]: (string | number)[];
  };
}

interface ApiResponse {
  tube: TubeStatus;
  buses: BusArrival;
}

export default defineEventHandler(async (): Promise<ApiResponse> => {
  const appId = process.env.TFL_APP_ID;
  const appKey = process.env.TFL_APP_KEY;
  const modes = process.env.TFL_MODES?.split(',') || ['tube', 'dlr'];
  const busStops = process.env.TFL_BUS_STOPS?.split(',') || [];

  const tubeStatus: TubeStatus = {};
  const buses: BusArrival = {};

  // Fetch Line Status
  if (modes.length > 0) {
    const url = `https://api.tfl.gov.uk/Line/Mode/${modes.join(',')}/Status?app_id=${appId}&app_key=${appKey}`;
    const response = await fetch(url);
    const data = await response.json();

    for (const line of data) {
      tubeStatus[line.id] = {
        name: line.name,
        lineStatuses: line.lineStatuses.map((status: { statusSeverity: number; statusSeverityDescription: string }) => ({
          statusSeverity: status.statusSeverity,
          statusSeverityDescription: status.statusSeverityDescription,
        })),
      };
    }
  }

  // Fetch Bus Arrivals
  if (busStops.length > 0) {
    for (const stopId of busStops) {
      const url = `https://api.tfl.gov.uk/StopPoint/${stopId}/Arrivals?app_id=${appId}&app_key=${appKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.length > 0) {
        const stopName = `${data[0].stationName} ↦ ${data[0].destinationName}`;
        if (!buses[stopName]) {
          buses[stopName] = {};
        }

        for (const arrival of data) {
          const lineName = arrival.lineName;
          if (!buses[stopName][lineName]) {
            buses[stopName][lineName] = [];
          }
          const arrivalTime = Math.floor(arrival.timeToStation / 60);
          buses[stopName][lineName].push(arrivalTime === 0 ? 'Due' : arrivalTime);
        }
      }
    }
  }

  // Sort bus arrival times
  for (const stop in buses) {
    for (const line in buses[stop]) {
      buses[stop][line].sort((a, b) => {
        if (a === 'Due') return -1;
        if (b === 'Due') return 1;
        return (a as number) - (b as number);
      });
    }
  }

  return {
    tube: tubeStatus,
    buses,
  };
});
