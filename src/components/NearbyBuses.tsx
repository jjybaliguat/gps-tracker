"use client"

import React, { useEffect, useRef, useState } from 'react'
import mqtt from "mqtt";
import { Device } from '@/types/Device';
import { getDistanceFromLatLonInKm } from '@/utils/getDistanceFromLatLonInKM';
import { Button } from './ui/button';
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
  const timeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastLocationFetchRef = useRef<Map<string, number>>(new Map());
  const FETCH_INTERVAL_MS = 30_000;
  const lastDistancesSeries = useRef<Map<string, number[]>>(new Map());
  const lastDirectionCheckTimestamps = useRef<Map<string, number>>(new Map());
  const DIRECTION_CHECK_INTERVAL_MS = 3000;
  const MAX_HISTORY = 5;
  const DISTANCE_TREND_THRESHOLD = 0.01;
  // console.log(lastDistancesSeries)

  function getUserLocation() {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const coords = {
        lat: pos.coords.latitude,
        lon: pos.coords.longitude,
      };
      setUserLocation(coords);
    },
    (err) => console.error("Error getting location:", err)
  );
}

 useEffect(() => {
  console.log("Requesting location...");
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("Location fetched:", position.coords);
        setUserLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        console.error("Geolocation error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  } else {
    console.error("Geolocation is not supported by this browser.");
  }
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
      devices?.forEach((device: Device) => {
        client.subscribe(device.gpsTopic);
        client.subscribe(device.passengerCountTopic);
      });
    });

    client.on("message", (topic, payload) => {
      const msg = payload?.toString();

      devices?.forEach(async (device: Device) => {
        if (topic === device.passengerCountTopic) {
          try {
            const data = JSON.parse(msg);
            setNearbyBuses((prevBuses: any) =>
              prevBuses?.map((bus: NearbyBusesProps) =>
                bus.deviceId === data.devId
                  ? { ...bus, passengerCount: data.count }
                  : bus
              )
            );
          } catch (e) {
            console.error("Invalid passenger count JSON:", msg);
          }
        }

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

              if (timeouts.current.has(device.id)) {
                clearTimeout(timeouts.current.get(device.id)!);
              }
              timeouts.current.set(
                device.id,
                setTimeout(() => {
                  setNearbyBuses((prev) => (prev ?? []).filter((bus) => bus.id !== device.id));
                  timeouts.current.delete(device.id);
                }, 10000)
              );

              let currentDistance;
              if(userLocation){
                currentDistance = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lon, Number(data.lat), Number(data.lon))
              } else {
                currentDistance = null;
              }

              let direction: "Approaching" | "Moving away" | null = null;

              if (currentDistance !== null) {
                  const history = lastDistancesSeries.current.get(device.id) || [];

                  // Add new distance to history
                  history.push(currentDistance);
                  if (history.length > MAX_HISTORY) {
                    history.shift();
                  }
                  lastDistancesSeries.current.set(device.id, history);

                  // Check direction trend
                  if (history.length === MAX_HISTORY) {
                    const deltas = history.slice(1).map((val, idx) => val - history[idx]);
                    
                    const decreasing = deltas.every(delta => delta < -DISTANCE_TREND_THRESHOLD);
                    const increasing = deltas.every(delta => delta > DISTANCE_TREND_THRESHOLD);

                    if (decreasing) {
                      direction = "Approaching";
                    } else if (increasing) {
                      direction = "Moving away";
                    } else {
                      direction = null;
                    }

                    console.log(`Direction: ${direction}`);
                  }
                }

              let eta: number | undefined;
              if (userLocation && data.speed && Number(data.speed) > 2 && currentDistance !== null) {
                const speedInKmPerMin = Number(data.speed) / 60;
                if (speedInKmPerMin > 0) {
                  eta = parseFloat((currentDistance / speedInKmPerMin).toFixed(2));
                }
              }

              setNearbyBuses((prev) => {
                const existing = (prev ?? []).find((bus) => bus.id === device.id);
                const filtered = (prev ?? []).filter((bus) => bus.id !== device.id);

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
                    passengerCount: existing?.passengerCount ?? device.passengerCount,
                    locationText: locationText ?? existing?.locationText ?? "Fetching...",
                  },
                ];

                if (userLocation) {
                  updated.sort((a, b) => {
                    const distA = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lon, a.lat, a.lon) ?? Infinity;
                    const distB = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lon, b.lat, b.lon) ?? Infinity;
                    return distA - distB;
                  });
                }

                return updated;
              });
            } else {
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
  }, [devices, userLocation]);

  const handleFly = (lat: number, lon: number) => {
    if (!mapRef.current) return;

    mapRef?.current.flyTo([lat, lon], 18); // 18 = zoom level
    mapContainerRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <>
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Nearby Mini-Buses</h1>
        {/* <button onClick={getUserLocation}>Enable Location</button> */}

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
                    {bus.locationText?.split(",").slice(0, 3)}
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
