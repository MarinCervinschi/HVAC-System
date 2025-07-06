import { Racks } from "./racks"
import { SmartObject } from "./smartobject"

export interface Room {
  id: string
  name: string
  location: string
  smartObjects: SmartObject[]
  racks: Racks[]
  numberOfSmartObjects: number
  lastUpdate: string
}
