import React from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import OverviewCard from '@/components/cards/OverviewCard'
import { getTotalBuses, getTotalDevices } from '../actions'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const Map = dynamic(() => import('@/components/MyMap'), {
  ssr: false, // disable server-side rendering
  loading: () => <p>Loading map...</p>, // optional: loading fallback
})

export const revalidate = 0;

const Dashboard = async() => {
  // @ts-ignore
  const session = await getServerSession(authOptions)
  const userId = session?.user.id || null
  const totalBuses = await getTotalBuses(userId)
  const totalDevices = await getTotalDevices(userId)
  return (
    <>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <OverviewCard title='Total Buses' image='/bus2.png' total={totalBuses} />
        <OverviewCard title='Total Devices' image='/gps-device.png' total={totalDevices} />
      </div>
      <div className="h-[80vh] md:h-[90vh] w-full rounded-xl md:min-h-min z-40 p-2 md:p-4 pb-4">
        <Map />
      </div>
    </>
  )
}

export default Dashboard