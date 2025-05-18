import L from 'leaflet'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { Circle, Marker, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet'

const MyCurrentLocationMarker = ({myCoord}: {myCoord: [number, number] | null}) => {
    const map = useMap();
    const {data: session} = useSession()

    // useEffect(() => {
    //     if (map && myCoord) {
    //       map.flyTo(myCoord, 15); // Zoom level 13
    //     }
    //   }, [map]);
    
    // const map = useMapEvents({
    //     click() {
    //     map.locate()
    //     },
    //     locationfound(e: any) {
    //     setMyCoord(e.latlng)
    //     console.log(e.latlng)
    //     map.flyTo(e.latlng, map.getZoom())
    //     },
    // })

    return myCoord === null ? null : (
        <>
            <Circle className='animate-pulse' center={myCoord} pathOptions={{ fillColor: 'blue' }} radius={70} />
            <Marker
            icon={
                L.divIcon({
                    html: `<img class="custom-icon" src=${session?.user?.image? session?.user?.image : "/male.svg"} alt='mypic' />`,
                    className: '', // Remove default marker styling
                    iconSize: [40, 40], // Icon size
                    iconAnchor: [20, 23], // Anchor point (centered bottom)
                    popupAnchor: [0, -40], // Popup position relative to the icon
                  })
            }
            position={myCoord}>
            <Popup>
                You are here <br /> {session?.user?.name}
            </Popup>
            </Marker>
        </>
    )
}

export default MyCurrentLocationMarker