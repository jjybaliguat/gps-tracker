"use client"

import React, { useEffect, useRef, useState } from 'react'
import mqtt from "mqtt";
import useSWR, { mutate } from 'swr';
import { Device } from '@/types/Device';
import Image from 'next/image';
import { getDistanceFromLatLonInKm } from '@/utils/getDistanceFromLatLonInKM';
import { reverseGeocode } from '@/utils/reverseGeocode';
import { Button } from './ui/button';
import { useMap } from 'react-leaflet';
import { formatEtaMinutes } from '@/utils/formatETAMinutes';

interface NearbyBusesProps {
  id: string,
  name: string,
  deviceId: string,
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
  locationText?: string | null,
  passengerCount?: number,
  direction?: "Approaching" | "Moving away" | null
}

const NearbyBuses = ({devices, mapRef, mapContainerRef} : {devices: Device[], mapRef: any, mapContainerRef?: any}) => {
  const [nearbyBuses, setNearbyBuses] = useState<NearbyBusesProps[] | null>(null)
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const timeouts = new Map<string, NodeJS.Timeout>();
  const lastLocationFetchRef = useRef<Map<string, number>>(new Map());
  const FETCH_INTERVAL_MS = 30_000; // 30 seconds
  const lastDistancesSeries = new Map<string, number[]>(); // stores last few distances
  const lastDirectionCheckTimestamps = new Map<string, number>();
  const DIRECTION_CHECK_INTERVAL_MS = 3000; // 3 seconds
  const MAX_HISTORY = 5; // Keep last 5 distance records
  const DISTANCE_TREND_THRESHOLD = 0.01; // Minimum change in km (10 meters)
  // console.log(lastDistancesSeries)

 // Get current user location
  useEffect(() => {
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // console.log(position.coords.latitude)
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
        },
        (error) => console.error("Geolocation error:", error),
        { enableHighAccuracy: true }
      );
    }, 1000); // every 1 second

    return () => clearInterval(interval); // cleanup
  }, []);


  // Fetch reverse geocoded location
  const fetchLocationText = async (lat: number, lon: number) => {
    try {
      const response = await fetch(`/api/reverse-geocode?lat=${lat}&lon=${lon}`);
      const data = await response.json()
      return data?.display_name ?? "Unknown location";
    } catch (error) {
      console.error("Geocoding failed:", error);
      return "Error fetching location";
    }
  };

  useEffect(() => {
    const client = mqtt.connect(process.env.NEXT_PUBLIC_MQTT_BROKER_URL || '', {
      clientId: 'nextjs-mqtt-client',
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
        client.subscribe(device.passengerCountTopic, (err) => {
          if (!err) {
            console.log(`Subscribed to ${device.passengerCountTopic}`);
          } else {
            console.error("Subscription error:", err);
          }
        });
      });
    });

    client.on("message", (topic, payload) => {
      const msg = payload?.toString();

      devices?.forEach(async (device: Device) => {
        // Handle passenger count 
        // console.log(device)
        if (topic === device.passengerCountTopic) {
          try {
            const data = JSON.parse(msg);
            // console.log(data)

            setNearbyBuses((prevBuses: any) =>
              prevBuses?.map((bus: NearbyBusesProps) =>
                bus.deviceId === data.devId
                  ? { ...bus, passengerCount: data.count }
                  : bus
              )
            );
            // mutate("getDevices")
          } catch (e) {
            console.error("Invalid passenger count JSON:", msg);
          }
        }

        // Handle GPS topic
        if (topic === device.gpsTopic) {
          try {
            const data = JSON.parse(msg);
            if (data.lat && data.lon) {
              const now = Date.now();
              const lastFetched = lastLocationFetchRef.current.get(device.id) || 0;

              let locationText: string | null = null;

              if (now - lastFetched > FETCH_INTERVAL_MS) {
                lastLocationFetchRef.current.set(device.id, now);
                locationText = await fetchLocationText(data.lat, data.lon);
              }

              // Set timeout to remove offline bus
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

              // Calculate distance and direction
              const currentDistance = userLocation
                ? getDistanceFromLatLonInKm(userLocation.lat, userLocation.lon, data.lat, data.lon)
                : null;

                console.log(`Current Distance: ${currentDistance}`)

              let direction: "Approaching" | "Moving away" | null = null;

              if (currentDistance !== null) {
                const lastCheck = lastDirectionCheckTimestamps.get(device.id) || 0;
                
                if (now - lastCheck > DIRECTION_CHECK_INTERVAL_MS) {
                  const series = lastDistancesSeries.get(device.id) || [];
                  series.push(currentDistance);
                  if (series.length > MAX_HISTORY) series.shift(); // keep last 5

                  lastDistancesSeries.set(device.id, series);

                  if (series.length === MAX_HISTORY) {
                    const diffs = series.slice(1).map((v, i) => v - series[i]);
                    const allDecreasing = diffs.every((d) => d < -DISTANCE_TREND_THRESHOLD);
                    const allIncreasing = diffs.every((d) => d > DISTANCE_TREND_THRESHOLD);

                    if (allDecreasing) direction = "Approaching";
                    else if (allIncreasing) direction = "Moving away";
                  }

                  lastDirectionCheckTimestamps.set(device.id, now);
                }
              }

              // Calculate ETA
              let eta: number | undefined;
              if (userLocation && data.speed && data.speed  > 2 && currentDistance !== null) {
                const speedInKmPerMin = data.speed / 60;
                console.log(`Speed: ${speedInKmPerMin}`)
                if (speedInKmPerMin > 0) {
                  eta = parseFloat((currentDistance / speedInKmPerMin).toFixed(2));
                } else {
                  eta = undefined;
                }
              }

              setNearbyBuses((prev) => {
                const existing = (prev ?? []).find((bus) => bus.id === device.id);
                const filtered = (prev ?? []).filter((bus) => bus.id !== device.id);
                console.log(`ETA: ${eta}`)

                const updated = [
                  ...filtered,
                  {
                    id: device.id,
                    deviceId: device.deviceId,
                    name: device.name,
                    assignedBus: device.assignedBus,
                    lat: data.lat,
                    lon: data.lon,
                    speed: data.speed,
                    eta,
                    direction,
                    passengerCount: existing?.passengerCount?? device.passengerCount, // ✅ Preserve existing passengerCount
                    locationText: locationText ?? existing?.locationText ?? "Fetching...",
                  },
                ];

                if (userLocation) {
                  updated.sort((a, b) => {
                    const distA = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lon, a.lat, a.lon);
                    const distB = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lon, b.lat, b.lon);
                    return distA - distB;
                  });
                }

                return updated;
              });
            } else {
              // If invalid GPS data, remove from nearby buses
              setNearbyBuses((prev) => (prev ?? []).filter((bus) => bus.id !== device.id));
            }
          } catch (e) {
            console.error("Invalid GPS JSON received:", msg);
          }
        }
      });
    });

    return () => {
      client.end();
    };
  }, [devices]);

  const handleFly = (lat: number, lon: number) => {
    if (!mapRef.current) return;

    mapRef?.current.flyTo([lat, lon], 18); // 18 = zoom level
    mapContainerRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Nearby Mini-Buses</h1>

        <div className='max-h-[300px] md:h-full overflow-y-auto flex flex-col gap-4 p-1 md:p-2'>
          {nearbyBuses?.map((bus, index) => (
            <div
              key={index}
              className="relative flex items-center gap-4 p-4 rounded-xl shadow-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 transition hover:shadow-lg"
            >
              {/* <div className="">
                <div className="relative h-14 w-14 shrink-0">
                  <Image
                    src="/bus2.png"
                    alt="bus-icon"
                    fill
                    className="rounded-full object-cover object-center"
                  />
                </div>
              </div> */}

              <div className="flex flex-col text-sm text-gray-700 dark:text-gray-300 w-full">
                <div className="flex justify-between items-center mb-5">
                  <span className="font-semibold">{bus?.name}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{bus?.assignedBus?.plateNumber} <Button onClick={() => handleFly(bus.lat, bus.lon)} className="py-1 px-2" size="sm">View</Button></span>
                </div>

                <div className="w-full max-w-lg text-xs">
                  <div className="break-words overflow-hidden">
                    <span className="font-semibold">Location: </span>
                    {/* {bus.locationText?.split(",").slice(0, 3)} */}
                    Lat: {userLocation?.lat} Lon: {userLocation?.lon}
                  </div>
                </div>
                <div className='grid grid-cols-2 gap-1'>
                  <div className='mt-1 text-xs text-gray-600 dark:text-gray-400'>
                    <span className="font-semibold">Capacity:</span> {bus.assignedBus.capacity}
                  </div>
                  <div className='mt-1 text-xs text-gray-600 dark:text-gray-400'>
                    <span className="font-semibold">Passenger:</span> {bus.passengerCount}
                  </div>
                </div>
                <div className='mt-1 text-xs text-gray-600 dark:text-gray-400'>
                  <span className="font-semibold">Speed:</span> {bus.speed} km/h
                </div>
                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                  {bus.speed < 2 ? (
                    <span className="">
                      <span className="font-semibold">Status:</span>{' '}
                      <span className="text-red-600 font-semibold">Stopped</span>
                      <span className="ml-2">| ETA: Not moving</span>
                    </span>
                  ) : (
                    <span className="">
                      <span className="font-semibold">ETA:</span>{' '}
                      {bus.eta !== null ? (
                        <span className="text-green-600 font-semibold">{formatEtaMinutes(bus.eta)}</span>
                      ) : (
                        "Unable to calculate"
                      )}
                    </span>
                  )}
                  {bus.direction && bus.speed > 2 && (
                    <span className="col-span-2">
                      <span className="font-semibold">Direction:</span>{' '}
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
      </div>

    </>
  )
}

export default NearbyBuses
