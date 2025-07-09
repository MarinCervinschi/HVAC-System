"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Activity,
    CheckCircle,
} from "lucide-react"
import { SmartObject } from "@/types/smartobject"
import { formatName } from "@/lib/utils"

interface TelemetryTableProps {
    smartObject: SmartObject
}



export function TelemetryTable({ smartObject }: TelemetryTableProps) {

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
                    {smartObject.sensors?.map((sensor) => {

                        return (
                            <div key={sensor.resource_id} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-medium">{formatName(sensor.resource_id)}</h4>
                                    <div className="text-sm text-muted-foreground font-semibold">
                                        Current: <span className="font-medium">{sensor.value} {sensor.unit}</span>
                                    </div>
                                </div>
                                <div className="rounded-md border">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b bg-muted/50">
                                                    <th className="h-10 px-4 text-left align-middle font-medium">Value</th>
                                                    <th className="h-10 px-4 text-left align-middle font-medium">Status</th>
                                                    <th className="h-10 px-4 text-left align-middle font-medium">Timestamp</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {(sensor.history || []).length > 0 ? (
                                                    (sensor.history || []).slice(-9).map((dataPoint, index) => {
                                                
                                                        return (
                                                            <tr key={index} className="border-b">
                                                                <td className="h-10 px-4 align-middle font-medium">
                                                                    {dataPoint.value} {sensor.unit}
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
                                                                    {dataPoint.time}
                                                                </td>
                                                            </tr>
                                                        )
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="h-16 px-4 text-center text-muted-foreground">
                                                            No telemetry data available yet. Waiting for sensor readings...
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>   
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
