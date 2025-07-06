export interface Racks {
  id: string
  name: string
  type: "air-cooled" | "water-cooled"
  smartObjects: string[]
  status: "active" | "inactive"
  lastUpdate: string
}