export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'minibustracker/1.0' // Nominatim requires identifying header
      }
    });
    const data = await response.json();
    console.log(data)

    return data.display_name || null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}
