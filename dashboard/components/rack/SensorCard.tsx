"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Wind,
    Gauge,
    Zap,
    Thermometer,
    Activity,
    CheckCircle,
} from "lucide-react"
import { Sensor } from "@/types/sensor"
import { formatName, formatType } from "@/lib/utils"

const sensorIcons = {
    airspeed: Wind,
    pressure: Gauge,
    energy: Zap,
    temperature: Thermometer,
}

interface SensorCardProps {
    sensor: Sensor
}

export function SensorCard({ sensor }: SensorCardProps) {
    const SensorIcon = sensorIcons[formatType(sensor.type) as keyof typeof sensorIcons] || Activity

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 justify-between">
                    {formatName(sensor.resource_id)}
                    <SensorIcon className="h-5 w-5" />
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <CardDescription>Last known value:</CardDescription>
                    <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                            {sensor.value} {sensor.unit}
                        </span>
                        <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">
                            Thresholds: {sensor.min} {sensor.unit} - {sensor.max} {sensor.unit}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Last updated: {sensor.timestamp}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
