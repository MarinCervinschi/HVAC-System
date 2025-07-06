"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Activity,
    AlertTriangle,
    CheckCircle,
} from "lucide-react"
import { SmartObject } from "@/types/smartobject"

interface TelemetryTableProps {
    smartObject: SmartObject
    //getSensorPolicy: (sensor: Sensor) => { min: number; max: number }
}



export function TelemetryTable({ smartObject, /*getSensorPolicy*/ }: TelemetryTableProps) {
    //const sensorsWithData = smartObject.sensors.filter((sensor) => sensor.data && sensor.data.length > 0)

    
    const sensorsWithData = [
        {
            id: "sensor-1",
            name: "Temperature",
            unit: "°C",
            data: [
                { time: "10:00", value: 22.5, timestamp: "2024-06-01T10:00:00Z" },
                { time: "10:05", value: 22.7, timestamp: "2024-06-01T10:05:00Z" },
                // ...other readings
            ]
        },
        {
            id: "sensor-2",
            name: "Humidity",
            unit: "%",
            data: [
                { time: "10:00", value: 45, timestamp: "2024-06-01T10:00:00Z" },
                { time: "10:05", value: 46, timestamp: "2024-06-01T10:05:00Z" },
                // ...other readings
            ]
        }
    ]
    
    if (sensorsWithData.length === 0) return null

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Telemetry Data - {smartObject.id}
                </CardTitle>
                <CardDescription>Sensor readings history</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {sensorsWithData.map((sensor) => {
                        //const policy = getSensorPolicy(sensor)

                        return (
                            <div key={sensor.id} className="space-y-2">
                                <h4 className="font-medium">{sensor.name}</h4>
                                <div className="rounded-md border">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted/50">
                                                    <th className="h-10 px-4 text-left align-middle font-medium">Time</th>
                                                    <th className="h-10 px-4 text-left align-middle font-medium">Value</th>
                                                    <th className="h-10 px-4 text-left align-middle font-medium">Status</th>
                                                    <th className="h-10 px-4 text-left align-middle font-medium">Timestamp</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sensor.data!.slice(-10).map((dataPoint, index) => {
                                                    /*const isOverThreshold = 
                                                        dataPoint.value < policy.min || dataPoint.value > policy.max
                                                    */
                                                    return (
                                                        <tr key={index} className="border-b">
                                                            <td className="h-10 px-4 align-middle">{dataPoint.time}</td>
                                                            <td className="h-10 px-4 align-middle font-medium">
                                                                {dataPoint.value}
                                                                {sensor.unit}
                                                            </td>
                                                            <td className="h-10 px-4 align-middle">
                                                                {/*isOverThreshold ? (
                                                                    <Badge variant="destructive" className="text-xs">
                                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                                        Out of range
                                                                    </Badge>
                                                                ) : */(
                                                                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                                        Normal
                                                                    </Badge>
                                                                )}
                                                            </td>
                                                            <td className="h-10 px-4 align-middle text-muted-foreground">
                                                                {dataPoint.timestamp}
                                                            </td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                {/*
                                    <div className="text-xs text-muted-foreground">
                                        Policy: {policy.min}
                                        {sensor.unit} - {policy.max}
                                        {sensor.unit} | Mostrando le ultime 10 letture
                                    </div>
                                */}
                               
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
