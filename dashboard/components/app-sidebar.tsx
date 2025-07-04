"use client"
import { useEffect } from "react"
import { LayoutDashboard, Cpu, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"


const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Alerts",
    url: "/alerts",
    icon: AlertTriangle,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { setOpen, open } = useSidebar()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      const sidebar = document.querySelector('[data-sidebar="sidebar"]')
      const trigger = document.querySelector('[data-sidebar="trigger"]')

      // Se la sidebar è aperta e il click non è sulla sidebar o sul trigger
      if (open && sidebar && !sidebar.contains(target) && !trigger?.contains(target)) {
        setOpen(false)
      }
    }

    // Aggiungi l'event listener solo se la sidebar è aperta
    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, setOpen])
  
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-4 px-2 py-2 mr-7">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Cpu className="h-4 w-4" />
          </div>
          <span className="text-lg font-semibold">IoT Monitor</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigazione</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
