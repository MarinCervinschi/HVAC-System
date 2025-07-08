"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, AlertCircle, CheckCircle, Clock, Thermometer, Droplets, Zap, X, Snowflake, Fan, Gauge } from "lucide-react"
import { useMQTTClient } from "@/hooks/useMqttClient"
import { formatName, formatType } from "@/lib/utils"
import { toast } from "sonner"


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

  // Check for specific device types in the deviceType string
  if (deviceType.toLowerCase().includes('cooling_levels') || deviceType.toLowerCase().includes('cooling')) {
    return Snowflake;  // Ice/snowflake icon for cooling systems
  }
  if (deviceType.toLowerCase().includes('fan')) {
    return Fan;  // Fan icon for fan devices
  }
  if (deviceType.toLowerCase().includes('pump')) {
    return Gauge;  // Gauge icon for pump devices
  }
  
  // Fallback to original logic for other types
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

interface DeviceTelemetry {
  id: string;
  room_name?: string; // Optional room name for telemetry
  rack_name?: string; // Optional rack name for telemetry
  object_name?: string; // Optional object name for telemetry
  device_name?: string; // Optional device name for telemetry

  location?: string; // Location derived from room and rack names
  event_type?: string; // Event type for telemetry
  title: string;
  description: string;
  info_status?: string; 
  severity: "critical" | "high" | "medium" | "low";
  threshold: string;
  timestamp: string;
  icon: React.ComponentType<{ className?: string }>;
  deviceType?: string;
}


// Helper function to parse MQTT telemetry message
const parseTelemetryMessage = (topic: string, message: string): DeviceTelemetry | null => {
  try {
    const data = JSON.parse(message);
    
    // Extract room and device info from topic
    // Topic format: hvac/room/{roomId}/rack/{rackId}/device/{deviceId}/control/{resourceId}
    // or: hvac/room/{roomId}/device/{deviceId}/control/{resourceId}
    const topicParts = topic.split('/');

    const roomName = formatName(data.metadata.room_id);
    const rackName = data.metadata.rack_id ? formatName(data.metadata.rack_id) : null;

    let location;
    if (rackName){
      location = `${roomName} - ${rackName}`;
    } else {
      location = roomName;
    }

    const deviceName = formatName(data.metadata.object_id);
    const resourceName = formatName(data.metadata.resource_id) || '';

    const eventType = data.event_type || '';
    const title = (formatType(data.type) + " Actuator " + eventType).toUpperCase();
    const description = data.event_data.description || '';
    const oldState = data.event_data.old_state;
    const newState = data.event_data.new_state;

    // Handle POLICY_APPLIED events
    if (eventType === "POLICY_APPLIED") {
      const metadata = data.metadata || {};
      const eventData = data.event_data || {};
      const deviceType = data.type || '';
      let info_status = '';
      
      if (oldState && newState) {
        // Compare states to create meaningful message
        if (oldState.status !== newState.status) {
          info_status += ` - Status changed from ${oldState.status} to ${newState.status}`;
        }
        if (oldState.speed !== newState.speed) {
          info_status += ` - Speed changed from ${oldState.speed || 0} to ${newState.speed || 0}`;
        }
        if (oldState.level !== newState.level) {
          info_status += ` - Level changed from ${oldState.level || 0} to ${newState.level || 0}`;
        }
        if (oldState.target_speed !== newState.target_speed) {
          info_status += ` - Target speed: ${newState.target_speed || 0}`;
        }
      }
      
      // Get threshold from event data
      const threshold = eventData.threshold ? `${eventData.threshold}` : 'N/A';
      
      const telemetry: DeviceTelemetry = {
        id: `policy_${Date.now()}_${Math.random()}`,
        room_name: roomName,
        rack_name: rackName || undefined,
        object_name: deviceName,
        device_name: resourceName,
        location: location,
        event_type: eventType,
        info_status: info_status,
        title: title,
        description: description,
        severity: "critical", // Always critical for POLICY_APPLIED
        threshold: threshold,
        timestamp: new Date(data.timestamp || Date.now()).toLocaleString(),
        icon: getDeviceIcon(deviceType, 'policy'),
        deviceType: deviceType
      };
      
      return telemetry;
    }
    
    // Handle MANUAL events
    if (eventType === "MANUAL") {
      const metadata = data.metadata || {};
      const deviceType = data.type || '';
      let info_status = '';
      
      if (oldState && newState) {
        // Compare states to create meaningful message for manual changes
        if (oldState.status !== newState.status) {
          info_status += ` - Status manually changed from ${oldState.status} to ${newState.status}`;
        }
        if (oldState.speed !== newState.speed) {
          info_status += ` - Speed manually adjusted from ${oldState.speed || 0} to ${newState.speed || 0}`;
        }
        if (oldState.level !== newState.level) {
          info_status += ` - Level manually adjusted from ${oldState.level || 0} to ${newState.level || 0}`;
        }
        if (oldState.target_speed !== newState.target_speed) {
          info_status += ` - Target speed manually set to: ${newState.target_speed || 0}`;
        }
      }
      
      const telemetry: DeviceTelemetry = {
        id: `manual_${Date.now()}_${Math.random()}`,
        room_name: roomName,
        rack_name: rackName || undefined,
        object_name: deviceName,
        device_name: resourceName,
        location: location,
        event_type: eventType,
        info_status: info_status,
        title: title,
        description: "Manual device control operation",
        severity: "medium", // Always medium for MANUAL
        threshold: "Manual Control",
        timestamp: new Date(data.timestamp || Date.now()).toLocaleString(),
        icon: getDeviceIcon(deviceType, 'manual'),
        deviceType: deviceType
      };
      return telemetry;
    }
    
    return null;
    

  } catch (error) {
    toast.error('Error parsing MQTT telemetry message: '+ error);
    return null;
  }
};

