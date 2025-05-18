
import { separateTrips } from "@/utils/TripSeperator";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = new URLSearchParams(url.search);
  const devId = params.get("devId") as string;
  const range = params.get("range") || 0;

  const now = new Date();
  let startTime: Date;
  let endTime: Date;

  startTime = new Date(now);
  startTime.setDate(now.getDate() - Number(range));
  startTime.setHours(0, 0, 0, 0);
  endTime = new Date(now);
  endTime.setDate(now.getDate() - Number(range));
  endTime.setHours(23, 59, 59, 999);

  if (!devId) {
    return NextResponse.json({message: "Missing Required field"}, {status: 400})
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
        }
      }
    })

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
    // console.log(routelogs)
    const separatedGpsLogs = separateTrips(routelogs, device?.user?.route)

    // console.log(separatedGpsLogs)

    return NextResponse.json(separatedGpsLogs, {status: 200})
  } catch (error) {
    console.error("Error fetching GPS logs:", error);
    return NextResponse.json({error: "Internal Server Error"}, {status: 500})
  }
}
