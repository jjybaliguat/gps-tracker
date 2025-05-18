'use client';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { FullscreenControl } from 'react-leaflet-fullscreen';
import { GPSData } from '@prisma/client';
import { reverseGeocode } from '@/utils/reverseGeocode';

// Fix default icon issue in Leaflet when using Webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '',
  iconUrl: '',
  shadowUrl: '',
});

const RouteMap = ({ routeLogs }: { routeLogs: GPSData[] }) => {
  const [locationEnd, setLocationEnd] = useState<string | null>("fetching location");
  const [locationStart, setLocationStart] = useState<string | null>("fetching location");

    // 💡 FIX for "Map container already initialized"
  useEffect(() => {
    const container = L.DomUtil.get('map');
    if (container != null) {
      (container as any)._leaflet_id = null;
    }
  }, []);


useEffect(() => {
  const fetchAddress = async () => {
    const endLocation = await reverseGeocode(
      routeLogs[routeLogs.length - 1].lat,
      routeLogs[routeLogs.length - 1].lon
    );
    const startLocation = await reverseGeocode(
      routeLogs[0].lat,
      routeLogs[0].lon
    );
    setLocationEnd(endLocation);
    setLocationStart(startLocation);
  };

  if (routeLogs.length > 0) {
    fetchAddress();
  }
}, [routeLogs]);


  if (!routeLogs || routeLogs.length < 2) {
    return (
      <div className="h-screen flex justify-center items-center text-3xl font-bold">
        Insufficient route data
      </div>
    );
  }

  const polylinePoints = routeLogs.map((log) => [log.lat, log.lon] as [number, number]);

  function createCustomArrowIcon(direction: number) {
    const iconHtml = `
      <div style="
        width: 16px;
        height: 16px;
        background-image: url('/arrow.png'); 
        background-size: contain;
        background-repeat: no-repeat;
        transform: rotate(${direction}deg);
        transform-origin: center;
        transition: transform 0.3s ease;
      "></div>
    `;

    return L.divIcon({
      className: '',
      html: iconHtml,
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
  }

  return (
    <MapContainer
      id={routeLogs[0].id}
      center={[routeLogs[routeLogs.length - 1].lat, routeLogs[routeLogs.length - 1].lon]}
      zoom={16}
      style={{ height: '90vh', width: '100%' }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FullscreenControl position="topright" />

      <Polyline positions={polylinePoints} color="blue" />

      {routeLogs.map((log, index) => {
        const isStart = index === 0;
        const isEnd = index === routeLogs.length - 1;

        return (
          <Marker
            key={index}
            position={[log.lat, log.lon]}
            icon={createCustomArrowIcon(log.direction)}
          >
            {(isStart || isEnd) ? (
              <Tooltip className='relative flex flex-col gap-2' direction="top" offset={[0, -30]} opacity={1} permanent>
                {isStart ? 'Start' : 'End'}
                <div className="max-w-[250px] overflow-visible whitespace-nowrap">
                  {isEnd ? `${locationEnd?.split(",")[2]}, ${locationEnd?.split(",")[3]}` : `${locationStart?.split(",")[2]}, ${locationStart?.split(",")[3]}`}
                </div>
                <span>{new Date(log.timestamp).toLocaleString()}</span>
              </Tooltip>
            ) : (
              <Tooltip direction="top" offset={[0, -30]} opacity={1}>
                <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
              </Tooltip>
            )}
          </Marker>
        );
      })}
    </MapContainer>
  );
};

export default RouteMap;