export default function AlertsPage() {
  const [telemetries, setTelemetries] = useState<DeviceTelemetry[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<string>("Disconnected");

  // MQTT message handler
  const handleMQTTMessage = useCallback((topic: string, message: string) => {
   
    const newTelemetry = parseTelemetryMessage(topic, message);
    if (newTelemetry) {
      setTelemetries(prevTelemetries => {
        // Check if telemetry already exists (avoid duplicates based on unique combination)
        const existingTelemetry = prevTelemetries.find(telemetry => 
          telemetry.object_name === newTelemetry.object_name && 
          telemetry.device_name === newTelemetry.device_name &&
          telemetry.room_name === newTelemetry.room_name &&
          telemetry.rack_name === newTelemetry.rack_name &&
          Math.abs(new Date(telemetry.timestamp).getTime() - new Date(newTelemetry.timestamp).getTime()) < 5000 // Less than 5 seconds apart
        );
        
        if (existingTelemetry) {
          // Update existing telemetry only if it's very recent (within 5 seconds)
          return prevTelemetries.map(telemetry => 
            telemetry.id === existingTelemetry.id 
              ? { ...newTelemetry, id: existingTelemetry.id }
              : telemetry
          );
        } else {
          // Add new telemetry (keep only last 10 entries)
          const updatedTelemetries = [newTelemetry, ...prevTelemetries];
          return updatedTelemetries.slice(0, 10);
        }
      });
    }
  }, []);

  // MQTT connection
  const { client, isConnected } = useMQTTClient({
    brokerUrl: "ws://localhost:9001",
    topics: [
      "hvac/room/+/device/+/control/+",
      "hvac/room/+/rack/+/device/+/control/+"
    ], // Topics to listen for POLICY_APPLIED events
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
        <div className="grid gap-4 md:grid-cols-3">
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
              <div className="text-2xl font-bold">{telemetries?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Device Telemetries */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Device Telemetry</h2>
          <div className="space-y-3">
            {telemetries && telemetries.map((telemetry) => {
              const IconComponent = telemetry.icon
              return (
                <Card key={telemetry.id} className={`border-l-4 min-h-[220px] ${
                  telemetry.severity === "critical" ? "border-l-red-500" :
                  telemetry.severity === "high" ? "border-l-orange-500" :
                  telemetry.severity === "medium" ? "border-l-yellow-500" :
                  "border-l-blue-500"
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                          // Color by device type first, then by severity
                          telemetry.deviceType?.toLowerCase().includes('cooling_levels') || telemetry.deviceType?.toLowerCase().includes('cooling') ? "bg-blue-100 text-blue-600" :
                          telemetry.deviceType?.toLowerCase().includes('fan') ? "bg-green-100 text-green-600" :
                          telemetry.deviceType?.toLowerCase().includes('pump') ? "bg-purple-100 text-purple-600" :
                          // Fallback to severity colors for other types
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
                            {telemetry.object_name} - {telemetry.location}
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
                      <p className="text-sm">{telemetry.description}</p>
                      {telemetry.info_status && (
                        <p className="text-xs text-muted-foreground">{telemetry.info_status}</p>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Device:</span>
                          <div className="font-semibold">{telemetry.object_name}</div>
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
