"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { usePathname } from "next/navigation"
import DashboardHeader from "@/components/headers/dashboard"
import AlertsHeader from "./headers/alerts"
import RoomsHeader from "./headers/room"
import { RackHeader } from "./headers/rack"

// Mappa dei percorsi ai componenti header
const getHeaderComponent = (pathname: string) => {
  // Gestione dinamica per /rooms/[id]
  if (/^\/rooms\/[^/]+$/.test(pathname)) {
    // return <RoomDetailHeader />
    return <RoomsHeader />
  }
  if (/^\/rooms\/[^/]+\/racks\/[^/]+$/.test(pathname)) {
    return <RackHeader />;
  }
  switch (pathname) {
    case "/":
      return <DashboardHeader />
    case "/rooms":
      // return <RoomsHeader />
      return null
    case "/alerts":
      return <AlertsHeader />
    default:
      return null
  }
}

export function AppHeader() {
  const pathname = usePathname()
  const HeaderComponent = getHeaderComponent(pathname)

  return (
    <header className="flex w-screen h-16 shrink-0 items-center border-b bg-background px-4">
      {/* Logo + SidebarTrigger */}
      <div className="flex items-center gap-2 shrink-0">
        <SidebarTrigger />
        <Separator orientation="vertical" className="h-6" />
      </div>

      {/* Header component che si estende sullo spazio rimanente */}
      <div className="flex flex-grow items-center gap-2 ml-2">
        {HeaderComponent}
      </div>
    </header>

  )
}
