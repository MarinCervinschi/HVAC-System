export interface PolicyCondition {
  operator: "<" | ">" | "==" | "<=" | ">=" | "!="
  value: number
}

export interface PolicyAction {
  resource_id: string
  actuator_type: string
  command: {
    status?: "ON" | "OFF"
    speed?: number
    level?: number
    [key: string]: any
  }
}
export interface Policy {
  id: string
  description: string
  room_id: string
  rack_id?: string | null
  object_id: string
  sensor_type: string
  resource_id: string
  condition: PolicyCondition
  action: PolicyAction
  created_at?: string
  updated_at?: string
}

export const OPERATOR_LABELS = {
    "<": "Less than",
    ">": "Greater than",
    "==": "Equal to",
    "<=": "Less than or equal to",
    ">=": "Greater than or equal to",
    "!=": "Not equal to",
} as const

export const SENSOR_TYPE_LABELS = {
  temperature: "Temperatura",
  humidity: "Umidità",
  pressure: "Pressione",
  airspeed: "Velocità Aria",
  power: "Potenza",
} as const

export const ACTION_TYPE_LABELS = {
  status: "Stato",
  speed: "Velocità",
  level: "Livello",
} as const
