import paho.mqtt.client as mqtt
import json
import logging
from data_collector.models.Room import Room
from data_collector.core.policy_manager import PolicyManager
from config.mqtt_conf_params import MqttConfigurationParameters


class DataCollector:
    def __init__(self, room: Room, policy_manager: PolicyManager):
        self.room = room
        self.policy_manager = policy_manager
        self.logger = logging.getLogger(__name__)

    def connect(self, mqtt_client: mqtt.Client):
        """Connect using an existing MQTT client"""
        mqtt_client.on_message = self.on_message
        mqtt_client.subscribe("/hvac/room/+/rack/+/device/+/telemetry/+")

    def on_message(self, client, userdata, msg):
        try:
            telemetry = json.loads(msg.payload.decode())
            self.logger.info(f"[DataCollector] Received telemetry: {telemetry}")
            self.policy_manager.evaluate(telemetry)
        except Exception as e:
            self.logger.error(f"Error handling telemetry: {e}")
