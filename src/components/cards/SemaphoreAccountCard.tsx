"use client"
import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import useSWR from "swr"
import { useSession } from "next-auth/react"
import { useSemaphoreAccountStore } from "@/lib/store/semaphore"

export function SemaphoreAccountCard() {
  const {data: session} = useSession()
  const user = session?.user
  const userId = session?.user.id
  const {data, isLoading} = useSWR(userId? 'getSemaphoreAccount' : null, GetSemaphoreAccount, {
    refreshInterval: 35000
  })

  async function GetSemaphoreAccount() {
    try {
      if(user?.semaphoreKey?.key){
        const response = await fetch(`/api/semaphore?key=${user?.semaphoreKey?.key}`)
        const data = await response.json()
        return data
      }else{
        return null
      }
    } catch (error) {
      console.log(error)
      return null
    }
  }
  
  return (
    <Card className="w-[350px] h-full">
      <CardHeader>
        <CardTitle>Semaphore Account</CardTitle>
        <CardDescription></CardDescription>
      </CardHeader>
      <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Account Name</Label>
              <Input value={data?.account_name? data.account_name : null} readOnly />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Status</Label>
              <Input value={data?.status? data.status : null} readOnly />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Credit Balance</Label>
              <Input value={(data?.credit_balance?.toString())? (data.credit_balance?.toString()) : null} readOnly />
            </div>
          </div>
      </CardContent>
    </Card>
  )
}
