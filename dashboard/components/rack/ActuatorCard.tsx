"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
    Wind,
    Waves,
    Zap,
    Activity,
    RefreshCw,
    Snowflake,
} from "lucide-react"
import { Actuator } from "@/types/actuator"
import { formatName } from "@/lib/utils"

const actuatorIcons = {
    fan: Wind,
    pump: Waves,
    switch: Zap,
    cooling_levels: Snowflake,
}

interface ActuatorCardProps {
    actuator: Actuator
    rackActive: boolean
    actuatorState: { status: "ON" | "OFF"; level?: number; speed?: number }
    isToggling: boolean
    onToggle: (actuatorId: string, checked: boolean) => Promise<void>
    onLevelChange: (actuatorId: string, level: number) => Promise<void>
}

export function ActuatorCard({
    actuator,
    rackActive,
    actuatorState,
    isToggling,
    onToggle,
    onLevelChange,
}: ActuatorCardProps) {
    const ActuatorIcon = actuatorIcons[actuator.type as keyof typeof actuatorIcons] || Activity

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <ActuatorIcon className="h-5 w-5" />
                    {formatName(actuator.resource_id)}
                </CardTitle>
                <CardDescription>Actuator control</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium">Status</p>
                        <p className="text-sm text-muted-foreground">
                            {actuator.status === "ON" ? "Active" : "Inactive"}
                        </p>
                    </div>
                    <Switch
                        checked={actuator.status === "ON" && rackActive}
                        onCheckedChange={(checked) => onToggle(actuator.resource_id, checked)}
                        disabled={isToggling || !rackActive}
                    />
                </div>

                {isToggling && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Updating...
                    </div>
                )}

                {actuator.status === "ON" && rackActive && (actuator.max_level || actuator.type.includes("fan") || actuator.type.includes("pump") || actuator.type.includes("cooling_levels")) && (
                    <div className="space-y-4">
                        <Separator />
                        <div>
                            <Label className="text-sm font-medium">
                                {actuator.type.includes("fan")
                                    ? "Fan Speed: "
                                    : actuator.type.includes("pump")
                                        ? "Pump Speed: "
                                        : "Level: "}
                                {actuator.type.includes("fan") || actuator.type.includes("pump")
                                    ? `${actuatorState.speed || actuator.speed || 0}%`
                                    : actuatorState.level || actuator.level || 3}
                            </Label>
                            <Slider
                                value={[actuator.type.includes("fan") || actuator.type.includes("pump")
                                    ? actuatorState.speed || actuator.speed || 0
                                    : actuatorState.level || actuator.level || 3]}
                                onValueChange={(value) => onLevelChange(actuator.resource_id, value[0])}
                                max={actuator.type.includes("fan") || actuator.type.includes("pump")
                                    ? actuator.max_speed || 100
                                    : actuator.max_level || 5}
                                min={actuator.type.includes("fan") || actuator.type.includes("pump") ? 0 : 1}
                                step={actuator.type.includes("fan") || actuator.type.includes("pump") ? 5 : 1}
                                className="mt-2"
                                disabled={!rackActive}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>Min ({actuator.type.includes("fan") || actuator.type.includes("pump") ? "0%" : "1"})</span>
                                <span>Max ({actuator.type.includes("fan") || actuator.type.includes("pump") 
                                    ? `${actuator.max_speed || 100}%` 
                                    : actuator.max_level || 5})</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="text-xs text-muted-foreground">
                    Last updated: {new Date(actuator.last_updated * 1000).toLocaleString()}
                </div>
            </CardContent>
        </Card>
    )
}
