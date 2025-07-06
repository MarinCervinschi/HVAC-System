
import type { Sensor } from "./sensor";
import type { Actuator } from "./actuator";

export interface SmartObject {
  id: string
  name: string
  type: string
  sensors: Sensor[]
  actuators: Actuator[]
}