"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { RackStatusCard, SmartObjectSection } from "@/components/rack"
import { Rack } from "@/types/rack"
import { convertSmartObjectData } from "@/lib/utils"

// Mock data per un rack con smartObjects, sensori e attuatori

const mockRack: Rack = {
    rack_id: "rack_A1",
    room_id: "room_A1",
    rack_type: "air_cooled",
    status: "ON",
    smart_objects: [
        {
            id: "rack_cooling_unit",
            room_id: "room_A1",
            rack_id: "rack_A1",
            sensors: [
                {
                    resource_id: "rack_cooling_unit_temp",
                    type: "iot:sensor:temperature",
                    value: 0.0,
                    unit: "Celsius",
                    timestamp: 0,
                    min: 25.0,
                    max: 45.0
                } 
            ],
            actuators: [
                 {
                    resource_id: "rack_cooling_unit_fan",
                    type: "iot:actuator:fan",
                    is_operational: true,
                    max_speed: 100,
                    status: "ON",
                    last_updated: 1751831206,
                    speed: 0,
                    target_speed: 0
                }
            ]
        },
        {
            id: "energy_metering_unit",
            room_id: "room_A1",
            rack_id: "rack_A1",
            sensors: [
                {
                   resource_id: "energy_metering_unit_energy",
                   type: "iot:sensor:energy",
                   value: 0.0,
                   unit: "kWh",
                   timestamp: 0,
                   min: 0.0,
                   max: 1000.0

                }
            ],
            actuators: [
                {
                    resource_id: "energy_metering_unit_switch",
                    type: "iot:actuator:switch",
                    is_operational: true,
                    status: "ON",
                    last_updated: 1751831206

                }
            ]
        },
        {
            id: "airflow_manager",
            room_id: "room_A1",
            rack_id: "rack_A1",
            sensors: [
                {
                    resource_id: "airflow_manager_air_speed",
                    type: "iot:sensor:air_speed",
                    value: 0.0,
                    unit: "m/s",
                    timestamp: 0,
                    min: 0.0,
                    max: 100.0
                }
            ],
            actuators: [
                {
                    resource_id: "airflow_manager_cooling_levels",
                    type: "iot:actuator:cooling_levels",
                    is_operational: true,
                    max_level: 5,
                    min_level: 0,
                    status: "ON",
                    last_updated: 1751831206,
                    level: 0
                }
            ]
        }
    ]
}

export default function RackDetailPage() {
    const params = useParams()
    const roomId = params.id as string
    const rackId = params.rackId as string

    const [rackInfo, setRackInfo] = useState<Rack>()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [isToggling, setIsToggling] = useState<Record<string, boolean>>({})

    const fetchRackData = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`http://localhost:7070/hvac/api/room/${roomId}/rack/${rackId}`)

            if (!res.ok) {
                console.error("Failed to fetch rack data:", res.statusText)
                setError("Failed to fetch rack data")
                return
            }

            const response = await res.json()
            const rackData = response.rack || response
            
            // Converti i smart objects dal nuovo formato al vecchio formato
            const convertedRackData = {
                ...rackData,
                smart_objects: rackData.smart_objects.map(convertSmartObjectData)
            }
            
            setRackInfo(convertedRackData)
        } catch (err: any) {
            setError(err.message || "An error occurred while fetching rack data")
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        // Usa i mock data invece della fetch
        setRackInfo(mockRack)
    }, [rackId, roomId])

    if (!rackInfo) {
        return (
            <div className="flex flex-col min-h-full">
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
        
        try {
            const response = await fetch(`/hvac/api/room/${roomId}/rack/${rackId}/actuator/${actuatorId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: checked ? 'ON' : 'OFF'
                })
            })

            if (!response.ok) {
                console.error('Failed to toggle actuator:', response.statusText)
                setError('Failed to toggle actuator')
                return
            }

            // Ricarica i dati del rack per ottenere lo stato aggiornato
            await fetchRackData()
        } catch (err: any) {
            setError(err.message || 'An error occurred while toggling actuator')
        } finally {
            setIsToggling((prev) => ({ ...prev, [actuatorId]: false }))
        }
    }

    const handleLevelChange = async (actuatorId: string, level: number) => {
        setIsToggling((prev) => ({ ...prev, [actuatorId]: true }))
        
        try {
            const response = await fetch(`/hvac/api/room/${roomId}/rack/${rackId}/actuator/${actuatorId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    level: level
                })
            })

            if (!response.ok) {
                console.error('Failed to change actuator level:', response.statusText)
                setError('Failed to change actuator level')
                return
            }

            // Ricarica i dati del rack per ottenere lo stato aggiornato
            await fetchRackData()
        } catch (err: any) {
            setError(err.message || 'An error occurred while changing actuator level')
        } finally {
            setIsToggling((prev) => ({ ...prev, [actuatorId]: false }))
        }
    }

    const handleRackToggle = async (checked: boolean) => {
        setIsToggling((prev) => ({ ...prev, rack: true }))

        try {
            const response = await fetch(`/hvac/api/room/${roomId}/rack/${rackId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: checked ? 'ON' : 'OFF'
                })
            })

            if (!response.ok) {
                console.error('Failed to toggle rack:', response.statusText)
                setError('Failed to toggle rack')
                return
            }

            // Ricarica i dati del rack per ottenere lo stato aggiornato
            await fetchRackData()
        } catch (err: any) {
            setError(err.message || 'An error occurred while toggling rack')
        } finally {
            setIsToggling((prev) => ({ ...prev, rack: false }))
        }
    }

    return (
        <div className="flex flex-col min-h-full">
            <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
                {/* Rack Info */}
                <RackStatusCard
                    rackInfo={rackInfo}
                    rackActive={rackInfo.status === "ON"}
                    isToggling={isToggling.rack || false}
                    onRackToggle={handleRackToggle}
                />

                {/* Smart Objects */}
                {rackInfo.smart_objects.map((smartObject) => (
                    <SmartObjectSection
                        key={smartObject.id}
                        smartObject={smartObject}
                        rackActive={rackInfo.status === "ON"}
                        isToggling={isToggling}
                        onActuatorToggle={handleActuatorToggle}
                        onLevelChange={handleLevelChange}
                    />
                ))}
            </div>
        </div>
    )
}

