"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, AlertCircle, CheckCircle, Clock, Thermometer, Droplets, Zap, X } from "lucide-react"

const alerts = [
  {
    id: 1,
    title: "Temperatura Elevata",
    device: "Sensore Temperatura - Sala Server",
    location: "Sala Server",
    severity: "high",
    status: "active",
    message: "La temperatura ha superato la soglia di 25°C",
    currentValue: "26.8°C",
    threshold: "25°C",
    timestamp: "2024-01-15 14:30:25",
    duration: "15 min",
    icon: Thermometer,
  },
  {
    id: 2,
    title: "Umidità Critica",
    device: "Sensore Umidità - Magazzino",
    location: "Magazzino",
    severity: "critical",
    status: "active",
    message: "Livello di umidità critico rilevato",
    currentValue: "85%",
    threshold: "75%",
    timestamp: "2024-01-15 14:25:10",
    duration: "20 min",
    icon: Droplets,
  },
  {
    id: 3,
    title: "Consumo Energetico Anomalo",
    device: "Contatore Energia - Produzione",
    location: "Area Produzione",
    severity: "medium",
    status: "active",
    message: "Consumo energetico superiore alla media",
    currentValue: "5.2 kW",
    threshold: "4.5 kW",
    timestamp: "2024-01-15 14:15:45",
    duration: "35 min",
    icon: Zap,
  },
  {
    id: 4,
    title: "Temperatura Normalizzata",
    device: "Sensore Temperatura - Laboratorio",
    location: "Laboratorio",
    severity: "low",
    status: "resolved",
    message: "La temperatura è tornata nei parametri normali",
    currentValue: "23.2°C",
    threshold: "25°C",
    timestamp: "2024-01-15 13:45:20",
    duration: "Risolto",
    icon: Thermometer,
  },
  {
    id: 5,
    title: "Dispositivo Offline",
    device: "Sensore Temperatura - Laboratorio",
    location: "Laboratorio",
    severity: "high",
    status: "acknowledged",
    message: "Il dispositivo non risponde da oltre 2 ore",
    currentValue: "N/A",
    threshold: "N/A",
    timestamp: "2024-01-15 12:30:15",
    duration: "2h 15min",
    icon: AlertCircle,
  },
  {
    id: 6,
    title: "Umidità Ottimale",
    device: "Sensore Umidità - Ufficio",
    location: "Ufficio",
    severity: "low",
    status: "resolved",
    message: "Livello di umidità tornato nella norma",
    currentValue: "62%",
    threshold: "70%",
    timestamp: "2024-01-15 11:20:30",
    duration: "Risolto",
    icon: Droplets,
  },
]

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-800 border-red-200"
    case "high":
      return "bg-orange-100 text-orange-800 border-orange-200"
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "low":
      return "bg-blue-100 text-blue-800 border-blue-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "active":
      return "bg-red-100 text-red-800"
    case "acknowledged":
      return "bg-yellow-100 text-yellow-800"
    case "resolved":
      return "bg-green-100 text-green-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
      return AlertTriangle
    case "acknowledged":
      return Clock
    case "resolved":
      return CheckCircle
    default:
      return AlertCircle
  }
}

export default function AlertsPage() {
  const activeAlerts = alerts.filter((alert) => alert.status === "active")
  const acknowledgedAlerts = alerts.filter((alert) => alert.status === "acknowledged")
  const resolvedAlerts = alerts.filter((alert) => alert.status === "resolved")

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alert Attivi</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{activeAlerts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Riconosciuti</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{acknowledgedAlerts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risolti Oggi</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{resolvedAlerts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totale Alert</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Active Alerts */}
        {activeAlerts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-red-600">Alert Attivi</h2>
            <div className="space-y-3">
              {activeAlerts.map((alert) => {
                const IconComponent = alert.icon
                const StatusIcon = getStatusIcon(alert.status)
                return (
                  <Card key={alert.id} className="border-l-4 border-l-red-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 text-red-600">
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{alert.title}</CardTitle>
                            <CardDescription>
                              {alert.device} - {alert.location}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
                          <Badge className={getStatusColor(alert.status)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {alert.status.toUpperCase()}
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm">{alert.message}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Valore Attuale:</span>
                            <div className="font-semibold">{alert.currentValue}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Soglia:</span>
                            <div className="font-semibold">{alert.threshold}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Durata:</span>
                            <div className="font-semibold">{alert.duration}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Timestamp:</span>
                            <div className="font-semibold">{alert.timestamp}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Riconosci
                          </Button>
                          <Button size="sm" variant="outline">
                            Risolvi
                          </Button>
                          <Button size="sm" variant="outline">
                            Dettagli
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Acknowledged Alerts */}
        {acknowledgedAlerts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-yellow-600">Alert Riconosciuti</h2>
            <div className="space-y-3">
              {acknowledgedAlerts.map((alert) => {
                const IconComponent = alert.icon
                const StatusIcon = getStatusIcon(alert.status)
                return (
                  <Card key={alert.id} className="border-l-4 border-l-yellow-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{alert.title}</CardTitle>
                            <CardDescription>
                              {alert.device} - {alert.location}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
                          <Badge className={getStatusColor(alert.status)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {alert.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm">{alert.message}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Valore Attuale:</span>
                            <div className="font-semibold">{alert.currentValue}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Soglia:</span>
                            <div className="font-semibold">{alert.threshold}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Durata:</span>
                            <div className="font-semibold">{alert.duration}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Timestamp:</span>
                            <div className="font-semibold">{alert.timestamp}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Risolvi
                          </Button>
                          <Button size="sm" variant="outline">
                            Dettagli
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Resolved Alerts */}
        {resolvedAlerts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-green-600">Alert Risolti</h2>
            <div className="space-y-3">
              {resolvedAlerts.map((alert) => {
                const IconComponent = alert.icon
                const StatusIcon = getStatusIcon(alert.status)
                return (
                  <Card key={alert.id} className="border-l-4 border-l-green-500 opacity-75">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{alert.title}</CardTitle>
                            <CardDescription>
                              {alert.device} - {alert.location}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
                          <Badge className={getStatusColor(alert.status)}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {alert.status.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm">{alert.message}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Valore Attuale:</span>
                            <div className="font-semibold">{alert.currentValue}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Soglia:</span>
                            <div className="font-semibold">{alert.threshold}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Stato:</span>
                            <div className="font-semibold">{alert.duration}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Timestamp:</span>
                            <div className="font-semibold">{alert.timestamp}</div>
                          </div>
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
