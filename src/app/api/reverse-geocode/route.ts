import { NextResponse } from "next/server";

// /pages/api/reverse-geocode.ts
export async function GET(req: Request) {
    const url = new URL(req.url)
    const params = new URLSearchParams(url.search)
    const lat = params.get('lat') as string
    const lon = params.get('lon') as string

  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`, {
    headers: {
      "User-Agent": "MinibusTracker (justinejeraldbaliguat@gmail.com)" // required
    }
  });

  const data = await response.json();
  console.log(data)
  return NextResponse.json(data, {status: 200})
}
