export interface Sensor {
  resource_id: string;
  type: string;                 
  value: number;       
  unit: string;          
  timestamp: number;        // Timestamp of the last update
  min: number;              // Threshold value for minimum
  max: number;              // Threshold value for maximum
}