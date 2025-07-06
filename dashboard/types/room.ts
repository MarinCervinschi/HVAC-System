import { Racks } from "./racks"
import { SmartObject } from "./smartobject"

export interface Room {
  room_id: string
  location: string
  smart_objects: SmartObject[]
  racks: Racks[]
  total_smart_objects: number
  last_update: string
}
