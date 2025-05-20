import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function GET(req: Request){
    const url = new URL(req.url)
    const params = new URLSearchParams(url.search)
    const userId = params.get('userId') as string
    const headers = new Headers();
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    try {
        const devices = await prisma.device.findMany({
            where: {
                userId
            },
            include: {
                assignedBus: true
            }
        })

        return NextResponse.json(devices, {status: 200, headers})
    } catch (error) {
        console.log(error)
        return NextResponse.json(error)
    }
}