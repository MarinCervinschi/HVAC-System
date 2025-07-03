"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Building2,
  Thermometer,
  Droplets,
  Snowflake,
  Settings,
  ArrowRight,
  Wind,
  Waves,
  Wifi,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { getRoomById } from "@/lib/datacenter-data"

export default function RoomDetailPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.id as string
  const room = getRoomById(roomId)

  const [coolingLevel, setCoolingLevel] = useState(3)
  const [coolingStatus, setCoolingStatus] = useState(true)
  const [tempPolicy, setTempPolicy] = useState({ min: 18, max: 25 })
  const [humidityPolicy, setHumidityPolicy] = useState({ min: 40, max: 60 })

  if (!room) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-8">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Sala non trovata</h1>
            <p className="text-muted-foreground">La sala richiesta non esiste.</p>
          </div>
        </div>
      </div>
    )
  }

  const environmentMonitor = room.smartObjects.find((obj) => obj.type === "environmental")
  const coolingHub = room.smartObjects.find((obj) => obj.type === "cooling")
  const tempSensor = environmentMonitor?.sensors.find((s) => s.type === "temperature")
  const humiditySensor = environmentMonitor?.sensors.find((s) => s.type === "humidity")

  return (
    <div className="flex flex-col min-h-full">
      {/* Page Header */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-4 md:px-8">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Building2 className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-semibold">{room.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Policy
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Configurazione Policy</DialogTitle>
                <DialogDescription>Imposta le soglie per temperatura e umidità della sala</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Temperatura (°C)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="temp-min" className="text-xs">
                        Min
                      </Label>
                      <Input
                        id="temp-min"
                        type="number"
                        value={tempPolicy.min}
                        onChange={(e) => setTempPolicy((prev) => ({ ...prev, min: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="temp-max" className="text-xs">
                        Max
                      </Label>
                      <Input
                        id="temp-max"
                        type="number"
                        value={tempPolicy.max}
                        onChange={(e) => setTempPolicy((prev) => ({ ...prev, max: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Umidità (%)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="hum-min" className="text-xs">
                        Min
                      </Label>
                      <Input
                        id="hum-min"
                        type="number"
                        value={humidityPolicy.min}
                        onChange={(e) => setHumidityPolicy((prev) => ({ ...prev, min: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="hum-max" className="text-xs">
                        Max
                      </Label>
                      <Input
                        id="hum-max"
                        type="number"
                        value={humidityPolicy.max}
                        onChange={(e) => setHumidityPolicy((prev) => ({ ...prev, max: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <Button>Salva Policy</Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        {/* Room Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{room.name}</CardTitle>
            <CardDescription>{room.location}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Stato:</span>
                <div className="font-semibold flex items-center gap-1">
                  <Wifi className="h-3 w-3 text-green-600" />
                  Attiva
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Rack:</span>
                <div className="font-semibold">{room.racks.length}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Smart Objects:</span>
                <div className="font-semibold">{room.smartObjects.length}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Ultimo Aggiornamento:</span>
                <div className="font-semibold">{room.lastUpdate}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Environment Monitor */}
        {environmentMonitor && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Thermometer className="h-5 w-5" />
                Environment Monitor
              </CardTitle>
              <CardDescription>Monitoraggio ambientale della sala</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {tempSensor && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Temperatura</h4>
                        <p className="text-2xl font-bold">{tempSensor.currentValue}°C</p>
                      </div>
                      <Thermometer className="h-8 w-8 text-red-500" />
                    </div>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={tempSensor.data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Policy: {tempSensor.policy.min}°C - {tempSensor.policy.max}°C
                    </div>
                  </div>
                )}

                {humiditySensor && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Umidità</h4>
                        <p className="text-2xl font-bold">{humiditySensor.currentValue}%</p>
                      </div>
                      <Droplets className="h-8 w-8 text-blue-500" />
                    </div>
                    <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={humiditySensor.data}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="time" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Policy: {humiditySensor.policy.min}% - {humiditySensor.policy.max}%
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cooling System Hub */}
        {coolingHub && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Snowflake className="h-5 w-5" />
                Cooling System Hub
              </CardTitle>
              <CardDescription>Sistema di raffreddamento della sala</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Stato Sistema</p>
                    <p className="text-sm text-muted-foreground">
                      {coolingStatus ? "Sistema attivo" : "Sistema spento"}
                    </p>
                  </div>
                  <Switch checked={coolingStatus} onCheckedChange={setCoolingStatus} />
                </div>

                {coolingStatus && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Livello Raffreddamento: {coolingLevel}</Label>
                      <Slider
                        value={[coolingLevel]}
                        onValueChange={(value) => setCoolingLevel(value[0])}
                        max={5}
                        min={1}
                        step={1}
                        className="mt-2"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>Min (1)</span>
                        <span>Max (5)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Racks */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Rack</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {room.racks.map((rack) => (
              <Card
                key={rack.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(`/rooms/${roomId}/racks/${rack.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          rack.type === "air-cooled" ? "bg-orange-100 text-orange-600" : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        {rack.type === "air-cooled" ? <Wind className="h-5 w-5" /> : <Waves className="h-5 w-5" />}
                      </div>
                      <div>
                        <CardTitle className="text-base">{rack.name}</CardTitle>
                        <CardDescription>{rack.location}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        <Wifi className="h-3 w-3 mr-1" />
                        Attivo
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Tipo:</span>
                        <div className="font-semibold">
                          {rack.type === "air-cooled" ? "Raffreddamento ad Aria" : "Raffreddamento ad Acqua"}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Smart Objects:</span>
                        <div className="font-semibold">{rack.smartObjects.length}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">Dispositivi:</div>
                      <div className="flex flex-wrap gap-1">
                        {rack.smartObjects.map((obj) => (
                          <Badge key={obj.id} variant="outline" className="text-xs">
                            {obj.name}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Ultimo aggiornamento:</span>
                      <span>{rack.lastUpdate}</span>
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
