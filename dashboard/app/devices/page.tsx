"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Thermometer, Droplets, Zap, Wifi, WifiOff, Activity, Settings } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useRouter } from "next/navigation"

const devices = [
  {
    id: 1,
    name: "Sensore Temperatura - Sala Server",
    type: "Temperatura",
    status: "active",
    location: "Sala Server",
    lastUpdate: "2 min fa",
    currentValue: "22.5°C",
    icon: Thermometer,
    data: [
      { time: "00:00", value: 21.5 },
      { time: "04:00", value: 22.1 },
      { time: "08:00", value: 23.2 },
      { time: "12:00", value: 24.1 },
      { time: "16:00", value: 23.8 },
      { time: "20:00", value: 22.5 },
    ],
  },
  {
    id: 2,
    name: "Sensore Umidità - Magazzino",
    type: "Umidità",
    status: "active",
    location: "Magazzino",
    lastUpdate: "1 min fa",
    currentValue: "78%",
    icon: Droplets,
    data: [
      { time: "00:00", value: 65 },
      { time: "04:00", value: 68 },
      { time: "08:00", value: 72 },
      { time: "12:00", value: 75 },
      { time: "16:00", value: 78 },
      { time: "20:00", value: 76 },
    ],
  },
  {
    id: 3,
    name: "Contatore Energia - Ufficio",
    type: "Energia",
    status: "active",
    location: "Ufficio Principale",
    lastUpdate: "30 sec fa",
    currentValue: "1.2 kW",
    icon: Zap,
    data: [
      { time: "00:00", value: 0.8 },
      { time: "04:00", value: 0.6 },
      { time: "08:00", value: 1.5 },
      { time: "12:00", value: 1.8 },
      { time: "16:00", value: 1.4 },
      { time: "20:00", value: 1.2 },
    ],
  },
  {
    id: 4,
    name: "Sensore Temperatura - Laboratorio",
    type: "Temperatura",
    status: "inactive",
    location: "Laboratorio",
    lastUpdate: "2 ore fa",
    currentValue: "N/A",
    icon: Thermometer,
    data: [],
  },
  {
    id: 5,
    name: "Sensore Umidità - Ufficio",
    type: "Umidità",
    status: "active",
    location: "Ufficio",
    lastUpdate: "45 sec fa",
    currentValue: "62%",
    icon: Droplets,
    data: [
      { time: "00:00", value: 58 },
      { time: "04:00", value: 60 },
      { time: "08:00", value: 64 },
      { time: "12:00", value: 66 },
      { time: "16:00", value: 63 },
      { time: "20:00", value: 62 },
    ],
  },
  {
    id: 6,
    name: "Contatore Energia - Produzione",
    type: "Energia",
    status: "active",
    location: "Area Produzione",
    lastUpdate: "1 min fa",
    currentValue: "3.8 kW",
    icon: Zap,
    data: [
      { time: "00:00", value: 2.1 },
      { time: "04:00", value: 1.8 },
      { time: "08:00", value: 4.2 },
      { time: "12:00", value: 4.8 },
      { time: "16:00", value: 4.1 },
      { time: "20:00", value: 3.8 },
    ],
  },
]

export default function DevicesPage() {
  const router = useRouter()
  const activeDevices = devices.filter((device) => device.status === "active")
  const inactiveDevices = devices.filter((device) => device.status === "inactive")

  return (
    <div className="flex flex-col min-h-full">
      

      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dispositivi Totali</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{devices.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dispositivi Attivi</CardTitle>
              <Wifi className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeDevices.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Dispositivi Offline</CardTitle>
              <WifiOff className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{inactiveDevices.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Active Devices */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Dispositivi Attivi</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {activeDevices.map((device) => {
              const IconComponent = device.icon
              return (
                <Card
                  key={device.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => router.push(`/devices/${device.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{device.name}</CardTitle>
                          <CardDescription>{device.location}</CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <Wifi className="h-3 w-3 mr-1" />
                          Online
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Valore Attuale:</span>
                        <span className="text-lg font-semibold">{device.currentValue}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Ultimo Aggiornamento:</span>
                        <span className="text-sm">{device.lastUpdate}</span>
                      </div>
                      {device.data.length > 0 && (
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={device.data}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="time" />
                              <YAxis />
                              <Tooltip />
                              <Line type="monotone" dataKey="value" stroke="#60a5fa" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Inactive Devices */}
        {inactiveDevices.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Dispositivi Offline</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {inactiveDevices.map((device) => {
                const IconComponent = device.icon
                return (
                  <Card
                    key={device.id}
                    className="opacity-60 cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => router.push(`/devices/${device.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{device.name}</CardTitle>
                            <CardDescription>{device.location}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-red-100 text-red-700">
                            <WifiOff className="h-3 w-3 mr-1" />
                            Offline
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Valore Attuale:</span>
                          <span className="text-lg font-semibold text-muted-foreground">{device.currentValue}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Ultimo Aggiornamento:</span>
                          <span className="text-sm text-muted-foreground">{device.lastUpdate}</span>
                        </div>
                        <div className="h-32 flex items-center justify-center bg-muted rounded">
                          <span className="text-muted-foreground">Nessun dato disponibile</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
