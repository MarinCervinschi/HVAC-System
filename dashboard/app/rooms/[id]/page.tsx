"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Settings } from "lucide-react"
import { Room } from "@/types/room"
import { SmartObject } from "@/types/smartobject"
import { Sensor } from "@/types/sensor"
import { Actuator } from "@/types/actuator"
import { CoolingSystemHub, RackList } from "@/components/room/smartobject"
import { formatName } from "@/lib/utils"
import GraficSensors from "@/components/room/smartobject/sensors/GraficSensors"
import { convertSmartObjectData } from "@/lib/utils"
import { useMQTTClient } from "@/hooks/useMqttClient"

export default function RoomDetailPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.id as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roomInfo, setRoomInfo] = useState<Room>()
  const [coolingLevel, setCoolingLevel] = useState(3)
  const [coolingStatus, setCoolingStatus] = useState(true)
  const [tempPolicy, setTempPolicy] = useState({ min: 18, max: 25 })
  const [humidityPolicy, setHumidityPolicy] = useState({ min: 40, max: 60 })


  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`http://localhost:7070/hvac/api/room/${roomId}`)
        if (!res.ok) {
          setError("Failed to fetch room data")
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
        console.error("Error fetching room:", err)
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
        console.error("Error parsing MQTT message:", error)
      }
    },
  })

  const coolingHub = roomInfo?.smart_objects?.find(obj => obj.id === "cooling_system_hub")



  if (!roomInfo) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Room not found</h1>
            <p className="text-muted-foreground">The requested room does not exist.</p>
          </div>
        </div>
      </div>
    )
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
          <div className="flex flex-col min-h-full">
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Policy
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Policy Configuration</DialogTitle>
                    <DialogDescription>Set thresholds for room temperature and humidity</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Temperature (°C)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="temp-min" className="text-xs">
                            Min
                          </Label>
                          <Input
                            id="temp-min"
                            type="number"
                            value={tempPolicy.min}
                            onChange={(e) => setTempPolicy((prev) => ({ ...prev, min: Number(e.target.value) }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="temp-max" className="text-xs">
                            Max
                          </Label>
                          <Input
                            id="temp-max"
                            type="number"
                            value={tempPolicy.max}
                            onChange={(e) => setTempPolicy((prev) => ({ ...prev, max: Number(e.target.value) }))}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Humidity (%)</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label htmlFor="hum-min" className="text-xs">
                            Min
                          </Label>
                          <Input
                            id="hum-min"
                            type="number"
                            value={humidityPolicy.min}
                            onChange={(e) => setHumidityPolicy((prev) => ({ ...prev, min: Number(e.target.value) }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="hum-max" className="text-xs">
                            Max
                          </Label>
                          <Input
                            id="hum-max"
                            type="number"
                            value={humidityPolicy.max}
                            onChange={(e) => setHumidityPolicy((prev) => ({ ...prev, max: Number(e.target.value) }))}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button>Save Policy</Button>
                </DialogContent>
              </Dialog>
            </div>
          </div>
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
              <div className="font-semibold text-md">{roomInfo?.last_update}</div>
              <span className="text-muted-foreground text-sm">Last Update</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {
        roomInfo.smart_objects
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
      {roomInfo?.racks && (
        <RackList
          roomInfo={roomInfo}
        />
      )}


    </div>
  )
}
