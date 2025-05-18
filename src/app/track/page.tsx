import NearbyBuses from '@/components/NearbyBuses'
import dynamic from 'next/dynamic'
import React from 'react'


const CommutersMap = dynamic(() => import('@/components/CommutersMap'), {
  ssr: false, // disable server-side rendering
  loading: () => <p>Loading map...</p>, // optional: loading fallback
})

const CommuterDashboard = () => {
  
  return (
    <>
        <CommutersMap />
    </>
  )
}

export default CommuterDashboard