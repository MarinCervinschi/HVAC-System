"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Server, Cpu, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { Rooms } from "@/types/rooms"
import { useEffect, useState } from "react"
import { formatName } from "@/lib/utils"

export default function Dashboard() {
  const router = useRouter()
  const [roomsInfo, setRoomsInfo] = useState<Rooms[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const totalRooms = roomsInfo.length
  const totalRacks = roomsInfo.reduce((acc, room) => acc + (room.racks ? room.racks.length : 0), 0)
  const totalDevices = roomsInfo.reduce((acc, room) => acc + (room.total_smart_objects ? room.total_smart_objects : 0), 0)
 /*  // Sample data for local development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      setRoomsInfo([
        {
          room_id: "room_A1",
          location: "Building A, Floor 1",
          racks: ["Rack A1", "Rack W1"],
          total_smart_objects: 8,
          smart_objects: ["Environment Monitor", "Cooling System Hub"],
          last_update: "2 min ago",
        },
        {
          room_id: "room_B2",
          location: "Building B, Floor 2",
          racks: ["Rack A2", "Rack A3"],
          total_smart_objects: 8,
          smart_objects: ["Environment Monitor", "Cooling System Hub"],
          last_update: "2 min ago",
        },
      ])
      setLoading(false)
    }
  }, [])*/

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch("http://localhost:7070/hvac/api/rooms")

        if (!res.ok) {
          console.error("Failed to fetch rooms data:", res.statusText)
          setError("Failed to fetch rooms data")
          return
        }

        const data = await res.json()
        setRoomsInfo(data.rooms)
      } catch (err: any) {
        console.error("Unexpected error fetching room information:", err)
        setError(err.message || "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    fetchRooms()
  }, [])

  if (loading) return <div>Loading rooms...</div>

  return (
    <div className="flex flex-col min-h-full">  
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRooms}</div>
              <p className="text-xs text-muted-foreground">Server rooms</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Racks</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRacks}</div>
              <p className="text-xs text-muted-foreground">Racks</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDevices}</div>
              <p className="text-xs text-muted-foreground">Smart objects</p>
            </CardContent>
          </Card>
        </div>

        {/* Rooms Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Server Rooms</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {roomsInfo.map((room) => (
              <Card
                key={room.room_id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => {
                  console.log("Room clicked:", room.room_id)
                  router.push(`/rooms/${room.room_id}`)
                }}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{formatName(room.room_id)}</CardTitle>
                        <CardDescription>{room.location}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center bg-blue-100 py-3 rounded-lg">
                        <div className="text-lg font-semibold">{room.racks.length}</div>
                        <div className="text-muted-foreground">Racks</div>
                      </div>
                      <div className="text-center bg-blue-100 py-3 rounded-lg">
                        <div className="text-lg font-semibold">
                          {room.total_smart_objects}
                        </div>
                        <div className="text-muted-foreground">Devices</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Smart Objects:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {room.smart_objects.map((obj) => (
                          <Badge key={obj} variant="outline" className="text-xs">
                            {obj}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Last update:</span>
                      <span>{room.last_update}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
