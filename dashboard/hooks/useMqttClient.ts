import { useEffect, useState, useCallback, useRef } from "react";
import mqtt, { MqttClient } from "mqtt";

interface MQTTOptions {
  brokerUrl: string;                // es. "ws://localhost:9001"
  topics: string[];                 // es. ["sala/telemetria"]
  onMessage: (topic: string, message: string) => void;
}

interface MQTTState {
  client: MqttClient | null;
  isConnected: boolean;
}

/**
 * Hook per gestire connessione MQTT, sottoscrizione e ricezione messaggi
 */
export function useMQTTClient({ brokerUrl, topics, onMessage }: MQTTOptions): MQTTState {
  const [client, setClient] = useState<MqttClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const onMessageRef = useRef(onMessage);
  const subscribedTopicsRef = useRef<string[]>([]);

  // Keep the onMessage callback ref updated
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  // Initialize MQTT client only once
  useEffect(() => {
    const mqttClient = mqtt.connect(brokerUrl, {
      reconnectPeriod: 1000,  // tenta riconnessione ogni secondo
      connectTimeout: 4000,
    });

    setClient(mqttClient);

    mqttClient.on("connect", () => {
      console.log("✅ Connesso al broker MQTT:", brokerUrl);
      setIsConnected(true);
    });

    mqttClient.on("reconnect", () => {
      console.log("♻️ Tentativo di riconnessione...");
    });

    mqttClient.on("disconnect", () => {
      console.log("🚫 Disconnesso dal broker MQTT");
      setIsConnected(false);
    });

    mqttClient.on("error", (err) => {
      console.error("❌ Errore MQTT:", err);
    });

    mqttClient.on("message", (topic, message) => {
      onMessageRef.current(topic, message.toString());
    });

    return () => {
      if (mqttClient.connected) {
        mqttClient.end(true);
      }
    };
  }, [brokerUrl]);

  // Handle topic subscriptions separately
  useEffect(() => {
    if (!client || !isConnected) return;

    // Unsubscribe from old topics
    subscribedTopicsRef.current.forEach((topic) => {
      if (!topics.includes(topic)) {
        client.unsubscribe(topic, (err) => {
          if (err) {
            console.error(`❌ Errore disattivazione sottoscrizione a ${topic}:`, err);
          } else {
            console.log(`📡 Disattivata sottoscrizione a ${topic}`);
          }
        });
      }
    });

    // Subscribe to new topics
    topics.forEach((topic) => {
      if (!subscribedTopicsRef.current.includes(topic)) {
        client.subscribe(topic, (err) => {
          if (err) {
            console.error(`❌ Errore sottoscrizione a ${topic}:`, err);
          } else {
            console.log(`📡 Sottoscritto a ${topic}`);
          }
        });
      }
    });

    subscribedTopicsRef.current = [...topics];
  }, [client, isConnected, topics]);

  return { client, isConnected };
}
