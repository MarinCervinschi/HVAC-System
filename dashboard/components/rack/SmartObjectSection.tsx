"use client"

import {
    Server,
    Wind,
    Waves,
    Zap,
    Thermometer,
} from "lucide-react"
import { SensorCard } from "./SensorCard"
import { ActuatorCard } from "./ActuatorCard"
import { TelemetryTable } from "./TelemetryTable"
import { PolicyDialog } from "./PolicyDialog"
import { SmartObject } from "@/types/smartobject"
import { formatName } from "@/lib/utils"

const smartObjectIcons = {
    airflow_manager: Wind,
    water_loop_controller: Waves,
    energy_metering_unit: Zap,
    rack_cooling_unit: Thermometer,
}

interface SmartObjectSectionProps {
    smartObject: SmartObject
    rackActive: boolean
    isToggling: Record<string, boolean>
    onActuatorToggle: (actuatorId: string, checked: boolean) => Promise<void>
    onLevelChange: (actuatorId: string, level: number) => Promise<void>
}

export function SmartObjectSection({
    smartObject,
    rackActive,
    isToggling,
    //getSensorPolicy,
    onActuatorToggle,
    onLevelChange,
    //onPolicyChange,
}: SmartObjectSectionProps) {
    const SmartObjectIcon = smartObjectIcons[smartObject.id as keyof typeof smartObjectIcons] || Server

    return (
        <div className="border p-6 rounded-lg space-y-10">
           
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                    <SmartObjectIcon className="h-6 w-6" />
                    {formatName(smartObject.id)}
                </h2>
                
                {/* 
                    <PolicyDialog
                        smartObject={smartObject}
                        //getSensorPolicy={getSensorPolicy}
                        onPolicyChange={onPolicyChange}
                    />
                */}
            </div>
            
            <div className="grid grid-cols-2 gap-20">
                <div className="space-y-6">
                    {/* Sensors */}
                    {smartObject.sensors && smartObject.sensors.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Sensors</h3>
                            <div className="flex flex-col">
                                {smartObject.sensors.map((sensor) => (
                                    <SensorCard
                                        key={sensor.resource_id}
                                        sensor={sensor}
                                        //policy={getSensorPolicy(sensor)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actuators */}
                    {smartObject.actuators && smartObject.actuators.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Actuators</h3>
                            <div className="flex flex-col">
                                {smartObject.actuators.map((actuator) => (
                                    <ActuatorCard
                                        key={actuator.resource_id}
                                        actuator={actuator}
                                        rackActive={rackActive}
                                        actuatorState={{ 
                                            status: actuator.status, 
                                            level: actuator.level,
                                            speed: actuator.speed 
                                        }}
                                        isToggling={isToggling[actuator.resource_id] || false}
                                        onToggle={onActuatorToggle}
                                        onLevelChange={onLevelChange}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Telemetry</h3>
                    <TelemetryTable
                        smartObject={smartObject}
                        //getSensorPolicy={getSensorPolicy}
                    />
                </div>
            </div>
        </div>
    )
}
