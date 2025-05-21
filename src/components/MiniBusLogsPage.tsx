'use client';

import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import dynamic from 'next/dynamic';
import { GPSData } from '@prisma/client';
import { Device } from '@/types/Device';

const RouteMap = dynamic(() => import('@/components/map/RouteMap'), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
});

async function GetBusRouteLogs(devId: string, range: number, signal: AbortSignal) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/mini-bus/route-logs?devId=${devId}&range=${range}`,
    {
      cache: 'no-store',
      signal,
    }
  );
  if (!res.ok) throw new Error('Failed to fetch logs');
  return res.json();
}

type Props = {
  devId: string;
};

export default function MiniBusLogsPage({ devId }: Props) {
  const [trips, setTrips] = useState<GPSData[][]>([]);
  const [selectedRange, setSelectedRange] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [device, setDevice] = useState<Device | null>()

  useEffect(() => {
    const controller = new AbortController();

    const fetchTrips = async () => {
      try {
        setIsLoading(true);
        setTrips([]);
        const {separatedGpsLogs, device} = await GetBusRouteLogs(devId, selectedRange, controller.signal);
        setDevice(device)
        setTrips(separatedGpsLogs);
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log('Previous fetch aborted');
        } else {
          console.error('Failed to fetch trips:', err);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrips();

    return () => controller.abort();
  }, [devId, selectedRange]);

  return (
    <div className="p-1 md:p-2 lg:p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mini-Bus Trip Logs</h1>
        <Select value={selectedRange.toString()} onValueChange={value => setSelectedRange(Number(value))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select day" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Today</SelectItem>
            <SelectItem value="1">Yesterday</SelectItem>
            <SelectItem value="2">Last 2 Days</SelectItem>
            <SelectItem value="3">Last 3 Days</SelectItem>
            <SelectItem value="4">Last 4 Days</SelectItem>
            <SelectItem value="5">Last 5 Days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-10">⏳ Fetching trip logs...</div>
      ) : trips.length > 0 ? (
        <>
          <div className="flex flex-col gap-2">
            <p>{device?.name}</p>
            <p>Plate Number: {device?.assignedBus.plateNumber}</p>
            <p>Total Trips: {trips.length}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-1 py-6">
            {trips.map((trip, index) => {
              if (trip.length === 0) return null;

              const startTime = new Date(trip[0].timestamp).toLocaleString();
              const endTime = new Date(trip[trip.length - 1].timestamp).toLocaleString();
              const start: Date = new Date(trip[0].timestamp)
              const end: Date = new Date(trip[trip.length - 1].timestamp)
              const durationInSecs: number = (end.getTime() - start.getTime()) / 1000;
              const hours = Math.floor(durationInSecs / 3600);
              const minutes = Math.floor((durationInSecs % 3600) / 60);
              const seconds = Math.floor(durationInSecs % 60);
              const expectedData = Math.floor(durationInSecs) / 5;
              const actualData = trip.length;
              const effeciency = (actualData/expectedData) * 100

              return (
                <div
                  key={index}
                  className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-200"
                >
                  <div className="p-2 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">Trip #{index + 1}</h2>
                    <p className="text-sm text-gray-600">
                      🟢 Start: <span className="font-medium">{startTime}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      🔴 End: <span className="font-medium">{endTime}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Duration: <span className="font-medium">{`${hours} hrs, ${minutes} min. and ${seconds} secs.`}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Expected No. of Data: <span className="font-medium">{expectedData.toFixed(0)}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Actual Data: <span className="font-medium">{actualData}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Accuracy: <span className="font-medium">{effeciency.toFixed(2)} %</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Data Loss: <span className="font-medium">{(100 - Number(effeciency)).toFixed(2)} %</span>
                    </p>
                  </div>
                  <RouteMap routeLogs={trip} />
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div>No Trips To Show.</div>
      )}
    </div>
  );
}
