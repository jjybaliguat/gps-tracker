"use client"

import React, { useEffect, useRef, useState } from 'react'
import mqtt from "mqtt";
import useSWR from 'swr';
import { Device } from '@/types/Device';
import Image from 'next/image';
import { getDistanceFromLatLonInKm } from '@/utils/getDistanceFromLatLonInKM';
import { reverseGeocode } from '@/utils/reverseGeocode';

interface NearbyBusesProps {
  id: string,
  name: string,
  assignedBus: {
    plateNumber: string,
    driver: string,
    conductor: string,
    capacity: number
  },
  speed: number,
  lat: number,
  lon: number,
  eta?: number,
  locationText?: string | null
  direction?: "Approaching" | "Moving away" | null
}

const NearbyBuses = () => {
  const { data: devices } = useSWR('getDevices', GetDevices)
  const [nearbyBuses, setNearbyBuses] = useState<NearbyBusesProps[] | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const timeouts = new Map<string, NodeJS.Timeout>();
  const lastDistances = new Map<string, number>();
  const lastLocationFetchRef = useRef<Map<string, number>>(new Map());
  const FETCH_INTERVAL_MS = 30_000; // 30 seconds

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        },
        (err) => {
          console.error("Geolocation error:", err);
        }
      );
    }
  }, []);

  async function GetDevices() {
    try {
      const response = await fetch(`/api/device/get-all`)
      const data = await response.json()
      return data
    } catch (error) {
      console.log(error)
      return null
    }
  }

  // Fetch reverse geocoded location
  const fetchLocationText = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);
      const data = await response.json()
      console.log(data)
      return data ?? "Unknown location";
    } catch (error) {
      console.error("Geocoding failed:", error);
      return "Error fetching location";
    }
  };

  useEffect(() => {
    const client = mqtt.connect(process.env.NEXT_PUBLIC_MQTT_BROKER_URL || '', {
      username: process.env.NEXT_PUBLIC_MQTT_USER,
      password: process.env.NEXT_PUBLIC_MQTT_PASS,
      reconnectPeriod: 1000,
      clean: true
    });

    client.on("connect", () => {
      console.log("Connected to MQTT broker");
      devices?.map((device: Device) => {
        client.subscribe(device.gpsTopic, (err) => {
          if (!err) {
            console.log(`Subscribed to ${device.gpsTopic}`);
          } else {
            console.error("Subscription error:", err);
          }
        });
      });
    });

    client.on("message", (topic, payload) => {
      const msg = payload?.toString();

      devices?.forEach(async (device: Device) => {
        if (topic === device.gpsTopic) {
          try {
            const data = JSON.parse(msg);
            if (data.lat && data.lon) {
              const now = Date.now();
              const lastFetched = lastLocationFetchRef.current.get(device.id) || 0;

              let locationText: string | null = null;

              if (now - lastFetched > FETCH_INTERVAL_MS) {
                // Update timestamp
                lastLocationFetchRef.current.set(device.id, now);
                locationText = await fetchLocationText(data.lat, data.lon);
              }

              if (timeouts.has(device.id)) {
                clearTimeout(timeouts.get(device.id)!);
              }
              timeouts.set(
                device.id,
                setTimeout(() => {
                  setNearbyBuses((prev) => (prev ?? []).filter((bus) => bus.id !== device.id));
                  timeouts.delete(device.id);
                }, 3000)
              );

              const currentDistance = userLocation
                ? getDistanceFromLatLonInKm(userLocation.lat, userLocation.lon, data.lat, data.lon)
                : null;

              let direction: "Approaching" | "Moving away" | null = null;

              if (currentDistance !== null) {
                const last = lastDistances.get(device.id);
                if (last !== undefined) {
                  direction = currentDistance < last ? "Approaching" : "Moving away";
                }
                lastDistances.set(device.id, currentDistance);
              }

              let eta: number | undefined;
              if (userLocation && data.speed && data.speed > 1 && currentDistance !== null) {
                const speedInKmPerMin = data.speed / 60;
                eta = speedInKmPerMin > 0 ? +(currentDistance / speedInKmPerMin).toFixed(2) : undefined;
              }

              setNearbyBuses((prev) => {
                const filtered = (prev ?? []).filter((bus) => bus.id !== device.id);
                const existing = (prev ?? []).find((bus) => bus.id === device.id);
                const updated = [
                  ...filtered,
                  {
                    id: device.id,
                    name: device.name,
                    assignedBus: device.assignedBus,
                    lat: data.lat,
                    lon: data.lon,
                    speed: data.speed,
                    eta,
                    direction,
                    locationText: locationText ?? existing?.locationText ?? "Fetching...",
                  },
                ];

                if (userLocation) {
                  updated.sort((a, b) => {
                    const distA = getDistanceFromLatLonInKm(userLocation!.lat, userLocation!.lon, a.lat, a.lon);
                    const distB = getDistanceFromLatLonInKm(userLocation!.lat, userLocation!.lon, b.lat, b.lon);
                    return distA - distB;
                  });
                }

                return updated;
              });
            } else {
              setNearbyBuses((prev) => (prev ?? []).filter((bus) => bus.id !== device.id));
            }
          } catch (e) {
            console.error("Invalid JSON received:", msg);
          }
        }
      });
    });

    return () => {
      client.end();
    };
  }, [devices]);

  return (
    <>
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Nearby Mini-Buses</h1>

        {nearbyBuses?.map((bus) => (
          <div
            key={bus?.id}
            className="flex items-center gap-4 p-4 rounded-xl shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition hover:shadow-lg"
          >
            <div className="relative h-14 w-14 shrink-0">
              <Image
                src="/bus2.png"
                alt="bus-icon"
                fill
                className="rounded-full object-cover object-center"
              />
            </div>

            <div className="flex flex-col text-sm text-gray-700 dark:text-gray-300 w-full">
              <div className="flex justify-between">
                <span className="font-semibold">{bus?.name}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{bus?.assignedBus?.plateNumber}</span>
              </div>

              <span>
                <span className="font-medium truncate">Location: {bus.locationText}</span>
              </span>
              <div className="mt-1 grid grid-cols-2 gap-1 text-xs text-gray-600 dark:text-gray-400">
                <span>
                  <span className="font-medium">Speed:</span> {bus.speed} km/h
                </span>
                {bus.speed < 2 ? (
                  <span className="col-span-2">
                    <span className="font-medium">Status:</span>{' '}
                    <span className="text-red-600 font-medium">Stopped</span>
                    <span className="ml-2">| ETA: Not moving</span>
                  </span>
                ) : (
                  <span className="col-span-2">
                    <span className="font-medium">ETA:</span>{' '}
                    {bus.eta !== null ? (
                      <span className="text-green-600 font-semibold">{bus.eta} min</span>
                    ) : (
                      "Unable to calculate"
                    )}
                  </span>
                )}

                {bus.direction && bus.speed > 2 && (
                  <span className="col-span-2">
                    <span className="font-medium">Direction:</span>{' '}
                    <span
                      className={
                        bus.direction === "Approaching"
                          ? "text-green-500 font-semibold"
                          : "text-yellow-500 font-semibold"
                      }
                    >
                      {bus.direction}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

    </>
  )
}

export default NearbyBuses
