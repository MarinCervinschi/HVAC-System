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
    Server,
    Wind,
    Waves,
    Zap,
    Thermometer,
    Gauge,
    Activity,
    Settings,
    Download,
    RefreshCw,
    Wifi,
    AlertTriangle,
    CheckCircle,
    WifiOff,
} from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts"
import { getRoomById, getRackById, type SmartObject, type Sensor, type Actuator } from "@/lib/datacenter-data"

const smartObjectIcons = {
    airflow: Wind,
    waterloop: Waves,
    energy: Zap,
    "rack-cooling": Thermometer,
}

const sensorIcons = {
    airspeed: Wind,
    pressure: Gauge,
    power: Zap,
    temperature: Thermometer,
}

const actuatorIcons = {
    fan: Wind,
    pump: Waves,
    "power-switch": Zap,
    "rack-fan": Thermometer,
}

const sensorColors = {
    airspeed: "#f59e0b",
    pressure: "#06b6d4",
    power: "#10b981",
    temperature: "#ef4444",
}

export default function RackDetailPage() {
    const params = useParams()
    const router = useRouter()
    const roomId = params.id as string
    const rackId = params.rackId as string
    const room = getRoomById(roomId)
    const rack = getRackById(roomId, rackId)

    const [rackActive, setRackActive] = useState(rack?.status === "active")


    // Stati per i controlli
    const [actuatorStates, setActuatorStates] = useState<Record<string, { status: "on" | "off"; level?: number }>>({})
    const [sensorPolicies, setSensorPolicies] = useState<Record<string, { min: number; max: number }>>({})
    const [isToggling, setIsToggling] = useState<Record<string, boolean>>({})

    if (!room || !rack) {
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
                        <h1 className="text-2xl font-bold mb-2">Rack non trovato</h1>
                        <p className="text-muted-foreground">Il rack richiesto non esiste.</p>
                    </div>
                </div>
            </div>
        )
    }

    const handleActuatorToggle = async (actuatorId: string, checked: boolean) => {
        setIsToggling((prev) => ({ ...prev, [actuatorId]: true }))
        // Simula una chiamata API
        await new Promise((resolve) => setTimeout(resolve, 1000))
        setActuatorStates((prev) => ({
            ...prev,
            [actuatorId]: { ...prev[actuatorId], status: checked ? "on" : "off" },
        }))
        setIsToggling((prev) => ({ ...prev, [actuatorId]: false }))
    }

    const handleLevelChange = (actuatorId: string, level: number) => {
        setActuatorStates((prev) => ({
            ...prev,
            [actuatorId]: { ...prev[actuatorId], level },
        }))
    }

    const handlePolicyChange = (sensorId: string, policy: { min: number; max: number }) => {
        setSensorPolicies((prev) => ({
            ...prev,
            [sensorId]: policy,
        }))
    }

    const getActuatorState = (actuatorId: string, defaultStatus: "on" | "off", defaultLevel?: number) => {
        return actuatorStates[actuatorId] || { status: defaultStatus, level: defaultLevel }
    }

    const getSensorPolicy = (sensor: Sensor) => {
        return sensorPolicies[sensor.id] || sensor.policy
    }

    const renderSensorCard = (sensor: Sensor) => {
        const SensorIcon = sensorIcons[sensor.type as keyof typeof sensorIcons] || Activity
        const color = sensorColors[sensor.type as keyof typeof sensorColors] || "#8884d8"
        const policy = getSensorPolicy(sensor)
        const isOverThreshold = sensor.currentValue < policy.min || sensor.currentValue > policy.max

        return (
            <Card key={sensor.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{sensor.name}</CardTitle>
                    <SensorIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold">
                                {sensor.currentValue}
                                {sensor.unit}
                            </span>
                            {isOverThreshold ? (
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                            ) : (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Policy: {policy.min}
                            {sensor.unit} - {policy.max}
                            {sensor.unit}
                        </div>
                        <div className="text-xs text-muted-foreground">Ultimo aggiornamento: {sensor.lastUpdate}</div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const renderActuatorCard = (actuator: Actuator) => {
        const ActuatorIcon = actuatorIcons[actuator.type as keyof typeof actuatorIcons] || Activity
        const state = getActuatorState(actuator.id, actuator.status, actuator.currentLevel)
        const isTogglingActuator = isToggling[actuator.id] || false

        return (
            <Card key={actuator.id}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ActuatorIcon className="h-5 w-5" />
                        {actuator.name}
                    </CardTitle>
                    <CardDescription>Controllo attuatore</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Stato</p>
                            <p className="text-sm text-muted-foreground">{state.status === "on" ? "Attivo" : "Spento"}</p>
                        </div>
                        <Switch
                            checked={state.status === "on"}
                            onCheckedChange={(checked) => handleActuatorToggle(actuator.id, checked)}
                            disabled={isTogglingActuator}
                        />
                    </div>

                    {isTogglingActuator && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Aggiornamento in corso...
                        </div>
                    )}

                    {state.status === "on" && actuator.maxLevel && (
                        <div className="space-y-4">
                            <Separator />
                            <div>
                                <Label className="text-sm font-medium">
                                    {actuator.type === "fan"
                                        ? "Velocità Ventole"
                                        : actuator.type === "pump"
                                            ? "Velocità Pompa"
                                            : "Livello"}
                                    {state.level || actuator.currentLevel}
                                </Label>
                                <Slider
                                    value={[state.level || actuator.currentLevel || 1]}
                                    onValueChange={(value) => handleLevelChange(actuator.id, value[0])}
                                    max={actuator.maxLevel}
                                    min={1}
                                    step={1}
                                    className="mt-2"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                    <span>Min (1)</span>
                                    <span>Max ({actuator.maxLevel})</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="text-xs text-muted-foreground">Ultimo aggiornamento: {actuator.lastUpdate}</div>
                </CardContent>
            </Card>
        )
    }

    const renderSmartObjectTable = (smartObject: SmartObject) => {
        const sensorsWithData = smartObject.sensors.filter((sensor) => sensor.data && sensor.data.length > 0)

        if (sensorsWithData.length === 0) return null

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Dati Telemetrie - {smartObject.name}
                    </CardTitle>
                    <CardDescription>Storico delle letture dei sensori</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {sensorsWithData.map((sensor) => {
                            const policy = getSensorPolicy(sensor)

                            return (
                                <div key={sensor.id} className="space-y-2">
                                    <h4 className="font-medium">{sensor.name}</h4>
                                    <div className="rounded-md border">
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b bg-muted/50">
                                                        <th className="h-10 px-4 text-left align-middle font-medium">Ora</th>
                                                        <th className="h-10 px-4 text-left align-middle font-medium">Valore</th>
                                                        <th className="h-10 px-4 text-left align-middle font-medium">Stato</th>
                                                        <th className="h-10 px-4 text-left align-middle font-medium">Timestamp</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {sensor.data.slice(-10).map((dataPoint, index) => {
                                                        const isOverThreshold = dataPoint.value < policy.min || dataPoint.value > policy.max
                                                        return (
                                                            <tr key={index} className="border-b">
                                                                <td className="h-10 px-4 align-middle">{dataPoint.time}</td>
                                                                <td className="h-10 px-4 align-middle font-medium">
                                                                    {dataPoint.value}
                                                                    {sensor.unit}
                                                                </td>
                                                                <td className="h-10 px-4 align-middle">
                                                                    {isOverThreshold ? (
                                                                        <Badge variant="destructive" className="text-xs">
                                                                            <AlertTriangle className="h-3 w-3 mr-1" />
                                                                            Fuori soglia
                                                                        </Badge>
                                                                    ) : (
                                                                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                                            Normale
                                                                        </Badge>
                                                                    )}
                                                                </td>
                                                                <td className="h-10 px-4 align-middle text-muted-foreground">{dataPoint.timestamp}</td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Policy: {policy.min}
                                        {sensor.unit} - {policy.max}
                                        {sensor.unit} | Mostrando le ultime 10 letture
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        )
    }


    const renderPolicyDialog = (smartObject: SmartObject) => {
        const sensorsWithPolicies = smartObject.sensors.filter((sensor) => sensor.policy)

        if (sensorsWithPolicies.length === 0) return null

        return (
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Policy {smartObject.name}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Policy - {smartObject.name}</DialogTitle>
                        <DialogDescription>Configura le soglie per i sensori</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {sensorsWithPolicies.map((sensor) => {
                            const policy = getSensorPolicy(sensor)
                            return (
                                <div key={sensor.id} className="space-y-2">
                                    <Label>
                                        {sensor.name} ({sensor.unit})
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label htmlFor={`${sensor.id}-min`} className="text-xs">
                                                Min
                                            </Label>
                                            <Input
                                                id={`${sensor.id}-min`}
                                                type="number"
                                                value={policy.min}
                                                onChange={(e) =>
                                                    handlePolicyChange(sensor.id, {
                                                        ...policy,
                                                        min: Number(e.target.value),
                                                    })
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Label htmlFor={`${sensor.id}-max`} className="text-xs">
                                                Max
                                            </Label>
                                            <Input
                                                id={`${sensor.id}-max`}
                                                type="number"
                                                value={policy.max}
                                                onChange={(e) =>
                                                    handlePolicyChange(sensor.id, {
                                                        ...policy,
                                                        max: Number(e.target.value),
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <Button>Salva Policy</Button>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <div className="flex flex-col min-h-full">


            <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
                {/* Rack Info */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl">{rack.name}</CardTitle>
                                <CardDescription>
                                    {rack.location} - {room.name}
                                </CardDescription>
                            </div>
                            <Badge
                                variant="secondary"
                                className={rackActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                            >
                                <Wifi className="h-3 w-3 mr-1" />
                                {rackActive ? "Attivo" : "Inattivo"}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="border p-6 rounded-lg space-y-8">
                                <div className="flex flex-row justify-between">
                                    <div className="text-sm font-bold text-muted-foreground">Dispositivi Totali</div>
                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="text-2xl font-bold">{rack.smartObjects.length}</div>
                            </div>
                            <div className="border p-6 rounded-lg space-y-8">
                                <div className="flex flex-row justify-between">
                                    <div className="text-sm font-bold text-muted-foreground">Dispositivi Attivi</div>
                                    <Wifi className="h-4 w-4 text-green-600" />
                                </div>
                                <div className="text-2xl font-bold text-green-600">
                                    {rackActive ? rack.smartObjects.filter((obj) => obj.status === "active").length : 0}
                                </div>
                            </div>
                            <div className="border p-6 rounded-lg space-y-8">
                                <div className="flex flex-row justify-between">
                                    <div className="text-sm font-bold text-muted-foreground">Dispositivi Inattivi</div>
                                    <WifiOff className="h-4 w-4 text-red-600" />
                                </div>
                                <div className="text-2xl font-bold text-red-600">
                                    {rackActive
                                        ? rack.smartObjects.filter((obj) => obj.status === "inactive").length
                                        : rack.smartObjects.length}
                                </div>
                            </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-medium">Stato Rack</p>
                                <p className="text-sm text-muted-foreground">{rackActive ? "Rack operativo" : "Rack spento"}</p>
                            </div>
                            <Switch checked={rackActive} onCheckedChange={setRackActive} />
                        </div>
                    </CardContent>
                </Card>


                {/* Smart Objects */}
                {rack.smartObjects.map((smartObject) => {
                    const SmartObjectIcon = smartObjectIcons[smartObject.type as keyof typeof smartObjectIcons] || Server

                    return (
                        <div key={smartObject.id} className="border p-6 rounded-lg space-y-10">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-semibold flex items-center gap-2">
                                    <SmartObjectIcon className="h-6 w-6" />
                                    {smartObject.name}
                                </h2>
                                {renderPolicyDialog(smartObject)}
                            </div>

                            <div className="grid grid-cols-2 gap-20 ">
                                <div className="space-y-6">
                                    {/* Sensori */}
                                    {smartObject.sensors.length > 0 && (
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold">Sensori</h3>
                                            <div className="flex flex-col">
                                                {smartObject.sensors.map(renderSensorCard)}
                                            </div>
                                        </div>
                                    )}

                                    {/* Attuatori */}
                                    {smartObject.actuators.length > 0 && (
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold">Attuatori</h3>
                                            <div className="flex flex-col">{smartObject.actuators.map(renderActuatorCard)}</div>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold">Telemetrie</h3>
                                    {renderSmartObjectTable(smartObject)}
                                </div>
                            </div>

                        </div>
                    )
                })}
            </div>
        </div>
    )
}
