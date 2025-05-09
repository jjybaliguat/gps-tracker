'use client';
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import { useSidebar } from '@/hooks/useSidebar';
import Link from 'next/link';
import { navItems } from '@/constants/data';
import { DashboardNav } from '../dashboard-nav';
import Image from 'next/image';
import { useSession } from 'next-auth/react';

type SidebarProps = {
  className?: string;
};

export default function Sidebar({ className }: SidebarProps) {
  const { isMinimized, toggle } = useSidebar();
  const {data: session} = useSession()

  const handleToggle = () => {
    toggle();
  };

  return (
    <aside
      className={cn(
        `relative  hidden h-screen flex-none border-r bg-card transition-[width] duration-500 md:block z-50`,
        !isMinimized ? 'w-72' : 'w-[72px]',
        className
      )}
    >
      <div className="hidden p-5 pt-10 lg:block">
        <Link
          href="/"
          className='flex flex-col gap-2 items-center'
        >
          <Image
            src="/marker-icon2.png"
            alt=''
            height={50}
            width={50}
          />
          <div className={cn({
            'flex flex-col gap-2': true,
            "hidden": isMinimized
          })}>
            <h1 className='text-xl font-medium text-center'>Welcome Back!</h1>
            <p className='font-bold text-xl text-center'>{session?.user?.name}</p>
          </div>
        </Link>
      </div>
      <ChevronLeft
        className={cn(
          'absolute -right-3 top-10 z-50  cursor-pointer rounded-full border bg-background text-3xl text-foreground h-8 w-8',
          isMinimized && 'rotate-180'
        )}
        onClick={handleToggle}
      />
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="mt-3 space-y-1">
            <DashboardNav items={navItems} />
          </div>
        </div>
      </div>
    </aside>
  );
}
