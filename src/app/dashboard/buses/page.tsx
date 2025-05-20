'use client'

import { useEffect, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AddBusDialog } from '@/components/dialogs/AddBusDialog'
import useSWR from 'swr'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

type GPSData = {
  lat: number
  lon: number
  speed: number
  direction: number
  altitude: number
  timestamp: string
}

type MiniBus = {
  id: string
  plateNumber: string
  model?: string
  driver?: string
  conductor?: string
  capacity: number
  device: {
    id: string,
    gpsData: GPSData[]
  },
  createdAt: string
  updatedAt: string
}

export default function MiniBusesPage() {
  const session = useSession()
  const userId = session.data?.user.id
  const {data: miniBuses, isLoading} = useSWR(userId? "get-minibuses" : null, GetMiniBuses)

  async function GetMiniBuses(){
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mini-bus?userId=${userId}&limit=5`)
      const data = await response.json()

      return data
    } catch (error) {
      console.log(error)
      return null
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mini-Buses</h1>
        <AddBusDialog />
        {/* <Button className='text-white'>Add Bus</Button> */}
      </div>
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Registered Mini-Buses</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plate Number</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Conductor</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Last Location</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Trip Logs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {miniBuses?.map((bus: MiniBus) => {
                  const latestGPS = bus.device?.gpsData?.[bus.device.gpsData.length - 1]
                  const googleMapsLink = latestGPS
                    ? `https://www.google.com/maps?q=${latestGPS.lat},${latestGPS.lon}`
                    : null

                  return (
                    <TableRow key={bus.id}>
                      <TableCell>{bus.plateNumber}</TableCell>
                      <TableCell>{bus.model || '-'}</TableCell>
                      <TableCell>{bus.driver || '-'}</TableCell>
                      <TableCell>{bus.conductor || '-'}</TableCell>
                      <TableCell>{bus.capacity}</TableCell>
                      <TableCell>
                        {googleMapsLink ? (
                          <a
                          href={googleMapsLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                          >
                            View on Map
                          </a>
                        ) : (
                          'No data'
                        )}
                      </TableCell>
                      <TableCell>
                        {latestGPS
                          ? new Date(latestGPS.timestamp).toLocaleString()
                          : new Date(bus.createdAt).toLocaleString()}
                      </TableCell>
                      {bus.device && <TableCell><Link href={`/dashboard/buses/trip-logs/${bus.device?.id}`} className='text-primary hover:underline'>View Trips</Link></TableCell>}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>)}
    </div>
  )
}
