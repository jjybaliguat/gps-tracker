import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient()

export async function GET(req: Request){
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

        return NextResponse.json(alerts, {status: 200})
    } catch (error) {
        console.log(error)
        return NextResponse.json({message: "Internal Server Error"}, {status: 500})
    }
}