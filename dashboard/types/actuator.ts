export interface Actuator {
  resource_id: string
  type: string
  is_operational: boolean
  status: "ON" | "OFF"
  max_level?: number
  min_level?: number
  level?: number
  max_speed?: number
  speed?: number
  target_speed?: number
  last_updated: number
}