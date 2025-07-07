"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, AlertCircle, CheckCircle, Clock, Thermometer, Droplets, Zap, X } from "lucide-react"
import { useMQTTClient } from "@/hooks/useMqttClient"

interface DeviceTelemetry {
  id: string;
  title: string;
  device: string;
  location: string;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
  currentValue: string;
  threshold: string;
  timestamp: string;
  icon: React.ComponentType<{ className?: string }>;
  deviceType?: string;
}

const initialTelemetries: DeviceTelemetry[] = [
  {
    id: "1",
    title: "High Temperature",
    device: "Temperature Sensor - Server Room",
    location: "Server Room",
    severity: "high",
    message: "Temperature has exceeded the threshold of 25°C",
    currentValue: "26.8°C",
    threshold: "25°C",
    timestamp: "2024-01-15 14:30:25",
    icon: Thermometer,
  },
  {
    id: "2",
    title: "Critical Humidity",
    device: "Humidity Sensor - Warehouse",
    location: "Warehouse",
    severity: "critical",
    message: "Critical humidity level detected",
    currentValue: "85%",
    threshold: "75%",
    timestamp: "2024-01-15 14:25:10",
    icon: Droplets,
  },
  {
    id: "3",
    title: "Abnormal Energy Consumption",
    device: "Energy Meter - Production",
    location: "Production Area",
    severity: "medium",
    message: "Energy consumption above average",
    currentValue: "5.2 kW",
    threshold: "4.5 kW",
    timestamp: "2024-01-15 14:15:45",
    icon: Zap,
  },
]

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-800 border-red-200"
    case "high":
      return "bg-orange-100 text-orange-800 border-orange-200"
    case "medium":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "low":
      return "bg-blue-100 text-blue-800 border-blue-200"
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

// Helper function to get icon based on device type or sensor type
const getDeviceIcon = (deviceType: string, alertType: string): React.ComponentType<{ className?: string }> => {
  if (alertType.toLowerCase().includes('temperature') || deviceType.toLowerCase().includes('temperature')) {
    return Thermometer;
  }
  if (alertType.toLowerCase().includes('humidity') || deviceType.toLowerCase().includes('humidity')) {
    return Droplets;
  }
  if (alertType.toLowerCase().includes('energy') || alertType.toLowerCase().includes('power') || deviceType.toLowerCase().includes('energy')) {
    return Zap;
  }
  return AlertCircle;
};

// Helper function to determine severity based on threshold values
const determineSeverity = (currentValue: number, threshold: number, deviceType: string): "critical" | "high" | "medium" | "low" => {
  const ratio = Math.abs(currentValue - threshold) / threshold;
  
  if (ratio > 0.5) return "critical";
  if (ratio > 0.3) return "high";
  if (ratio > 0.1) return "medium";
  return "low";
};

// Helper function to parse MQTT telemetry message
const parseTelemetryMessage = (topic: string, message: string): DeviceTelemetry | null => {
  try {
    const data = JSON.parse(message);
    
    // Extract room and device info from topic
    // Topic format: hvac/room/{roomId}/event/{deviceType}
    const topicParts = topic.split('/');
    const roomId = topicParts[2];
    const deviceType = topicParts[4] || 'unknown';
    
    // Create telemetry from MQTT data
    const telemetry: DeviceTelemetry = {
      id: `mqtt_${Date.now()}_${Math.random()}`,
      title: data.alert_type || `${deviceType} Reading`,
      device: data.device_id || `${deviceType} - ${roomId}`,
      location: data.room_id || roomId,
      severity: data.severity || determineSeverity(data.current_value, data.threshold, deviceType),
      message: data.message || `${deviceType} value out of threshold`,
      currentValue: `${data.current_value}${data.unit || ''}`,
      threshold: `${data.threshold}${data.unit || ''}`,
      timestamp: new Date().toLocaleString(),
      icon: getDeviceIcon(deviceType, data.alert_type || ''),
      deviceType: deviceType
    };
    
    return telemetry;
  } catch (error) {
    console.error('Error parsing MQTT telemetry message:', error);
    return null;
  }
};

