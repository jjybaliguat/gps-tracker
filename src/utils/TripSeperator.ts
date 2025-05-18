type GPSData = {
  id: string;
  devId: string;
  lat: number;
  lon: number;
  speed: number;
  direction: number;
  altitude: number;
  timestamp: string | Date;
};

type Route = {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
};

const THRESHOLD = 100; // meters

export function separateTrips(gpsLogs: GPSData[], route: Route | null | undefined): GPSData[][] {
  const trips: GPSData[][] = [];
  let currentTrip: GPSData[] = [];
  let direction: 'forward' | 'reverse' | null = null;

  // Ensure sorted logs
  const sortedLogs = gpsLogs.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  if(route){
    for (const log of sortedLogs) {
      const distToStart = haversine(log.lat, log.lon, route.startLat, route.startLng);
      const distToEnd = haversine(log.lat, log.lon, route.endLat, route.endLng);
  
      // Begin trip
      if (currentTrip.length === 0) {
        if (distToStart < THRESHOLD) {
          direction = 'forward';
          currentTrip.push(log);
        } else if (distToEnd < THRESHOLD) {
          direction = 'reverse';
          currentTrip.push(log);
        }
      } else {
        currentTrip.push(log);
  
        // End trip if we reached the opposite terminal
        if (
          (direction === 'forward' && distToEnd < THRESHOLD) ||
          (direction === 'reverse' && distToStart < THRESHOLD)
        ) {
          trips.push([...currentTrip]);
          currentTrip = [];
          direction = null;
        }
      }
    }
  }

  return trips;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
