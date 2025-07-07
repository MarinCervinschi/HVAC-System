import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { SmartObject } from "@/types/smartobject"
import type { Sensor } from "@/types/sensor"
import type { Actuator } from "@/types/actuator"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatName(value:string): string {
  for (const char of ["-", "_"]) {
    value = value.replace(new RegExp(`\\${char}`, "g"), " ")
  }
  return value
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function formatType(type: string): string {
  const lastPart = type.split(":").pop() || ""
  return lastPart
}

export function convertSmartObjectData(smartObject: SmartObject): SmartObject {
    if (smartObject.resources) {
        // Nuovo formato con resources
        const sensors: Sensor[] = []
        const actuators: Actuator[] = []
        
        Object.values(smartObject.resources).forEach((resource) => {
            if (resource.type.includes('sensor')) {
                sensors.push(resource as Sensor)
            } else if (resource.type.includes('actuator')) {
                actuators.push(resource as Actuator)
            }
        })
        
        return {
            ...smartObject,
            sensors,
            actuators
        }
    }
    
    // Formato vecchio già compatibile
    return smartObject
}

export function findSensorById(smartObject: SmartObject, sensorId: string): Sensor | undefined {
    return smartObject.sensors?.find(sensor => sensor.resource_id === sensorId)
}