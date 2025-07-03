"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Wifi,
  WifiOff,
  Settings,
  Download,
  RefreshCw,
  Thermometer,
  Droplets,
  Zap,
  Gauge,
  Activity,
  AlertTriangle,
  CheckCircle,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { getDeviceById } from "@/lib/device-data"

const iconMap = {
  Thermometer,
  Droplets,
  Zap,
  Gauge,
}

const telemetryIcons = {
  temperature: Thermometer,
  humidity: Droplets,
  power: Zap,
  voltage: Activity,
  current: Activity,
  pressure: Gauge,
}

const telemetryColors = {
  temperature: "#ef4444",
  humidity: "#3b82f6",
  power: "#f59e0b",
  voltage: "#10b981",
  current: "#8b5cf6",
  pressure: "#06b6d4",
}

export default function DeviceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const deviceId = Number.parseInt(params.id as string)
  const device = getDeviceById(deviceId)

  const [isDeviceOn, setIsDeviceOn] = useState(device?.status === "active")
  const [isToggling, setIsToggling] = useState(false)

  if (!device) {
    return (
      <div className="flex flex-col min-h-full">
        {/* Page Header */}
        <div className="flex h-16 shrink-0 items-center gap-2 border-b px-4 md:px-8">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Indietro
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Dispositivo non trovato</h1>
            <p className="text-muted-foreground">Il dispositivo richiesto non esiste.</p>
          </div>
        </div>
      </div>
    )
  }

  const handleDeviceToggle = async (checked: boolean) => {
    setIsToggling(true)
    // Simula una chiamata API
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsDeviceOn(checked)
    setIsToggling(false)
  }

  const IconComponent = iconMap[device.icon as keyof typeof iconMap]

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
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                isDeviceOn ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
              }`}
            >
              <IconComponent className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-semibold">{device.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Esporta Dati
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurazioni
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        {/* Rest of the component remains the same */}
        {/* Device Info and Control */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{device.name}</CardTitle>
                  <CardDescription className="text-base mt-1">{device.location}</CardDescription>
                </div>
                <Badge
                  variant="secondary"
                  className={`${isDeviceOn ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  {isDeviceOn ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
                  {isDeviceOn ? "Online" : "Offline"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Modello:</span>
                  <div className="font-semibold">{device.model}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Seriale:</span>
                  <div className="font-semibold">{device.serialNumber}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Installazione:</span>
                  <div className="font-semibold">{device.installationDate}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Ultimo Aggiornamento:</span>
                  <div className="font-semibold">{device.lastUpdate}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Controllo Dispositivo</CardTitle>
              <CardDescription>Accendi o spegni il dispositivo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Stato Dispositivo</p>
                  <p className="text-sm text-muted-foreground">
                    {isDeviceOn ? "Dispositivo attivo" : "Dispositivo spento"}
                  </p>
                </div>
                <Switch checked={isDeviceOn} onCheckedChange={handleDeviceToggle} disabled={isToggling} />
              </div>
              {isToggling && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Aggiornamento in corso...
                </div>
              )}
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Valore Corrente:</span>
                  <span className="font-semibold">{isDeviceOn ? device.currentValue : "N/A"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Tipo:</span>
                  <span className="font-semibold">{device.type}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Telemetries */}
        {isDeviceOn && Object.keys(device.telemetries).length > 0 ? (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Telemetrie</h2>

            {/* Telemetry Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(device.telemetries).map(([key, telemetry]) => {
                const TelemetryIcon = telemetryIcons[key as keyof typeof telemetryIcons] || Activity
                const isOverThreshold =
                  telemetry.current !== null &&
                  (telemetry.current < telemetry.threshold.min || telemetry.current > telemetry.threshold.max)

                return (
                  <Card key={key}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium capitalize">
                        {key === "power"
                          ? "Potenza"
                          : key === "voltage"
                            ? "Tensione"
                            : key === "current"
                              ? "Corrente"
                              : key === "temperature"
                                ? "Temperatura"
                                : key === "humidity"
                                  ? "Umidità"
                                  : key === "pressure"
                                    ? "Pressione"
                                    : key}
                      </CardTitle>
                      <TelemetryIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold">
                            {telemetry.current !== null ? `${telemetry.current}${telemetry.unit}` : "N/A"}
                          </span>
                          {isOverThreshold ? (
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <div>
                            <div>Min: {telemetry.min !== null ? `${telemetry.min}${telemetry.unit}` : "N/A"}</div>
                          </div>
                          <div>
                            <div>
                              Media: {telemetry.average !== null ? `${telemetry.average}${telemetry.unit}` : "N/A"}
                            </div>
                          </div>
                          <div>
                            <div>Max: {telemetry.max !== null ? `${telemetry.max}${telemetry.unit}` : "N/A"}</div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Soglia: {telemetry.threshold.min}
                          {telemetry.unit} - {telemetry.threshold.max}
                          {telemetry.unit}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Telemetry Charts */}
            <div className="space-y-6">
              {Object.entries(device.telemetries).map(([key, telemetry]) => {
                if (!telemetry.data || telemetry.data.length === 0) return null

                const TelemetryIcon = telemetryIcons[key as keyof typeof telemetryIcons] || Activity
                const color = telemetryColors[key as keyof typeof telemetryColors] || "#8884d8"

                return (
                  <Card key={`chart-${key}`}>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <TelemetryIcon className="h-5 w-5" />
                        <CardTitle className="capitalize">
                          Grafico{" "}
                          {key === "power"
                            ? "Potenza"
                            : key === "voltage"
                              ? "Tensione"
                              : key === "current"
                                ? "Corrente"
                                : key === "temperature"
                                  ? "Temperatura"
                                  : key === "humidity"
                                    ? "Umidità"
                                    : key === "pressure"
                                      ? "Pressione"
                                      : key}
                        </CardTitle>
                      </div>
                      <CardDescription>
                        Andamento nelle ultime 24 ore - Soglia: {telemetry.threshold.min}
                        {telemetry.unit} - {telemetry.threshold.max}
                        {telemetry.unit}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={telemetry.data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip
                              formatter={(value) => [`${value}${telemetry.unit}`, key]}
                              labelFormatter={(label) => `Ora: ${label}`}
                            />
                            <ReferenceLine
                              y={telemetry.threshold.max}
                              stroke="#ef4444"
                              strokeDasharray="5 5"
                              label="Soglia Max"
                            />
                            <ReferenceLine
                              y={telemetry.threshold.min}
                              stroke="#ef4444"
                              strokeDasharray="5 5"
                              label="Soglia Min"
                            />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke={color}
                              strokeWidth={2}
                              dot={{ fill: color, strokeWidth: 2, r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <WifiOff className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Dispositivo Offline</h3>
              <p className="text-muted-foreground text-center">
                Il dispositivo è attualmente spento o non disponibile. Accendilo per visualizzare le telemetrie.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
