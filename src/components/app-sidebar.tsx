"use client"

import * as React from "react"
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Bus,
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
      title: "Devices",
      url: "/dashboard/devices",
      icon: Computer
    },
    {
      title: "Alerts",
      url: "/dashboard/alerts",
      icon: CircleAlert
    },
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
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const {data} = useSession()
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <MySidebarHeader />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data?.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
