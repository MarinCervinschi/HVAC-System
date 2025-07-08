import paho.mqtt.client as mqtt
import json
import logging
from data_collector.models.Room import Room
from data_collector.core.policy_manager import PolicyManager


import threading
import requests
import time


class DataCollector:
    def __init__(
        self, room_id: str, policy_file: str, cloud_url: str, sync_interval: int = 30
    ):
        self.room_id = room_id
        self.policy_manager = PolicyManager(room_id, policy_file)
        self.logger = logging.getLogger(__name__)
        self.collected_telemetries = []
        self.cloud_url = cloud_url
        self.sync_interval = sync_interval
        self._start_sync_thread()

    def connect(self, mqtt_client: mqtt.Client):
        """Connect to MQTT broker and subscribe to telemetry topics for this room"""
        topics = [
            (f"hvac/room/{self.room_id}/device/+/telemetry/+", 0),
            (f"hvac/room/{self.room_id}/device/+/control/+", 1),
            (f"hvac/room/{self.room_id}/rack/+/device/+/telemetry/+", 0),
            (f"hvac/room/{self.room_id}/rack/+/device/+/control/+", 1),
        ]
        mqtt_client.subscribe(topics)

    def handle_message(self, msg):
        """Handle message for this specific room"""
        try:
            telemetry = json.loads(msg.payload.decode())
            if msg.topic.split("/")[-2] == "telemetry":
                self.policy_manager.evaluate(telemetry)
            self._collect_telemetry(telemetry)
        except Exception as e:
            self.logger.error(f"Error handling telemetry for room {self.room_id}: {e}")

    def _collect_telemetry(self, telemetry: dict):
        self.collected_telemetries.append(telemetry)

    def _start_sync_thread(self):
        def sync_loop():
            while True:
                time.sleep(self.sync_interval)
                self._sync_with_cloud()

        thread = threading.Thread(target=sync_loop, daemon=True)
        thread.start()

    def _sync_with_cloud(self):
        if not self.collected_telemetries:
            return

        try:
            payload = {
                "room_id": self.room_id,
                "timestamp": int(time.time()),
                "telemetries": self.collected_telemetries,
            }

            response = requests.post(f"{self.cloud_url}/sync", json=payload)

            if response.status_code == 200:
                self.logger.info(
                    f"✅ Synced {len(self.collected_telemetries)} telemetry entries for room {self.room_id}"
                )
                self.collected_telemetries.clear()
            else:
                self.logger.warning(
                    f"❌ Sync failed for room {self.room_id}: {response.status_code} - {response.text}"
                )

        except Exception as e:
            self.logger.error(
                f"❌ Error syncing with cloud for room {self.room_id}: {e}"
            )