export default function AlertsPage() {
  const [telemetries, setTelemetries] = useState<DeviceTelemetry[]>(initialTelemetries);
  const [connectionStatus, setConnectionStatus] = useState<string>("Disconnected");

  // MQTT message handler
  const handleMQTTMessage = useCallback((topic: string, message: string) => {
    console.log(`📨 Received MQTT message on topic ${topic}:`, message);
    
    const newTelemetry = parseTelemetryMessage(topic, message);
    if (newTelemetry) {
      setTelemetries(prevTelemetries => {
        // Check if telemetry already exists (avoid duplicates)
        const existingTelemetry = prevTelemetries.find(telemetry => 
          telemetry.device === newTelemetry.device && 
          telemetry.title === newTelemetry.title
        );
        
        if (existingTelemetry) {
          // Update existing telemetry
          return prevTelemetries.map(telemetry => 
            telemetry.id === existingTelemetry.id 
              ? { ...newTelemetry, id: existingTelemetry.id }
              : telemetry
          );
        } else {
          // Add new telemetry (keep only last 50 entries)
          const updatedTelemetries = [newTelemetry, ...prevTelemetries];
          return updatedTelemetries.slice(0, 50);
        }
      });
    }
  }, []);

  // MQTT connection
  const { client, isConnected } = useMQTTClient({
    brokerUrl: "ws://localhost:9001",
    topics: ["hvac/room/+/event/+"], // Subscribe to all room events
    onMessage: handleMQTTMessage,
  });

  // Update connection status
  useEffect(() => {
    setConnectionStatus(isConnected ? "Connected" : "Disconnected");
  }, [isConnected]);

  // Filter telemetries by severity
  const criticalTelemetries = telemetries.filter((telemetry: DeviceTelemetry) => telemetry.severity === "critical");
  const highTelemetries = telemetries.filter((telemetry: DeviceTelemetry) => telemetry.severity === "high");
  const mediumTelemetries = telemetries.filter((telemetry: DeviceTelemetry) => telemetry.severity === "medium");
  const lowTelemetries = telemetries.filter((telemetry: DeviceTelemetry) => telemetry.severity === "low");

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        {/* Connection Status */}
        <div className="mb-4">
          <Badge variant={isConnected ? "default" : "destructive"} className="text-sm">
            MQTT: {connectionStatus}
          </Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{criticalTelemetries.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">High</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{highTelemetries.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Medium</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{mediumTelemetries.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Readings</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{telemetries.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Device Telemetries */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Device Telemetry</h2>
          <div className="space-y-3">
            {telemetries.map((telemetry) => {
              const IconComponent = telemetry.icon
              return (
                <Card key={telemetry.id} className={`border-l-4 ${
                  telemetry.severity === "critical" ? "border-l-red-500" :
                  telemetry.severity === "high" ? "border-l-orange-500" :
                  telemetry.severity === "medium" ? "border-l-yellow-500" :
                  "border-l-blue-500"
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          telemetry.severity === "critical" ? "bg-red-100 text-red-600" :
                          telemetry.severity === "high" ? "bg-orange-100 text-orange-600" :
                          telemetry.severity === "medium" ? "bg-yellow-100 text-yellow-600" :
                          "bg-blue-100 text-blue-600"
                        }`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{telemetry.title}</CardTitle>
                          <CardDescription>
                            {telemetry.device} - {telemetry.location}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getSeverityColor(telemetry.severity)}>
                          {telemetry.severity.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <p className="text-sm">{telemetry.message}</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Current Value:</span>
                          <div className="font-semibold">{telemetry.currentValue}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Threshold:</span>
                          <div className="font-semibold">{telemetry.threshold}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Timestamp:</span>
                          <div className="font-semibold">{telemetry.timestamp}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
