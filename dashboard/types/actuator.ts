export interface Actuator {
  resource_id: string
  type: string
  is_operational: boolean
  status: "ON" | "OFF"
  max_level?: number
  min_level?: number
  level?: number
  current_percentage?: number
  last_updated: string
}