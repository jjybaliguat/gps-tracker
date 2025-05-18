'use client';

import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import dynamic from 'next/dynamic';
import { GPSData } from '@prisma/client';

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

  useEffect(() => {
    const controller = new AbortController();

    const fetchTrips = async () => {
      try {
        setIsLoading(true);
        setTrips([]);
        const data = await GetBusRouteLogs(devId, selectedRange, controller.signal);
        setTrips(data);
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
    <div className="p-6 space-y-4">
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
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-10">⏳ Fetching trip logs...</div>
      ) : trips.length > 0 ? (
        <>
          <p>Total Trips: {trips.length}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-4 py-6">
            {trips.map((trip, index) => {
              if (trip.length === 0) return null;

              const startTime = new Date(trip[0].timestamp).toLocaleString();
              const endTime = new Date(trip[trip.length - 1].timestamp).toLocaleString();

              return (
                <div
                  key={index}
                  className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-200"
                >
                  <div className="p-4 border-b">
                    <h2 className="text-lg font-semibold text-gray-800">Trip #{index + 1}</h2>
                    <p className="text-sm text-gray-600">
                      🟢 Start: <span className="font-medium">{startTime}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      🔴 End: <span className="font-medium">{endTime}</span>
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
