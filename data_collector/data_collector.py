import paho.mqtt.client as mqtt
import json
from data_collector.models.Room import Room
from data_collector.resources.policy_manager import PolicyManager


class DataCollector:
    def __init__(self, room: Room, policy_manager: PolicyManager):
        self.room = room
        self.policy_manager = policy_manager
        self.client = mqtt.Client()
        self.client.on_message = self.on_message

    def connect(self, broker_host, broker_port):
        self.client.connect(broker_host, broker_port)
        self.client.subscribe("telemetry/#")  # topic wildcard
        self.client.loop_start()

    def on_message(self, client, userdata, msg):
        try:
            telemetry = json.loads(msg.payload.decode())
            print(f"[DataCollector] Received telemetry: {telemetry}")
            self.policy_manager.evaluate(telemetry)
        except Exception as e:
            print(f"Error handling telemetry: {e}")
