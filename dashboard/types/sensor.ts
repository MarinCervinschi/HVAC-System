export interface Sensor {
  id: string;
  name: string;             // Nome del sensore  
  type: string;          
  currentValue: number;       
  unit: string;          
  lastUpdate: string;       // Timestamp of the last update
  min: number;              // Threshold value for minimum
  max: number;              // Threshold value for maximum
}