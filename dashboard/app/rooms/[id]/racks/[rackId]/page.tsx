"use client"

import { useEffect, useState } from "react"
import { notFound, useParams } from "next/navigation"
import { RackStatusCard, SmartObjectSection } from "@/components/rack"
import { Rack } from "@/types/rack"
import { Sensor } from "@/types/sensor"
import { SmartObject } from "@/types/smartobject"
import { convertSmartObjectData } from "@/lib/utils"
import { useMQTTClient } from "@/hooks/useMqttClient"
import Loader from "@/components/loader"
import { toast } from "sonner"

// Mock data per un rack con smartObjects, sensori e attuatori

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.1:5000/hvac/api"


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
            const res = await fetch(`${API_URL}/room/${roomId}/rack/${rackId}`)

            if (!res.ok) {
                toast.error("Failed to fetch rack data: " + res.statusText)
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

            // Carica la history dai dati locali salvati per ogni sensore
            const updatedSmartObjects = convertedRackData.smart_objects.map((obj: SmartObject) => ({
                ...obj,
                sensors: obj.sensors?.map((sensor: Sensor) => {
                    const cachedHistory = localStorage.getItem(`sensor-history-${sensor.resource_id}`)
                    return cachedHistory ? { ...sensor, history: JSON.parse(cachedHistory) } : sensor
                }) ?? [],
            }))

            setRackInfo({ ...convertedRackData, smart_objects: updatedSmartObjects })
        } catch (err: any) {
            setError(err.message || "An error occurred while fetching rack data")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchRackData()
    }, [rackId, roomId])

    // Genera i topic MQTT per i sensori del rack
    const mqttTopics = rackInfo?.smart_objects?.flatMap(obj =>
    (obj.sensors?.map((sensor: Sensor) =>
        `hvac/room/${roomId}/rack/${rackId}/device/${obj.id}/telemetry/${sensor.resource_id}`
    ) ?? [])
    ) || []

    // Gestione MQTT per le telemetrie dei sensori
    useMQTTClient({
        brokerUrl: "ws://localhost:9001",
        topics: mqttTopics,
        onMessage: (topic, message) => {

            try {
                // Converti il messaggio dal formato backend al JSON valido
                let jsonMessage = message
                if (message.startsWith('{') && !message.includes('"')) {
                    jsonMessage = message
                        .replace(/\{/g, '{"')
                        .replace(/:/g, '":"')
                        .replace(/,/g, '","')
                        .replace(/\}$/g, '"}')
                        .replace(/"(\d+\.?\d*)"}/g, '$1}')
                        .replace(/"(\d+\.?\d*)",/g, '$1,"')
                        .replace(/":"(\d+\.?\d*)",/g, '":$1,"')
                }

                const telemetryData = JSON.parse(jsonMessage)
                const topicParts = topic.split("/")
                const resourceId = topicParts[topicParts.length - 1]
                const value = telemetryData.data_value ?? telemetryData.data__value
                const timestamp = telemetryData.timestamp || Date.now()

                if (value === undefined) {
                    console.warn("⚠️ No valid data_value found in rack telemetry message:", telemetryData)
                    return
                }

                const newHistoryEntry = {
                    time: new Date(timestamp).toLocaleTimeString(),
                    value
                }

                setRackInfo(prev =>
                    prev ? {
                        ...prev,
                        smart_objects: prev.smart_objects.map(obj => ({
                            ...obj,
                            sensors: obj.sensors?.map(sensor => {
                                if (sensor.resource_id === resourceId) {

                                    const updatedHistory = [
                                        ...(sensor.history ?? []),
                                        newHistoryEntry
                                    ].slice(-10) // Mantieni solo le ultime 10 telemetrie

                                    // Salva la history in localStorage
                                    localStorage.setItem(`sensor-history-${sensor.resource_id}`, JSON.stringify(updatedHistory))

                                    return {
                                        ...sensor,
                                        value,
                                        timestamp,
                                        history: updatedHistory
                                    }
                                }
                                return sensor
                            }) ?? [],
                        }))
                    } : prev
                )
            } catch (error) {
                toast.error("❌ Error parsing rack MQTT message: " + error)
                toast.error("❌ Raw message: " + message)
            }
        },
    })

    const handleActuatorToggle = (smartObjectId: string) => async (actuatorId: string, checked: boolean) => {
        setIsToggling((prev) => ({ ...prev, [actuatorId]: true }))

        try {
            const response = await fetch(`${API_URL}/proxy/forward`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    command: { 
                        status: checked ? 'ON' : 'OFF',
                    },
                    object_id: smartObjectId,
                    room_id: roomId,
                    rack_id: rackId,
                })
            })

            if (!response.ok) {
                toast.error('Failed to toggle actuator: ' + response.statusText)
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

    const handleRackToggle = async (checked: boolean) => {
        setIsToggling((prev) => ({ ...prev, rack: true }))

        try {
            const response = await fetch(`${API_URL}/room/${roomId}/rack/${rackId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: checked ? 'ON' : 'OFF'
                })
            })

            if (!response.ok) {
                toast.error('Failed to toggle rack: ' + response.statusText)
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

    if (loading) {
        return <Loader />
    }

   if (!rackInfo) {
    if (error) {
      return notFound()
    }
    return <Loader />
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
                        onActuatorToggle={handleActuatorToggle(smartObject.id)}
                        roomId={roomId}
                        rackId={rackId}
                        setIsToggling={setIsToggling}
                        setError={setError}
                        fetchRackData={fetchRackData}
                    />
                ))}
            </div>
        </div>
    )
}

