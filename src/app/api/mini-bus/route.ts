import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic';

export async function GET(req: Request){
    const headers = new Headers();
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    const url = new URL(req.url)
    const params = new URLSearchParams(url.search)
    const ownerId = params.get('userId') as string
    const limit = params.get('limit') as string
    
    if(!ownerId) {
        return NextResponse.json({message: "Missing Required Fields"}, {status: 400, headers})
    }
    try {
        const buses = await prisma.miniBus.findMany({
            where: {
                ownerId
            },
            include: {
                device: {
                    include: {
                        gpsData: {
                            orderBy: {
                                timestamp: 'desc'
                            },
                            take: limit? Number(limit) : 100.
                        }
                    }
                },
            }
        })

        return NextResponse.json(buses, {status: 200, headers})
    } catch (error) {
        console.log(error)
        return NextResponse.json({message: "Internal Server Error"}, {status: 500, headers})
    }
}

export async function POST(req: Request){
    const body = await req.json()
    const {plateNumber, capacity} = body
    const url = new URL(req.url)
    const params = new URLSearchParams(url.search)
    const ownerId = params.get('userId') as string

    if(!plateNumber || !capacity || !ownerId) {
        return NextResponse.json({message: "Missing Required Fields."}, {status: 400})
    }
    try {
        const bus = await prisma.miniBus.create({
            data: {
                ...body,
                ownerId
            }
        })

        return NextResponse.json(bus, {status: 201})
    } catch (error) {
        console.log(error)
        return NextResponse.json({message: "Internal Server Error"}, {status: 500})
    }
}