"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
    Activity,
    Wifi,
    WifiOff,
    RefreshCw,
} from "lucide-react"
import {Rack} from "@/types/rack"
import { formatName } from "@/lib/utils"


interface RackStatusCardProps {
    rackInfo: Rack
    rackActive: boolean
    isToggling: boolean
    onRackToggle: (checked: boolean) => void
}

export function RackStatusCard({ rackInfo, rackActive, isToggling, onRackToggle }: RackStatusCardProps) {
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl">{formatName(rackInfo.rack_id)}</CardTitle>
                        <CardDescription>
                            {formatName(rackInfo.room_id)}
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
                        <div className="text-2xl font-bold">{rackInfo.smart_objects.length}</div>
                    </div>
                    <div className="border p-6 rounded-lg space-y-8">
                        <div className="flex flex-row justify-between">
                            <div className="text-sm font-bold text-muted-foreground">Dispositivi Attivi</div>
                            <Wifi className="h-4 w-4 text-green-600" />
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                            {rackActive ? rackInfo.smart_objects.reduce((count, smartObject) => 
                                count + smartObject.actuators.filter(actuator => actuator.status === "ON").length + smartObject.sensors.length, 0
                            ) : 0}
                        </div>
                    </div>
                    <div className="border p-6 rounded-lg space-y-8">
                        <div className="flex flex-row justify-between">
                            <div className="text-sm font-bold text-muted-foreground">Dispositivi Inattivi</div>
                            <WifiOff className="h-4 w-4 text-red-600" />
                        </div>
                        <div className="text-2xl font-bold text-red-600">
                            {rackActive
                                ? rackInfo.smart_objects.reduce((count, smartObject) => 
                                    count + smartObject.actuators.filter(actuator => actuator.status === "OFF").length, 0
                                )
                                : rackInfo.smart_objects.reduce((count, smartObject) => 
                                    count + smartObject.actuators.length + smartObject.sensors.length, 0
                                )}
                        </div>
                    </div>
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium">Stato Rack</p>
                        <p className="text-sm text-muted-foreground">
                            {rackActive ? "Rack operativo" : "Rack spento"}
                        </p>
                    </div>
                    <Switch checked={rackActive} onCheckedChange={onRackToggle} disabled={isToggling} />
                </div>
                {isToggling && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Aggiornamento rack in corso...
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
