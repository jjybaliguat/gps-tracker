import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function GET(req: Request){
    const url = new URL(req.url)
    const params = new URLSearchParams(url.search)
    const ownerId = params.get('userId') as string
    
    if(!ownerId) {
        return NextResponse.json({message: "Missing Required Fields"}, {status: 400})
    }
    try {
        const buses = await prisma.miniBus.findMany({
            where: {
                ownerId
            },
            include: {
                device: true
            }
        })

        return NextResponse.json(buses, {status: 200})
    } catch (error) {
        console.log(error)
        return NextResponse.json({message: "Internal Server Error"}, {status: 500})
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