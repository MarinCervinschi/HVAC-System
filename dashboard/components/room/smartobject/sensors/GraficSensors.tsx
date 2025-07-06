"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Thermometer, Droplets, Gauge, Eye, Zap, Wind } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { SmartObject } from "@/types/smartobject"
import { Sensor } from "@/types/sensor"
import { formatName, formatType } from "@/lib/utils"

interface SensorConfig {
    type: string
    icon: React.ComponentType<any>
    color: string
    bgColor: string
    borderColor: string
}

interface GraficSensorsProps {
    smartObject: SmartObject
    sensorTypes?: string[]
}

const defaultSensorConfigs: Record<string, SensorConfig> = {
    temperature: {
        type: "temperature",
        icon: Thermometer,
        color: "#ef4444",
        bgColor: "bg-red-50/30",
        borderColor: "border-red-400"
    },
    humidity: {
        type: "humidity",
        icon: Droplets,
        color: "#3b82f6",
        bgColor: "bg-blue-50/30",
        borderColor: "border-blue-400"
    },
    pressure: {
        type: "pressure",
        icon: Gauge,
        color: "#10b981",
        bgColor: "bg-green-50/30",
        borderColor: "border-green-400"
    },
    power: {
        type: "power",
        icon: Zap,
        color: "#8b5cf6",
        bgColor: "bg-purple-50/30",
        borderColor: "border-purple-400"
    },
    airflow: {
        type: "airflow",
        icon: Wind,
        color: "#06b6d4",
        bgColor: "bg-cyan-50/30",
        borderColor: "border-cyan-400"
    }
}

// Funzione per generare dati mock per i grafici
const generateMockData = (baseValue: number, variance: number = 2) => {
    const data = []
    const startTime = new Date()
    startTime.setMinutes(startTime.getMinutes() - 32)

    for (let i = 0; i < 8; i++) {
        const time = new Date(startTime)
        time.setMinutes(time.getMinutes() + i * 4)
        const value = baseValue + (Math.random() - 0.5) * variance
        data.push({
            time: time.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
            value: Math.round(value * 10) / 10
        })
    }
    return data
}


export default function GraficSensors({ smartObject, sensorTypes }: GraficSensorsProps) {

    const getSensorConfig = (sensor: Sensor): SensorConfig => {
        const defaultConfig = defaultSensorConfigs[formatType(sensor.type)];
        console.log(`Getting config for sensor: ${sensor.resource_id} (${formatType(sensor.type)})`)

        if (!defaultConfig) {
            // Configurazione di fallback per sensori sconosciuti
            return {
                type: sensor.type,
                icon: Gauge,
                color: "#6b7280",
                bgColor: "bg-gray-50/30",
                borderColor: "border-gray-400",
            }
        }

        return defaultConfig;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Thermometer className="h-5 w-5" />
                    {formatName(smartObject.id)}
                </CardTitle>
                <CardDescription>Monitoraggio ambientale della sala</CardDescription>
            </CardHeader>

            <CardContent>
                <div className={`grid gap-6 ${smartObject.sensors.length === 1 ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
                    {smartObject.sensors.map((sensor, index) => {
                        console.log(`Rendering sensor: ${sensor.resource_id} (${sensor.type}) with value: ${sensor.value}${sensor.unit}`)
                        const config = getSensorConfig(sensor)
                        const IconComponent = config.icon
                        const mockData = generateMockData(sensor.value)

                        return (
                            <div
                                key={`${sensor.type}-${index}`}
                                className={`border-2 ${config.borderColor} ${config.bgColor} p-6 rounded-lg space-y-4 hover:shadow-md transition-shadow`}
                            >
                                <div>
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold">{formatType(sensor.type).charAt(0).toUpperCase() + formatType(sensor.type).slice(1)} Sensor</h4>
                                        <IconComponent className="h-8 w-8" style={{ color: config.color }} />
                                    </div>
                                </div>
                                <p className="text-2xl font-bold mb-2">
                                    {sensor.value} {sensor.unit}
                                </p>
                                <div className="h-32">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={mockData}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="time" />
                                            <YAxis />
                                            <Tooltip />
                                            <Line
                                                type="monotone"
                                                dataKey="value"
                                                stroke={config.color}
                                                strokeWidth={2}
                                                dot={false}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Policy: {sensor.min} {sensor.unit} - {sensor.max} {sensor.unit}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
