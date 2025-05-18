import React from 'react'
import dynamic from 'next/dynamic'
import MiniBusLogsPage from '@/components/MiniBusLogsPage'

async function GetBusRouteLogs(devId: string) {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mini-bus/route-logs?devId=${devId}`, {
            cache: "no-store"
        })
        const data = await response.json()

        return data
    } catch (error) {
        console.log(error)
        return null
    }
}

const RouteMap = dynamic(() => import('@/components/map/RouteMap'), {
  ssr: false, // disable server-side rendering
  loading: () => <p>Loading map...</p>, // optional: loading fallback
})

const MiniBusRouteLogs = async ({
  params,
}: {
  params: { devId: string };
}) => {
  const devId = params.devId;

  return <MiniBusLogsPage devId={devId} />;
};

export default MiniBusRouteLogs;
