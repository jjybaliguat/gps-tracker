import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient()
export const dynamic = 'force-dynamic';

export async function GET(req: Request){
    const headers = new Headers();
    headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    try {
        const alerts = await prisma.alert.findMany({
            include: {
                device: {
                    include: {
                        assignedBus: true
                    }
                }
            }
        })

        return NextResponse.json(alerts, {status: 200, headers})
    } catch (error) {
        console.log(error)
        return NextResponse.json({message: "Internal Server Error"}, {status: 500, headers})
    }
}