"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Bus,
  ChartLine,
  CircleAlert,
  Command,
  Computer,
  Frame,
  GalleryVerticalEnd,
  LayoutDashboard,
  Map,
  MessageSquareMore,
  PieChart,
  PlusIcon,
  Settings2,
  SquareTerminal,
  TriangleAlert,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { MySidebarHeader } from "./MySidebarHeader"

// This is sample data.
const navData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      // isActive: true
    },
    {
      title: "Mini-Buses",
      url: "/dashboard/buses",
      icon: Bus,
      // items: [
      //   {
      //     title: "Genesis",
      //     url: "#",
      //   },
      //   {
      //     title: "Explorer",
      //     url: "#",
      //   },
      //   {
      //     title: "Quantum",
      //     url: "#",
      //   },
      // ],
    },
    {
      title: "Bus Orientation",
      url: "/dashboard/bus-orientation",
      icon: Computer
    },
    {
      title: "Devices",
      url: "/dashboard/devices",
      icon: Computer
    },
    {
      title: "Alerts",
      url: "/dashboard/alerts",
      icon: CircleAlert
    },
    // {
    //   title: "Mini-Bus Reports",
    //   url: "/dashboard/reports",
    //   icon: ChartLine
    // },
    {
      title: "SMS",
      url: "/dashboard/sms",
      icon: MessageSquareMore
    },
    {
      title: "Integrations",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "SMS",
          url: "/dashboard/integration/sms",
        }
      ],
    },
  ],
  userNav: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      // isActive: true
    },
    {
      title: "Alerts",
      url: "/track/alerts",
      icon: TriangleAlert,
      // isActive: true
    },
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const {data} = useSession()
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <MySidebarHeader />
      </SidebarHeader>
      <SidebarContent>
        {data && data?.user.role === "OPERATOR" ? <NavMain items={navData.navMain} /> : data?.user.role === "USER" ?<NavMain items={navData.userNav} /> : null}
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data?.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
