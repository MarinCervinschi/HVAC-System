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
import { CoolingSystemHub, RackList } from "@/components/room/smartobject"
import { formatName } from "@/lib/utils"
import GraficSensors from "@/components/room/smartobject/sensors/GraficSensors"

export default function RoomDetailPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.id as string
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [roomInfo, setRoomInfo] = useState<Room>()

  // Mock data for local development
  const mockRoom: Room = {
    room_id: "room_A1",
    location: "Building A, Floor 1",
    last_update: "2 min ago",
    total_smart_objects: 8,
    racks: [
      {
        rack_id: "rack_A1",
        rack_type: "air_cooled",
        last_update: "2 min ago",
        smart_objects: [
          "rack_cooling_unit",
          "energy_metering_unit",
          "airflow_manager"
        ],
        status: "OFF"
      },
      {
        rack_id: "rack_W1",
        rack_type: "water_cooled",
        last_update: "2 min ago",
        smart_objects: [
          "rack_cooling_unit",
          "energy_metering_unit",
          "water_loop_controller"
        ],
        status: "OFF"
      }
    ],
    smart_objects: [
      {
        id: "environment_monitor",
        room_id: "room_A1",
        sensors: [
          {
            resource_id: "environment_monitor_temp",
            type: "iot:sensor:temperature",
            value: 0.0,
            unit: "Celsius",
            timestamp: 0,
            min: 25.0,
            max: 45.0
          },
          {
            resource_id: "environment_monitor_humidity",
            type: "iot:sensor:humidity",
            value: 0.0,
            unit: "%",
            timestamp: 0,
            min: 0.0,
            max: 70.0
          }
        ],
        actuators: []
      },
      {
        id: "cooling_system_hub",
        room_id: "room_A1",
        sensors: [],
        actuators: [
          {
            resource_id: "cooling_system_hub_cooling_levels",
            type: "iot:actuator:cooling_levels❄",
            is_operational: true,
            max_level: 5,
            min_level: 0,
            status: "OFF",
            level: 0,
            last_updated: 1751821537
          }
        ]
      }
    ]
  }

  // Use mock data if in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      setRoomInfo(mockRoom)
      setLoading(false)
      setError(null)
    }
  }, [])

  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/hvac/api/room/${roomId}`)

        if (!res.ok) {
          console.error("Failed to fetch room data:", res.statusText)
          setError("Failed to fetch room data")
          return
        }

        const data = await res.json()
        setRoomInfo(data)
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching room data")
      } finally {
        setLoading(false)
      }
    }
    fetchRoom()
  }, [roomId])


  const [coolingLevel, setCoolingLevel] = useState(3)
  const [coolingStatus, setCoolingStatus] = useState(true)
  const [tempPolicy, setTempPolicy] = useState({ min: 18, max: 25 })
  const [humidityPolicy, setHumidityPolicy] = useState({ min: 40, max: 60 })

  // Get smart objects data
  const coolingHub = roomInfo?.smart_objects.find((obj) => obj.id === "cooling_system_hub")

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
