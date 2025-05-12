  // ETA in minutes
  export function getETA(distanceKm: number, speedKmh: number): number | null {
    if (speedKmh > 0) {
      const hours = distanceKm / speedKmh;
      return Math.round(hours * 60);
    }
    return null;
  }