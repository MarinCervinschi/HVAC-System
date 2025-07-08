import paho.mqtt.client as mqtt
import json
import logging
from data_collector.models.Room import Room
from data_collector.core.policy_manager import PolicyManager


class DataCollector:
    def __init__(self, room_id: str, policy_file: str):
        self.room_id = room_id
        self.policy_manager = PolicyManager(room_id, policy_file)
        self.logger = logging.getLogger(__name__)

    def connect(self, mqtt_client: mqtt.Client):
        """Connect using an existing MQTT client"""
        topics = [
            (f"hvac/room/{self.room_id}/device/+/telemetry/+", 0),
            (f"hvac/room/{self.room_id}/rack/+/device/+/telemetry/+", 0),
        ]
        mqtt_client.subscribe(topics)

    def handle_message(self, msg):
        """Handle message for this specific room"""
        try:
            telemetry = json.loads(msg.payload.decode())
            self.policy_manager.evaluate(telemetry)
        except Exception as e:
            self.logger.error(f"Error handling telemetry for room {self.room_id}: {e}")
