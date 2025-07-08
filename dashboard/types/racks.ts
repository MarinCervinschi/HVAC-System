export interface Racks {
  rack_id: string
  status: "ON" | "OFF"
  rack_type: "air_cooled" | "water_cooled"
  smart_objects: string[]
  last_update: string
}