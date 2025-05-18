'use client'

import { MapContainer, TileLayer, Marker, Tooltip, Circle, useMap } from 'react-leaflet'
import { useEffect, useRef, useState } from 'react'
import MyCurrentLocationMarker from './MyCurrentLocationMarker'
import useSWR from 'swr'
import mqtt from 'mqtt'
import { useSession } from 'next-auth/react'
import { Device } from '@/types/Device'
import { FullscreenControl } from 'react-leaflet-fullscreen'
import 'react-leaflet-fullscreen/styles.css'
import NearbyBuses from './NearbyBuses'
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.fullscreen/Control.FullScreen.css';
import 'leaflet.fullscreen';

// Fix default icon issue in Leaflet when using Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '',
  iconUrl: '',
  shadowUrl: '',
})

interface GpsDataProps {
  lat: number
  lon: number
  direction: number
  lastUpdated: number
}


function FlyToUser({ position }: { position: { lat: number; lng: number } | null }) {
  const map = useMap();
  const hasFlown = useRef(false);

  useEffect(() => {
    if (position && !hasFlown.current) {
      map.flyTo([position.lat, position.lng], 16); // zoom 16
      hasFlown.current = true;
    }
  }, [position]);

  return null;
}

const Map = () => {
  const [message, setMessage] = useState<string | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const session = useSession()
  const user = session.data?.user
  const [coord, setCoord] = useState<[number, number]>([14.6810331, 121.1123889])
  const [gpsData, setGpsData] = useState<GpsDataProps[] | null>(null)
  const [myCoord, setMyCoord] = useState<[number, number] | null>(null)
  const mapRef = useRef(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Get devices
  const { data: devices, isLoading } = useSWR(user ? 'getDevices' : null, GetDevices)

  // Initialize gpsData to match number of devices
  useEffect(() => {
    if (devices && devices.length > 0) {
      setGpsData(Array(devices.length).fill({ lat: 0, lon: 0, direction: 0, lastUpdated: Date.now() }))
    }
  }, [devices])

  // Get current user location
  useEffect(() => {
    const interval = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // console.log(position.coords.latitude)
          setMyCoord([
            position.coords.latitude,
            position.coords.longitude,
          ]);
        },
        (error) => console.error("Geolocation error:", error),
        { enableHighAccuracy: true }
      );
    }, 1000); // every 1 second

    return () => clearInterval(interval); // cleanup
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

  // MQTT setup
  useEffect(() => {
    if (!devices || devices.length === 0) return

    const client = mqtt.connect(process.env.NEXT_PUBLIC_MQTT_BROKER_URL || '', {
      username: process.env.NEXT_PUBLIC_MQTT_USER,
      password: process.env.NEXT_PUBLIC_MQTT_PASS,
      reconnectPeriod: 1000,
      clean: true,
    })

    client.on('connect', () => {
      console.log('Connected to MQTT broker')
      devices.forEach((device: Device) => {
        client.subscribe(device.gpsTopic, (err) => {
          if (!err) {
            console.log(`Subscribed to ${device.gpsTopic}`)
          } else {
            console.error('Subscription error:', err)
          }
        })
      })
    })

    client.on('message', (topic, payload) => {
      devices.forEach((device: Device, index: number) => {
        if (topic === device.gpsTopic) {
          const msg = payload.toString()
          setMessage(msg)

          try {
            const data = JSON.parse(msg)
            if (data.lat && data.lon) {
              setGpsData((prev) => {
                if (!prev) return prev
                const newData = [...prev]
                newData[index] = {
                  lat: data.lat,
                  lon: data.lon,
                  direction: data.direction,
                  lastUpdated: Date.now(),
                }
                return newData
              })
            }
          } catch (e) {
            console.error('Invalid JSON received:', msg)
          }
        }
      })
    })

    return () => {
      client.end()
    }
  }, [devices])

  // Remove devices without GPS data for more than 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (gpsData) {
        const now = Date.now()
        const updatedGpsData = gpsData.filter((data) => now - data?.lastUpdated <= 3000)
        setGpsData(updatedGpsData)
      }
    }, 1000) // Check every 1 second

    return () => clearInterval(interval)
  }, [gpsData])

  function createCustomBusIcon(direction: number) {
    const iconHtml = `
      <div style="
        width: 60px;
        height: 40px;
        background-image: url('/bus-top-view.png'); 
        background-size: contain;
        background-repeat: no-repeat;
        transform: rotate(${direction + 90}deg);
        transform-origin: center;
        transition: transform 0.3s ease;
      "></div>`

    return L.divIcon({
      className: '',
      html: iconHtml,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    })
  }

  return (
    <>
    <div className="grid md:grid-cols-3 grid-cols-1 gap-4">
      <div className='col-span-1 h-full w-full rounded-xl bg-muted/50 z-40 p-6'>
        <NearbyBuses devices={devices} mapRef={mapRef} mapContainerRef={mapContainerRef} />
      </div>
      <div className="col-span-2 h-[55vh] md:h-[85vh] w-full rounded-xl bg-muted/50 z-40">
        <div className="h-[70vh] md:h-[80vh] md:px-6 py-6 px-2">
          <h1 className="text-xl font-medium">Mini-Buses&apos; Real-Time Locations</h1>
          <div ref={mapContainerRef} className='h-full w-full'>
            <MapContainer
              ref={mapRef}
              style={{ height: '100%', width: '100%' }}
              center={coord}
              zoom={18}
              className="h-full w-full z-0 mt-4"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {myCoord && <FlyToUser position={{lat: myCoord[0], lng: myCoord[1]}} />}
              <FullscreenControl position="topright" />
              <MyCurrentLocationMarker myCoord={myCoord} />
              <Circle
                className="animate-pulse"
                center={[14.7607, 121.1568]}
                pathOptions={{ fillColor: 'blue' }}
                radius={200}
              />
              {devices && gpsData &&
                devices
                  .map((device: Device, index: number) => ({
                    device,
                    gps: gpsData[index],
                  }))
                  .filter(({ gps } : any) => gps && Date.now() - gps.lastUpdated <= 3000)
                  .map(({ device, gps } : any) => (
                    <div key={device.id}>
                      <Marker
                        position={[gps.lat, gps.lon]}
                        icon={createCustomBusIcon(gps.direction)}
                        ref={markerRef}
                      >
                        <Tooltip direction="top" offset={[0, -30]} opacity={1}>
                          <div>
                            <h1>{device.name}</h1>
                            <p>Plate No: {device.assignedBus.plateNumber}</p>
                            <p>Driver: {device.assignedBus.driver}</p>
                            <p>Conductor: {device.assignedBus.conductor}</p>
                            <p>Capacity: {device.assignedBus.capacity}</p>
                          </div>
                        </Tooltip>
                      </Marker>
                      <Circle
                        className="animate-pulse"
                        center={[gps.lat, gps.lon]}
                        pathOptions={{ fillColor: 'blue' }}
                        radius={50}
                      />
                    </div>
                  ))}
              <Marker
                icon={
                  new L.Icon({
                    iconUrl: '/terminal-bus.png',
                    iconRetinaUrl: '/terminal-bus.png',
                    iconSize: [100, 100],
                    iconAnchor: [50, 50],
                    popupAnchor: [0, -41],
                    shadowUrl: '/marker-shadow.png',
                    shadowSize: [80, 80],
                  })
                }
                position={[14.7607, 121.1568]}
              >
                <Tooltip direction="top" offset={[0, -30]} opacity={1} permanent>
                  San Isidro Mini Bus Terminal
                </Tooltip>
              </Marker>
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}

export default Map
