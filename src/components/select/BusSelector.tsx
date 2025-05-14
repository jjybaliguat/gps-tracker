'use client';

import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import BusOrientation from '../3d/BusOrientation';

// Moved fetcher function outside component
async function GetMiniBuses(url: string) {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch buses:', error);
    return [];
  }
}

export default function BusSelector() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const fetchKey = useMemo(() => (userId ? `/api/mini-bus?userId=${userId}` : null), [userId]);

  const { data: buses = [], isValidating } = useSWR(fetchKey, GetMiniBuses, {
    revalidateOnFocus: false,
    dedupingInterval: 10000, // reduce redundant refetching
  });

  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);

  const selectedBus = useMemo(() => buses.find((bus: any) => bus.id === selectedBusId), [selectedBusId, buses]);

  return (
    <>
      <div className="p-4 w-full max-w-sm">
        <label className="block mb-2 text-lg font-medium">Select a Bus</label>
        <Select onValueChange={(value) => setSelectedBusId(value)}>
          <SelectTrigger>
            <SelectValue placeholder={isValidating ? 'Loading buses...' : 'Choose a bus'} />
          </SelectTrigger>
          <SelectContent>
            {buses.map((bus: any) => (
              <SelectItem key={bus.id} value={bus.id}>
                PlateNo: {bus.plateNumber} – Driver: {bus.driver}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="p-4">
        {selectedBus ? (
          <BusOrientation
            busString={`PlateNo.: ${selectedBus.plateNumber}, Driver: ${selectedBus.driver}`}
            topic={selectedBus?.device?.accelTopic || ''}
          />
        ) : (
          <h1 className="text-md">No Bus Selected</h1>
        )}
      </div>
    </>
  );
}
