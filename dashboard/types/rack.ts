import { SmartObject } from "./smartobject"

export interface Rack {
  id: string
  name: string
  type: "air-cooled" | "water-cooled"
  location: string
  smartObjects: SmartObject[]
  status: "active" | "inactive"
  lastUpdate: string
}