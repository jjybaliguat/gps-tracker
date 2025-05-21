import { separateTrips } from "@/utils/TripSeperator";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
import { DateTime } from "luxon";

const prisma = new PrismaClient();
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const headers = new Headers();
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  const url = new URL(req.url);
  const params = new URLSearchParams(url.search);
  const devId = params.get("devId") as string;
  const range = params.get("range") || "0";

  const zone = "Asia/Manila";
  const rangeNumber = Number(range);

  // Calculate start and end time for the day in Asia/Manila timezone
  const startTime = DateTime.now().setZone(zone).minus({ days: rangeNumber }).startOf("day").toJSDate();
  const endTime = DateTime.now().setZone(zone).minus({ days: rangeNumber }).endOf("day").toJSDate();

  if (!devId) {
    return NextResponse.json({ message: "Missing Required field" }, { status: 400, headers });
  }

  try {
    const device = await prisma.device.findUnique({
      where: {
        id: devId
      },
      include: {
        user: {
          include: {
            route: true
          }
        },
        assignedBus: true
      }
    });

    const routelogs = await prisma.gPSData.findMany({
      where: {
        device: { id: devId },
        timestamp: {
          gte: startTime,
          lte: endTime,
        },
      },
      orderBy: { timestamp: "asc" },
    });

    const separatedGpsLogs = separateTrips(routelogs, device?.user?.route);

    return NextResponse.json({separatedGpsLogs, device: device}, { status: 200, headers });
  } catch (error) {
    console.error("Error fetching GPS logs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers });
  }
}
