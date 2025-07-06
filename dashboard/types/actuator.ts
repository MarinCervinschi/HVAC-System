export interface Actuator {
  id: string
  name: string
  type: string
  status: "on" | "off"      
  currentLevel?: number
  maxLevel?: number
  currentPercentage?: number
  lastUpdate: string
}