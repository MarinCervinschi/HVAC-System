"use client"

import React, { useState } from "react"
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
import { Button } from "../ui/button"
import { toast } from "sonner"

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
    smartObjectId: string
    roomId: string
    rackId: string
    setIsToggling: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
    setError: (error: string) => void
    fetchRackData: () => Promise<void>
}

export function ActuatorCard({
    actuator,
    rackActive,
    actuatorState,
    isToggling,
    onToggle,
    smartObjectId,
    roomId,
    rackId,
    setIsToggling,
    setError,
    fetchRackData,
}: ActuatorCardProps) {
    const ActuatorIcon = actuatorIcons[actuator.type as keyof typeof actuatorIcons] || Activity
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.1:5000/hvac/api"
    
    // Stati locali per memorizzare i valori prima del salvataggio
    const [localSpeed, setLocalSpeed] = useState<number>(actuatorState.speed || actuator.speed || 0)
    const [localLevel, setLocalLevel] = useState<number>(actuatorState.level || actuator.level || 3)

    const handleSpeedChange = async (actuatorId: string, speed: number) => {
        setIsToggling((prev) => ({ ...prev, [actuatorId]: true }))

        try {
            const response = await fetch(`${API_URL}/proxy/forward`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    command: {
                        speed: speed, 
                    },
                    object_id: smartObjectId,
                    room_id: roomId,
                    rack_id: rackId,
                })
            })

            if (!response.ok) {
                toast.error('Failed to change actuator speed: ' + response.statusText)
                setError('Failed to change actuator speed')
                return
            }

            // Ricarica i dati del rack per ottenere lo stato aggiornato
            toast.success('Actuator speed changed successfully')
            await fetchRackData()
        } catch (err: any) {
            toast.error('An error occurred while changing actuator speed: ' + (err.message || 'Unknown error'))
            setError(err.message || 'An error occurred while changing actuator speed')
        } finally {
            setIsToggling((prev) => ({ ...prev, [actuatorId]: false }))
        }
    }

    const handleLevelChange = async (actuatorId: string, level: number) => {
        setIsToggling((prev) => ({ ...prev, [actuatorId]: true }))

        try {
            const response = await fetch(`${API_URL}/proxy/forward`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    command: {
                        level: level, 
                    },
                    object_id: smartObjectId,
                    room_id: roomId,
                    rack_id: rackId,
                })
            })

            if (!response.ok) {
                toast.error('Failed to change actuator level: ' + response.statusText)
                setError('Failed to change actuator level')
                return
            }

            // Ricarica i dati del rack per ottenere lo stato aggiornato
            toast.success('Actuator level changed successfully')
            await fetchRackData()
        } catch (err: any) {
            toast.error('An error occurred while changing actuator level: ' + (err.message || 'Unknown error'))
            setError(err.message || 'An error occurred while changing actuator level')
        } finally {
            setIsToggling((prev) => ({ ...prev, [actuatorId]: false }))
        }
    }

    const handleValueChange = (value: number) => {
        // Aggiorna solo lo stato locale, non effettua la fetch
        if (actuator.type.includes("fan") || actuator.type.includes("pump")) {
            setLocalSpeed(value)
        } else if (actuator.type.includes("cooling_level")) {
            setLocalLevel(value)
        }
    }

    const handleActuatorSave = async () => {
        // Effettua la fetch solo quando si clicca su Save
        if (actuator.type.includes("fan") || actuator.type.includes("pump")) {
            await handleSpeedChange(actuator.resource_id, localSpeed)
        } else if (actuator.type.includes("cooling_level")) {
            await handleLevelChange(actuator.resource_id, localLevel)
        }
    }

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
                                    ? `${localSpeed}%`
                                    : localLevel}
                            </Label>
                            <Slider
                                value={[actuator.type.includes("fan") || actuator.type.includes("pump")
                                    ? localSpeed
                                    : localLevel]}
                                onValueChange={(value) => handleValueChange(value[0])}
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

                <div className="flex flex-row justify-between items-center mt-4">
                    <div className="text-xs text-muted-foreground">
                        Last updated: {new Date(actuator.last_updated * 1000).toLocaleString()}
                    </div>
                    { actuator.status === "ON" && rackActive && (
                   <Button onClick={handleActuatorSave}>
                        Save
                   </Button>)}

                </div>
            </CardContent>
        </Card>
    )
}
