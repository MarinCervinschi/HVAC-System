
import type { Sensor } from "./sensor";
import type { Actuator } from "./actuator";

export interface SmartObject {
  id: string
  room_id: string
  rack_id?: string
  sensors?: Sensor[]
  actuators?: Actuator[]
  resources?: Record<string, Sensor | Actuator>
}