import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const skip = (page - 1) * limit
  const headers = new Headers();
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  try {
    const buses = await prisma.miniBus.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        plateNumber: true,
        driver: true,
        device: {
          select: {
            id: true,
            accelTopic: true,
            gpsData: {
              orderBy: { timestamp: 'desc' },
              take: 1, // Only fetch latest GPS data
              select: {
                lat: true,
                lon: true,
                timestamp: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json({ buses }, { status: 200, headers })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500, headers })
  }
}