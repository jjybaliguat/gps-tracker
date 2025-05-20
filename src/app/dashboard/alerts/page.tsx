'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card"
import { AlertTriangle, MapPin, GaugeCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import useSWR from "swr"
import { useSession } from "next-auth/react"
import { Alert } from "@/types/Alert"

export default function AlertsPage() {
  const session = useSession()
  const user = session.data?.user
  const {data: alerts, isLoading, error} = useSWR(user? 'getAlerts' : null, GetAlerts)

  async function GetAlerts() {
    try {
      const response = await fetch(`/api/alerts`,{
        cache: "no-store"
      })

      const data = await response.json()
      // console.log(data)
      return data
    } catch (error) {
      console.log(error)
      return null
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Mini-Bus Alerts</h1>

      <Tabs defaultValue="emergency" className="w-full">
        <TabsList className="bg-muted rounded-lg">
          <TabsTrigger value="emergency">
            <AlertTriangle className="w-4 h-4 mr-1 text-red-500" />
            Emergency
          </TabsTrigger>
          {/* <TabsTrigger value="geofencing">
            <MapPin className="w-4 h-4 mr-1 text-green-500" />
            Geofencing
          </TabsTrigger> */}
          <TabsTrigger value="overspeeding">
            <GaugeCircle className="w-4 h-4 mr-1 text-yellow-500" />
            Overspeeding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="emergency" className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              Loading alerts...
            </div>
          ) : error || !alerts ? (
            <div className="flex items-center justify-center py-8 text-red-500 text-sm">
              Failed to load alerts. Please try again.
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-600 dark:text-gray-400 text-sm">
              No alerts found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {alerts
                .filter((alert: Alert) => alert.type === "EMERGENCY")
                .map((alert: Alert) => (
                  <Card key={alert.id} className="p-3 space-y-2 border-border shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold">Mini Bus {alert.device?.assignedBus?.plateNumber || "N/A"}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">{alert.message}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(alert.timestamp).toLocaleDateString()}
                        <span> {new Date(alert.timestamp).toLocaleTimeString()}</span>
                      </span>
                    </div>
                    <Link
                      href={alert.message.split(": ")[1]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4"
                    >
                      <Button variant="destructive" className="text-xs px-2 py-1 h-auto">
                        View Map
                      </Button>
                    </Link>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>


        {/* <TabsContent value="geofencing" className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts
            .filter((alert: Alert) => alert.type === "GEOFENCE_BREACH")
            .map((alert: Alert) => (
              <Card key={alert.id}>
                <CardHeader>
                  <CardTitle>Mini Bus 1</CardTitle>
                  <CardDescription>{alert.message}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="text-white">View Bus Realtime Location</Button>
                </CardContent>
              </Card>
            ))}
        </TabsContent> */}
        <TabsContent value="overspeeding" className="pt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
              Loading alerts...
            </div>
          ) : error || !alerts ? (
            <div className="flex items-center justify-center py-8 text-red-500 text-sm">
              Failed to load alerts. Please try again.
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-gray-600 dark:text-gray-400 text-sm">
              No alerts found.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {alerts
                .filter((alert: Alert) => alert.type === "OVERSPEEDING")
                .map((alert: Alert) => (
                  <Card key={alert.id} className="p-3 space-y-2 border-border shadow-sm">
                    <div className="flex justify-between items-start gap-2">
                      <div className="space-y-1 flex-1">
                        <h3 className="text-sm font-semibold leading-tight">
                          Mini Bus {alert.device?.assignedBus?.plateNumber || "N/A"}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {alert.message}
                        </p>
                      </div>
                      <div className="text-right text-xs text-muted-foreground whitespace-nowrap">
                        <div>{new Date(alert.timestamp).toLocaleDateString()}</div>
                        <div>{new Date(alert.timestamp).toLocaleTimeString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Link
                        href={`https://www.google.com/maps?q=${alert.lat},${alert.lon}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="text-xs px-2 py-1 h-auto bg-yellow-500 hover:bg-yellow-600">
                          View Map
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>

      </Tabs>
    </div>
  )
}
