"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Server, Cpu, ArrowRight, Wifi } from "lucide-react"
import { useRouter } from "next/navigation"
import { datacenterData, getTotalStats } from "@/lib/datacenter-data"

const weeklyData = [
  { day: "Lun", temperature: 22, humidity: 65, power: 85 },
  { day: "Mar", temperature: 24, humidity: 62, power: 78 },
  { day: "Mer", temperature: 23, humidity: 68, power: 92 },
  { day: "Gio", temperature: 25, humidity: 60, power: 88 },
  { day: "Ven", temperature: 26, humidity: 58, power: 95 },
  { day: "Sab", temperature: 24, humidity: 63, power: 82 },
  { day: "Dom", temperature: 23, humidity: 66, power: 79 },
]

const dailyStats = [
  { day: "L", value: 85 },
  { day: "M", value: 92 },
  { day: "M", value: 78 },
  { day: "G", value: 95 },
  { day: "V", value: 88 },
  { day: "S", value: 82 },
  { day: "D", value: 79 },
]

export default function Dashboard() {
  const router = useRouter()
  const { totalRooms, totalRacks, totalDevices } = getTotalStats()

  return (
    <div className="flex flex-col min-h-full">  
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sale Totali</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRooms}</div>
              <p className="text-xs text-muted-foreground">Sale server attive</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rack Totali</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRacks}</div>
              <p className="text-xs text-muted-foreground">Rack in funzione</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dispositivi Attivi</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDevices}</div>
              <p className="text-xs text-muted-foreground">Smart objects operativi</p>
            </CardContent>
          </Card>
        </div>

        {/* Rooms Grid */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Sale Server</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {datacenterData.map((room) => (
              <Card
                key={room.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/rooms/${room.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{room.name}</CardTitle>
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
                        <div className="text-muted-foreground">Rack</div>
                      </div>
                      <div className="text-center bg-blue-100 py-3 rounded-lg">
                        <div className="text-lg font-semibold">
                          {room.smartObjects.length +
                            room.racks.reduce((sum, rack) => sum + rack.smartObjects.length, 0)}
                        </div>
                        <div className="text-muted-foreground">Dispositivi</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Smart Objects:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {room.smartObjects.map((obj) => (
                          <Badge key={obj.id} variant="outline" className="text-xs">
                            {obj.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Ultimo aggiornamento:</span>
                      <span>{room.lastUpdate}</span>
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
