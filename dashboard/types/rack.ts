import { SmartObject } from "./smartobject"

export interface Rack {
  rack_id: string
  room_id: string
  status: "ON" | "OFF"
  rack_type: "air_cooled" | "water_cooled"
  smart_objects: SmartObject[]
  last_update: string
}