'use client';

import DeviceCard from '@/components/cards/DeviceCard';
import { Device } from '@/types/Device';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';

const DevicesPage = () => {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const { data, isLoading, error } = useSWR(userId ? 'get-devices' : null, GetDevices);

  async function GetDevices() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/device?userId=${userId}`);
      const data = await res.json();
      return data;
    } catch (err) {
      console.error('Device fetch error:', err);
      return null;
    }
  }

  return (
    <div className="flex flex-col gap-6 px-4 md:px-8 py-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          My Devices
        </h1>
        {/* Future action button placeholder */}
        {/* <Button>Add New</Button> */}
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground">Loading devices...</div>
      ) : error || !data ? (
        <div className="text-center text-red-500">Failed to load devices. Please try again.</div>
      ) : data.length === 0 ? (
        <div className="text-center text-gray-600 dark:text-gray-400">No devices found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.map((dev: Device) => (
            <DeviceCard key={dev.id} device={dev} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DevicesPage;
