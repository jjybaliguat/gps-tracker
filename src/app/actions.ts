"use server"

import { decrypt } from "@/utils/secure-key"
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient()

export async function getMessages(apikey: string){
    try {
        const decryptedKey = decrypt(apikey);
        const response = await fetch(`https://api.semaphore.co/api/v4/messages?apikey=${decryptedKey}`);
        const messages = await response.json();

        // Sort messages by created_at from newest to oldest
        messages.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return messages;
    } catch (error) {
        console.log(error)
        return null
    }
}

export async function getTotalBuses(ownerId: string | null){
    if(!ownerId) return null
    try {
        const total = await prisma.miniBus.count({
            where: {
                ownerId
            }
        })

        return total
    } catch (error) {
        console.log(error)
        return null
    }
}
export async function getTotalDevices(ownerId: string | null){
    if(!ownerId) return null
    try {
        const total = await prisma.device.count({
            where: {
                userId: ownerId
            }
        })

        return total
    } catch (error) {
        console.log(error)
        return null
    }
}