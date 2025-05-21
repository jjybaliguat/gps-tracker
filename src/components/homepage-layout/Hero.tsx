"use client"

import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Button } from '../ui/button'
import { useRouter } from 'next/navigation'

const Hero = () => {
    const router =  useRouter()
  return (
    <>
        <section className="relative w-full min-h-[70vh] md:h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/hero-bg.png')" }}>
            <div className="absolute inset-0 bg-black/50 flex flex-col justify-center items-center text-center px-4">
                <div className='relative h-[100px] w-[100px] bg-white rounded-[15px] mb-4'>
                    <Image src="/logo.png" alt='logo' fill style={{objectFit: "cover", objectPosition: "center"}} />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">MINI-BUS TRACKER</h1>
                <p className="text-lg md:text-2xl text-gray-200 mb-6">The First Mini-Bus Tracker In San Isidro, Rodriguez, Rizal</p>
                <div className="flex flex-col md:flex-row gap-4">
                <button onClick={()=>router.push("/auth/sign-in")} className="px-6 py-3 bg-white text-black rounded-full font-semibold hover:bg-gray-100 transition">
                    Track Now
                </button>
                <button className="px-6 py-3 bg-transparent border border-white text-white rounded-full font-semibold hover:bg-white hover:text-black transition">
                    Learn More
                </button>
                </div>
            </div>
        </section>
    </>
  )
}

export default Hero