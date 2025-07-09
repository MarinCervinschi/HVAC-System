"use client"

import { useEffect, useState } from "react"
import { notFound, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Room } from "@/types/room"
import { SmartObject } from "@/types/smartobject"
import { Sensor } from "@/types/sensor"
import { CoolingSystemHub, RackList } from "@/components/room/smartobject"
import { formatName } from "@/lib/utils"
import GraficSensors from "@/components/room/smartobject/sensors/GraficSensors"
import { convertSmartObjectData } from "@/lib/utils"
import { useMQTTClient } from "@/hooks/useMqttClient"
import { PolicyDialog } from "@/components/room/PolicyDialog"
import { toast } from "sonner"
import Loader from "@/components/loader"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.1:5000/hvac/api"

export default function RoomDetailPage() {
  const params = useParams()
  const roomId = params.id as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roomInfo, setRoomInfo] = useState<Room>()
  const [coolingLevel, setCoolingLevel] = useState(3)
  const [coolingStatus, setCoolingStatus] = useState(true)

  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_URL}/room/${roomId}`)
        if (!res.ok) {
          toast.error("Failed to fetch room data")
          return
        }
        const response = await res.json()
        const roomData = response.room || response
        const convertedRoomData = {
          ...roomData,
          smart_objects: roomData.smart_objects.map(convertSmartObjectData)
        }
        // Carica la history dai dati locali salvati per ogni sensore
        const updatedSmartObjects = convertedRoomData.smart_objects.map((obj: SmartObject) => ({
          ...obj,
          sensors: obj.sensors?.map((sensor: Sensor) => {
            const cachedHistory = localStorage.getItem(`sensor-history-${sensor.resource_id}`)
            return cachedHistory ? { ...sensor, history: JSON.parse(cachedHistory) } : sensor
          }) ?? [],
        }))
        setRoomInfo({ ...convertedRoomData, smart_objects: updatedSmartObjects })
      } catch (err: any) {
        toast.error("Error fetching room: " + err)
        setError(err.message || "An error occurred while fetching room data")
      } finally {
        setLoading(false)
      }
    }
    fetchRoom()
  }, [roomId])

  const mqttTopics = roomInfo?.smart_objects?.flatMap(obj =>
    (obj.sensors?.map((sensor: Sensor) => `hvac/room/${roomId}/device/${obj.id}/telemetry/${sensor.resource_id}`) ?? [])
  ) || []


  useMQTTClient({
    brokerUrl: "ws://localhost:9001",
    topics: mqttTopics,
    onMessage: (topic, message) => {
      try {
        let jsonMessage = message
        if (message.startsWith('{') && !message.includes('"')) {
          jsonMessage = message
            .replace(/\{/g, '{"').replace(/:/g, '":"').replace(/,/g, '","').replace(/\}$/g, '"}')
            .replace(/"(\d+\.?\d*)"}/g, '$1}').replace(/"(\d+\.?\d*)",/g, '$1,"').replace(/":"(\d+\.?\d*)",/g, '":$1,"')
        }
        const telemetryData = JSON.parse(jsonMessage)
        const topicParts = topic.split("/")
        const resourceId = topicParts[topicParts.length - 1]
        const value = telemetryData.data_value ?? telemetryData.data__value
        const timestamp = telemetryData.timestamp || Date.now()

        const newHistoryEntry = { time: new Date(timestamp).toLocaleTimeString(), value }
        setRoomInfo(prev =>
          prev ? {
            ...prev,
            smart_objects: prev.smart_objects.map(obj => ({
              ...obj,
              sensors: obj.sensors?.map(sensor => {
                if (sensor.resource_id === resourceId) {
                  const updatedHistory = [
                    ...(sensor.history ?? []),
                    newHistoryEntry
                  ].slice(-5)
                  localStorage.setItem(`sensor-history-${sensor.resource_id}`, JSON.stringify(updatedHistory))
                  return { ...sensor, value, timestamp, history: updatedHistory }
                }
                return sensor
              }) ?? [],
            }))
          } : prev
        )
      } catch (error) {
        toast.error("Error parsing MQTT message: " + error)
      }
    },
  })

  const coolingHub = roomInfo?.smart_objects?.find(obj => obj.id === "cooling_system_hub")

  if (loading) {
    return <Loader />
  }

  if (!roomInfo) {
    if (error) {
      return notFound()
    }
    return <Loader />
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
      {/* Room Info */}
      <Card>
        <div className="flex items-center justify-between pr-6">
          <CardHeader>
            <CardTitle className="text-xl">{formatName(roomInfo.room_id)}</CardTitle>
            <CardDescription>{roomInfo.location}</CardDescription>
          </CardHeader>
          <PolicyDialog
            smartObjects={roomInfo.smart_objects}
            roomId={roomInfo.room_id}
          />
        </div>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <div className="bg-blue-100 p-4 rounded-lg">
              <div className="font-semibold text-md">{roomInfo?.racks.length}</div>
              <span className="text-muted-foreground text-sm">Racks</span>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg">
              <div className="font-semibold text-md">{roomInfo?.smart_objects.length}</div>
              <span className="text-muted-foreground text-sm">Smart Objects</span>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg">
              <div className="font-semibold text-md">{
                (() => {
                  // Trova il sensore con la history più recente tra tutti gli smart_objects
                  if (!roomInfo || !roomInfo.smart_objects) return "N/A";
                  const allHistories = roomInfo.smart_objects
                    .flatMap(obj => obj.sensors?.flatMap(sensor => sensor.history ?? []) ?? []);
                  if (allHistories.length === 0) return "N/A";
                  // Ordina per tempo decrescente (assumendo che time sia una stringa oraria)
                  const latest = allHistories.reduce((a, b) =>
                    new Date(`1970-01-01T${a.time}`).getTime() > new Date(`1970-01-01T${b.time}`).getTime() ? a : b
                  );
                  return latest.time;
                })()
              }</div>
              <span className="text-muted-foreground text-sm">Last Update</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {roomInfo && roomInfo.smart_objects && roomInfo.smart_objects
        .filter(obj => obj.sensors && obj.sensors.length > 0 && (!obj.actuators || obj.actuators.length === 0))
        .map(obj => (
          <GraficSensors
            key={obj.id}
            smartObject={obj}
          />
        ))
      }

      {coolingHub && (
        <CoolingSystemHub
          smartObject={coolingHub}
          initialCoolingLevel={coolingLevel}
          initialCoolingStatus={coolingStatus}
        />
      )}

      {/* Racks */}
      {roomInfo && roomInfo.racks && roomInfo.racks.length > 0 && (
        <RackList
          roomInfo={roomInfo}
        />
      )}

    </div>
  )
}
