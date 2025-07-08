#!/usr/bin/env python3
"""
Test script per monitorare gli eventi di controllo (state changes, alarms, policy applications)
tramite topic MQTT di controllo.
"""

import json
import time
import paho.mqtt.client as mqtt
from config.mqtt_conf_params import MqttConfigurationParameters


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ Connected to MQTT broker for control event monitoring")
    else:
        print(f"❌ Failed to connect to MQTT broker. Return code: {rc}")


def on_message(client, userdata, msg):
    try:
        topic = msg.topic
        payload = json.loads(msg.payload.decode())
        
        event_type = payload.get("event_type", "unknown")
        event_data = payload.get("event_data", {})
        timestamp = payload.get("timestamp", 0)
        
        # Format timestamp
        formatted_time = time.strftime("%H:%M:%S", time.localtime(timestamp/1000))
        
        print(f"\n🎛️ [{formatted_time}] CONTROL EVENT: {topic}")
        print(f"   Event Type: {event_type}")
        
        if event_type == "state_change":
            print(f"   Change Type: {event_data.get('change_type', 'unknown')}")
            print(f"   Trigger: {event_data.get('trigger', 'unknown')}")
            print(f"   Previous: {event_data.get('previous_state', {})}")
            print(f"   New: {event_data.get('new_state', {})}")
            print(f"   Reason: {event_data.get('reason', 'N/A')}")
            
        elif event_type == "alarm":
            alarm_type = event_data.get("alarm_type", "unknown")
            severity = event_data.get("severity", "unknown")
            status = event_data.get("status", "unknown")
            description = event_data.get("description", "")
            
            severity_emoji = {
                "critical": "🚨",
                "warning": "⚠️",
                "info": "ℹ️"
            }.get(severity, "❓")
            
            status_emoji = "🟢" if status == "resolved" else "🔴"
            
            print(f"   {severity_emoji} Alarm: {alarm_type} ({status} {status_emoji})")
            print(f"   Severity: {severity}")
            print(f"   Description: {description}")
            
            if "current_value" in event_data:
                print(f"   Current Value: {event_data['current_value']}")
            if "threshold" in event_data:
                print(f"   Threshold: {event_data['threshold']}")
                
        elif event_type == "policy_applied":
            policy_name = event_data.get("policy_name", "unknown")
            action_taken = event_data.get("action_taken", "")
            trigger_condition = event_data.get("trigger_condition", "")
            effectiveness = event_data.get("effectiveness", "unknown")
            
            print(f"   📋 Policy: {policy_name}")
            print(f"   Action: {action_taken}")
            print(f"   Trigger: {trigger_condition}")
            print(f"   Effectiveness: {effectiveness}")
            print(f"   Previous: {event_data.get('previous_state', {})}")
            print(f"   New: {event_data.get('new_state', {})}")
            
        else:
            print(f"   Data: {event_data}")
            
        print("-" * 60)
        
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse JSON: {e}")
    except Exception as e:
        print(f"❌ Error processing message: {e}")


def subscribe_to_control_events(client, room_id="room_A1", rack_id="rack_A1"):
    """Subscribe to all control event topics."""
    
    # Subscribe to control events for all devices and actuators
    control_topic_pattern = f"{MqttConfigurationParameters.BASIC_TOPIC}/{room_id}/{MqttConfigurationParameters.RACK_TOPIC}/{rack_id}/{MqttConfigurationParameters.DEVICE_TOPIC}/+/{MqttConfigurationParameters.CONTROL_TOPIC}/+"
    
    result = client.subscribe(control_topic_pattern, qos=1)
    if result[0] == mqtt.MQTT_ERR_SUCCESS:
        print(f"📡 Subscribed to control events: {control_topic_pattern}")
    else:
        print(f"❌ Failed to subscribe to control events")
    


def main():
    print("🎛️ HVAC Control Event Monitor")
    print("=" * 60)
    print("Monitoring for:")
    print("- State changes (manual, automatic, policy-driven)")
    print("- Alarms (active/resolved)")
    print("- Policy applications")
    print("- Operational status changes")
    print("=" * 60)
    
    # Connect to MQTT broker
    client = mqtt.Client("control_event_monitor")
    client.on_connect = on_connect
    client.on_message = on_message
    
    try:
        client.connect(
            MqttConfigurationParameters.BROKER_ADDRESS,
            MqttConfigurationParameters.BROKER_PORT,
            60
        )
        
        client.loop_start()
        time.sleep(2)  # Wait for connection
        
        # Subscribe to control event topics
        subscribe_to_control_events(client)
        
        print("\n👁️ Monitoring started... Press Ctrl+C to stop")
        print("Now you can:")
        print("1. Run the HVAC system: python process.py")
        print("2. Send CoAP commands to trigger events")
        print("3. Watch this monitor for control events")
        print()
        
        # Keep monitoring
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\n👋 Stopping monitor...")
    except Exception as e:
        print(f"❌ Error during monitoring: {e}")
    finally:
        client.loop_stop()
        client.disconnect()


if __name__ == "__main__":
    main()
